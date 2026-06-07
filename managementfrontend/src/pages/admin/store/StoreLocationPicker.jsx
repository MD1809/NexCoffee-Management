import { useCallback, useEffect, useRef, useState } from "react";
import trackasiagl from "trackasia-gl";
import "trackasia-gl/dist/trackasia-gl.css";
import {
  getStorePlaceDetail,
  reverseStoreGeocode,
  searchStoreAddressSuggestions,
} from "../../../apis/storeMapApi";
import { toast } from "react-toastify";

const DEFAULT_CENTER = {
  lat: 21.028511,
  lng: 105.804817,
};

const TRACKASIA_KEY = import.meta.env.VITE_TRACKASIA_MAP_KEY;

function normalizeSuggestions(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.predictions)) return data.predictions;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.features)) return data.features;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function getSuggestionLabel(item) {
  if (!item) return "";

  if (item.description) return item.description;
  if (item.formattedAddress) return item.formattedAddress;
  if (item.formatted_address) return item.formatted_address;
  if (item.address) return item.address;
  if (item.name) return item.name;

  const mainText = item.structured_formatting?.main_text || "";
  const secondaryText = item.structured_formatting?.secondary_text || "";

  return [mainText, secondaryText].filter(Boolean).join(", ");
}

function getSuggestionTitle(item) {
  return (
    item?.name ||
    item?.structured_formatting?.main_text ||
    item?.properties?.name ||
    "Địa chỉ gợi ý"
  );
}

function getSuggestionDescription(item) {
  return (
    item?.description ||
    item?.formatted_address ||
    item?.formattedAddress ||
    item?.structured_formatting?.secondary_text ||
    item?.properties?.label ||
    getSuggestionTitle(item)
  );
}

function getSuggestionPlaceId(item) {
  return (
    item?.place_id || item?.placeId || item?.properties?.id || item?.id || null
  );
}

function getFormattedAddress(data) {
  if (!data) return "";

  if (data.formattedAddress) return data.formattedAddress;
  if (data.formatted_address) return data.formatted_address;
  if (data.address) return data.address;
  if (data.description) return data.description;
  if (data.name) return data.name;

  if (data.result?.formatted_address) return data.result.formatted_address;
  if (data.result?.formattedAddress) return data.result.formattedAddress;
  if (data.result?.description) return data.result.description;
  if (data.result?.name) return data.result.name;

  if (Array.isArray(data.results) && data.results[0]) {
    return (
      data.results[0].formatted_address ||
      data.results[0].formattedAddress ||
      data.results[0].description ||
      data.results[0].name ||
      ""
    );
  }

  return "";
}

function getLatLng(data) {
  if (!data) return null;

  const source = data.result || data.data?.result || data;
  const location = source.geometry?.location || source.location;

  const lat =
    source.latitude ??
    source.lat ??
    location?.lat ??
    source.geometry?.coordinates?.[1];

  const lng =
    source.longitude ??
    source.lng ??
    source.lon ??
    location?.lng ??
    location?.lon ??
    source.geometry?.coordinates?.[0];

  if (lat === undefined || lng === undefined) return null;

  const latitude = Number(lat);
  const longitude = Number(lng);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

  return { latitude, longitude };
}

export default function StoreLocationPicker({ formData, setFormData }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [inputMode, setInputMode] = useState("MAP");
  const [keyword, setKeyword] = useState(formData.address || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);

  const setMarker = useCallback((latitude, longitude) => {
    if (!mapRef.current) return;

    const lngLat = [longitude, latitude];

    if (!markerRef.current) {
      markerRef.current = new trackasiagl.Marker({
        color: "#ff8914",
        draggable: true,
      })
        .setLngLat(lngLat)
        .addTo(mapRef.current);

      markerRef.current.on("dragend", async () => {
        const markerLngLat = markerRef.current.getLngLat();
        await updatePositionFromLatLng(
          markerLngLat.lat,
          markerLngLat.lng,
          true,
        );
      });
    } else {
      markerRef.current.setLngLat(lngLat);
    }
  }, []);

  const updatePositionFromLatLng = useCallback(
    async (latitude, longitude, shouldReverse = false) => {
      setFormData((prev) => ({
        ...prev,
        latitude,
        longitude,
      }));

      setMarker(latitude, longitude);

      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom: mapRef.current.getZoom(),
          essential: true,
        });
      }

      if (!shouldReverse) return;

      try {
        setUpdatingLocation(true);

        const data = await reverseStoreGeocode(latitude, longitude);
        const address = getFormattedAddress(data);

        if (address) {
          setFormData((prev) => ({
            ...prev,
            address,
          }));

          setKeyword(address);
        }
      } catch {
        // Không chặn thao tác chọn tọa độ nếu reverse geocode chưa hỗ trợ.
      } finally {
        setUpdatingLocation(false);
      }
    },
    [setFormData, setMarker],
  );

  useEffect(() => {
    setKeyword(formData.address || "");
  }, [formData.address]);

  useEffect(() => {
    if (inputMode !== "MAP") return;
    if (!mapContainerRef.current || mapRef.current) return;
    if (!TRACKASIA_KEY) return;

    const latitude = Number(formData.latitude) || DEFAULT_CENTER.lat;
    const longitude = Number(formData.longitude) || DEFAULT_CENTER.lng;

    const map = new trackasiagl.Map({
      container: mapContainerRef.current,
      style: `https://maps.track-asia.com/styles/v2/streets.json?key=${TRACKASIA_KEY}`,
      center: [longitude, latitude],
      zoom: 14,
    });

    mapRef.current = map;

    map.addControl(new trackasiagl.NavigationControl(), "top-right");

    map.on("load", () => {
      setMarker(latitude, longitude);
    });

    map.on("click", async (event) => {
      const clickedLat = event.lngLat.lat;
      const clickedLng = event.lngLat.lng;

      await updatePositionFromLatLng(clickedLat, clickedLng, true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [inputMode]);

  useEffect(() => {
    const normalized = keyword.trim();

    if (inputMode !== "MAP") return;

    if (normalized.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingSuggest(true);

        const data = await searchStoreAddressSuggestions(normalized);
        const nextSuggestions = normalizeSuggestions(data);

        setSuggestions(nextSuggestions);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggest(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [keyword, inputMode]);

  const handleSelectSuggestion = async (suggestion) => {
    const placeId = getSuggestionPlaceId(suggestion);

    if (!placeId) {
      toast.warning("Không lấy được mã địa chỉ. Vui lòng chọn gợi ý khác.");
      return;
    }

    try {
      setUpdatingLocation(true);

      const detail = await getStorePlaceDetail(placeId);
      const latLng = getLatLng(detail);

      if (!latLng) {
        toast.warning("Không lấy được tọa độ từ địa chỉ đã chọn.");
        return;
      }

      const formattedAddress =
        getSuggestionLabel(suggestion) ||
        getFormattedAddress(detail) ||
        getSuggestionDescription(suggestion);

      setKeyword(formattedAddress);
      setSuggestions([]);
      setShowSuggestions(false);

      setFormData((prev) => ({
        ...prev,
        address: formattedAddress,
        latitude: latLng.latitude,
        longitude: latLng.longitude,
      }));

      await updatePositionFromLatLng(latLng.latitude, latLng.longitude, false);
    } catch (error) {
      console.error(error);
      toast.error("Không lấy được chi tiết địa chỉ.");
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.warning(
        "Không thể sử dụng tính năng lấy vị trí trên trình duyệt này.",
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        await updatePositionFromLatLng(latitude, longitude, true);
      },
      () => {
        toast.error(
          "Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const handleManualChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyManualCoordinates = () => {
    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);

    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      toast.warning("Vĩ độ không hợp lệ.");
      return;
    }

    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      toast.warning("Kinh độ không hợp lệ.");
      return;
    }

    setInputMode("MAP");

    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom: mapRef.current.getZoom() || 16,
          essential: true,
        });

        setMarker(latitude, longitude);
      }
    }, 300);

    toast.success("Đã hiển thị tọa độ trên bản đồ.");
  };
  return (
    <div className="store-location-picker">
      <div className="store-location-mode-tabs">
        <button
          type="button"
          className={inputMode === "MAP" ? "active" : ""}
          onClick={() => setInputMode("MAP")}
        >
          Chọn trên bản đồ
        </button>

        <button
          type="button"
          className={inputMode === "MANUAL" ? "active" : ""}
          onClick={() => setInputMode("MANUAL")}
        >
          Nhập thủ công
        </button>
      </div>

      {inputMode === "MAP" ? (
        <div className="store-location-mode-panel">
          <div className="store-map-search-wrap">
            <label>Tìm địa chỉ cửa hàng</label>

            <input
              type="text"
              value={keyword}
              placeholder="Nhập địa chỉ và chọn từ gợi ý"
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onChange={(event) => {
                setKeyword(event.target.value);
                setShowSuggestions(true);
              }}
            />

            {(loadingSuggest || updatingLocation) && (
              <span className="store-map-loading">Đang tìm...</span>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <div className="store-map-suggestions">
                {suggestions.map((item, index) => {
                  const placeId = getSuggestionPlaceId(item);
                  const title = getSuggestionTitle(item);
                  const description = getSuggestionDescription(item);

                  return (
                    <button
                      type="button"
                      key={placeId || `${title}-${index}`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleSelectSuggestion(item);
                      }}
                    >
                      <strong>{title}</strong>
                      <span>{description}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="admin-store-field admin-store-field-full">
            <label>Địa chỉ cửa hàng</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleManualChange}
              placeholder="Địa chỉ sẽ tự điền khi chọn gợi ý, hoặc bạn có thể chỉnh lại thủ công."
              rows={3}
            />
          </div>

          <div className="store-map-actions">
            <button type="button" onClick={handleUseCurrentLocation}>
              Lấy vị trí hiện tại
            </button>
          </div>

          <div className="admin-store-form-grid">
            <div className="admin-store-field">
              <label>Vĩ độ latitude</label>
              <input
                name="latitude"
                value={formData.latitude}
                onChange={handleManualChange}
                placeholder="21.028511"
              />
            </div>

            <div className="admin-store-field">
              <label>Kinh độ longitude</label>
              <input
                name="longitude"
                value={formData.longitude}
                onChange={handleManualChange}
                placeholder="105.804817"
              />
            </div>
          </div>

          <div className="store-map-box-wrap">
            {!TRACKASIA_KEY ? (
              <div className="store-map-empty">
                Bản đồ chưa sẵn sàng. Vui lòng thử lại sau hoặc nhập địa chỉ thủ
                công.
              </div>
            ) : (
              <div ref={mapContainerRef} className="store-map-box" />
            )}
          </div>

          <p className="store-map-note">
            Bạn có thể tìm địa chỉ, chọn vị trí trên bản đồ, kéo điểm đánh dấu
            hoặc lấy vị trí hiện tại.
          </p>
        </div>
      ) : (
        <div className="store-location-mode-panel">
          <div className="admin-store-field admin-store-field-full">
            <label>Địa chỉ cửa hàng</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleManualChange}
              placeholder="Nhập địa chỉ đầy đủ của cửa hàng..."
              rows={4}
            />
          </div>

          <div className="admin-store-form-grid">
            <div className="admin-store-field">
              <label>Vĩ độ latitude</label>
              <input
                name="latitude"
                value={formData.latitude}
                onChange={handleManualChange}
                placeholder="Ví dụ: 21.028511"
              />
            </div>

            <div className="admin-store-field">
              <label>Kinh độ longitude</label>
              <input
                name="longitude"
                value={formData.longitude}
                onChange={handleManualChange}
                placeholder="Ví dụ: 105.804817"
              />
            </div>
          </div>

          <div className="store-map-actions">
            <button type="button" onClick={handleApplyManualCoordinates}>
              Xem vị trí trên bản đồ
            </button>
          </div>

          <p className="store-map-note">
            Chế độ thủ công dùng khi bạn đã biết chính xác địa chỉ và tọa độ cửa
            hàng.
          </p>
        </div>
      )}
    </div>
  );
}
