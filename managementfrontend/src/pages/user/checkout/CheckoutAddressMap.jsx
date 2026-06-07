import React, { useEffect, useRef, useState, useCallback } from "react";
import trackasiagl from "trackasia-gl";
import "trackasia-gl/dist/trackasia-gl.css";

import {
  autocompleteAddress,
  getPlaceDetail,
  previewDelivery,
} from "../../../apis/mapApi";

import { getActiveStores } from "../../../apis/publicStoreApi";

import "./CheckoutAddressMap.css";

const TRACKASIA_KEY = import.meta.env.VITE_TRACKASIA_MAP_KEY;

const DEFAULT_CENTER = {
  lat: 20.962658817782447,
  lng: 105.7488215473782,
};

const getSuggestionTitle = (item) => {
  return (
    item?.name ||
    item?.structured_formatting?.main_text ||
    item?.properties?.name ||
    item?.text ||
    "Địa chỉ gợi ý"
  );
};

const getSuggestionDescription = (item) => {
  return (
    item?.description ||
    item?.formatted_address ||
    item?.formattedAddress ||
    item?.structured_formatting?.secondary_text ||
    item?.properties?.label ||
    item?.properties?.address ||
    item?.place_name ||
    ""
  );
};

const buildDisplayAddressFromSuggestion = (item) => {
  const title = getSuggestionTitle(item);
  const description = getSuggestionDescription(item);

  if (!title && !description) return "";
  if (!description) return title;

  const normalizedTitle = title.trim().toLowerCase();
  const normalizedDescription = description.trim().toLowerCase();

  if (normalizedDescription.startsWith(normalizedTitle)) {
    return description;
  }

  return `${title}, ${description}`;
};

const getPredictions = (data) => {
  const raw = data?.data ?? data;

  if (Array.isArray(raw?.predictions)) return raw.predictions;
  if (Array.isArray(raw?.results)) return raw.results;
  if (Array.isArray(raw?.features)) return raw.features;
  if (Array.isArray(raw)) return raw;

  return [];
};

const getPlaceLocation = (data) => {
  const result = data?.result || data?.data?.result || data;
  const location = result?.geometry?.location || result?.location;

  if (location?.lat !== undefined && location?.lng !== undefined) {
    return {
      lat: Number(location.lat),
      lng: Number(location.lng),
      formattedAddress:
        result.formatted_address ||
        result.formattedAddress ||
        result.description ||
        result.name ||
        "",
    };
  }

  if (location?.lat !== undefined && location?.lon !== undefined) {
    return {
      lat: Number(location.lat),
      lng: Number(location.lon),
      formattedAddress:
        result.formatted_address ||
        result.formattedAddress ||
        result.description ||
        result.name ||
        "",
    };
  }

  const coordinates =
    result?.geometry?.coordinates || result?.coordinates || result?.center;

  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    return {
      lng: Number(coordinates[0]),
      lat: Number(coordinates[1]),
      formattedAddress:
        result.formatted_address ||
        result.formattedAddress ||
        result.description ||
        result.name ||
        "",
    };
  }

  if (result?.latitude !== undefined && result?.longitude !== undefined) {
    return {
      lat: Number(result.latitude),
      lng: Number(result.longitude),
      formattedAddress:
        result.formatted_address ||
        result.formattedAddress ||
        result.description ||
        result.name ||
        "",
    };
  }

  return null;
};

const CheckoutAddressMap = ({
  subtotal,
  selectedAddress,
  setSelectedAddress,
  deliveryPreview,
  setDeliveryPreview,
  addressDetail = "",
  onAddressDetailChange,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const storeMarkersRef = useRef([]);

  const [keyword, setKeyword] = useState(
    selectedAddress?.formattedAddress || "",
  );
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [checkingDistance, setCheckingDistance] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const keywordRef = useRef(keyword);
  const selectedAddressRef = useRef(selectedAddress);
  const subtotalRef = useRef(subtotal);

  useEffect(() => {
    keywordRef.current = keyword;
  }, [keyword]);

  useEffect(() => {
    selectedAddressRef.current = selectedAddress;
  }, [selectedAddress]);

  useEffect(() => {
    subtotalRef.current = subtotal;
  }, [subtotal]);

  const setCustomerMarker = useCallback((lat, lng) => {
    if (!mapRef.current) return;

    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLngLat([lng, lat]);
      return;
    }

    customerMarkerRef.current = new trackasiagl.Marker({
      color: "#ff8914",
    })
      .setLngLat([lng, lat])
      .addTo(mapRef.current);
  }, []);

  const moveMapToAddress = useCallback(
    ({ lat, lng }) => {
      if (!mapRef.current) return;

      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: Math.max(mapRef.current.getZoom(), 15),
        essential: true,
      });

      setCustomerMarker(lat, lng);
    },
    [setCustomerMarker],
  );

  const clearStoreMarkers = useCallback(() => {
    storeMarkersRef.current.forEach((marker) => marker.remove());
    storeMarkersRef.current = [];
  }, []);

  const renderStoreMarkers = useCallback(
    (stores) => {
      if (!mapRef.current) return;

      clearStoreMarkers();

      stores.forEach((store) => {
        const lat = Number(store.latitude);
        const lng = Number(store.longitude);

        if (
          Number.isNaN(lat) ||
          Number.isNaN(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180
        ) {
          return;
        }

        const popup = new trackasiagl.Popup({
          offset: 24,
        }).setHTML(`
          <div style="min-width: 180px">
            <strong>${store.name || "Cửa hàng NexCoffee"}</strong>
            <p style="margin: 6px 0 0">${store.address || ""}</p>
            ${
              store.phone
                ? `<p style="margin: 6px 0 0">SĐT: ${store.phone}</p>`
                : ""
            }
          </div>
        `);

        const markerElement = document.createElement("div");
        markerElement.className = "checkout-store-marker";

        const pinElement = document.createElement("div");
        pinElement.className = "checkout-store-marker-pin";

        const labelElement = document.createElement("div");
        labelElement.className = "checkout-store-marker-label";
        labelElement.textContent = store.name || "Cửa hàng NexCoffee";

        markerElement.appendChild(pinElement);
        markerElement.appendChild(labelElement);

        const marker = new trackasiagl.Marker({
          element: markerElement,
          anchor: "bottom",
        })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(mapRef.current);

        storeMarkersRef.current.push(marker);
      });
    },
    [clearStoreMarkers],
  );

  const updateSelectedLocation = useCallback(
    async ({
      formattedAddress,
      lat,
      lng,
      shouldMoveMap = true,
      shouldUpdateKeyword = false,
    }) => {
      const finalAddress =
        formattedAddress?.trim() || "Vị trí được chọn trên bản đồ";

      const nextAddress = {
        formattedAddress: finalAddress,
        customerLatitude: lat,
        customerLongitude: lng,
      };

      setSelectedAddress(nextAddress);
      setShowSuggestions(false);
      setSuggestions([]);

      if (shouldUpdateKeyword) {
        setKeyword(finalAddress);
      }

      if (shouldMoveMap) {
        moveMapToAddress({ lat, lng });
      } else {
        setCustomerMarker(lat, lng);
      }

      const preview = await previewDelivery({
        formattedAddress: finalAddress,
        customerLatitude: lat,
        customerLongitude: lng,
        subtotal: subtotalRef.current,
      });

      setDeliveryPreview(preview);
    },
    [
      moveMapToAddress,
      setCustomerMarker,
      setDeliveryPreview,
      setSelectedAddress,
    ],
  );

  useEffect(() => {
    if (!TRACKASIA_KEY) return;
    if (!mapContainerRef.current || mapRef.current) return;

    const initialLat =
      selectedAddressRef.current?.customerLatitude || DEFAULT_CENTER.lat;
    const initialLng =
      selectedAddressRef.current?.customerLongitude || DEFAULT_CENTER.lng;

    mapRef.current = new trackasiagl.Map({
      container: mapContainerRef.current,
      style: `https://maps.track-asia.com/styles/v2/streets.json?key=${TRACKASIA_KEY}`,
      center: [initialLng, initialLat],
      zoom: 13,
    });

    mapRef.current.addControl(new trackasiagl.NavigationControl(), "top-right");

    mapRef.current.on("load", async () => {
      if (
        selectedAddressRef.current?.customerLatitude &&
        selectedAddressRef.current?.customerLongitude
      ) {
        setCustomerMarker(
          selectedAddressRef.current.customerLatitude,
          selectedAddressRef.current.customerLongitude,
        );
      }

      try {
        const stores = await getActiveStores();
        renderStoreMarkers(Array.isArray(stores) ? stores : []);
      } catch (error) {
        console.warn("Không thể tải danh sách cửa hàng lên bản đồ:", error);
      }
    });

    mapRef.current.on("click", async (event) => {
      const lat = event.lngLat.lat;
      const lng = event.lngLat.lng;

      const currentKeyword = keywordRef.current?.trim();
      const currentAddress =
        selectedAddressRef.current?.formattedAddress?.trim();

      const formattedAddress =
        currentKeyword || currentAddress || "Vị trí được chọn trên bản đồ";

      try {
        setCheckingDistance(true);

        await updateSelectedLocation({
          formattedAddress,
          lat,
          lng,
          shouldMoveMap: false,
          shouldUpdateKeyword: false,
        });
      } catch (error) {
        setDeliveryPreview({
          deliverable: false,
          message: "Không thể kiểm tra vị trí giao hàng vừa chọn.",
        });
      } finally {
        setCheckingDistance(false);
      }
    });

    return () => {
      clearStoreMarkers();

      mapRef.current?.remove();
      mapRef.current = null;
      customerMarkerRef.current = null;
    };
  }, [
    clearStoreMarkers,
    renderStoreMarkers,
    setCustomerMarker,
    setDeliveryPreview,
    updateSelectedLocation,
  ]);

  useEffect(() => {
    const normalized = keyword.trim();

    if (
      selectedAddress?.formattedAddress &&
      selectedAddress.formattedAddress !== normalized
    ) {
      setSelectedAddress(null);
      setDeliveryPreview(null);
    }

    if (normalized.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingSuggest(true);

        const data = await autocompleteAddress(normalized);
        const nextSuggestions = getPredictions(data);

        setSuggestions(nextSuggestions);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setLoadingSuggest(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [keyword, selectedAddress, setDeliveryPreview, setSelectedAddress]);

  const handleSelectSuggestion = async (suggestion) => {
    const placeId =
      suggestion.place_id ||
      suggestion.placeId ||
      suggestion.properties?.id ||
      suggestion.id;

    if (!placeId) {
      setDeliveryPreview({
        deliverable: false,
        message: "Không lấy được mã địa chỉ. Vui lòng chọn gợi ý khác.",
      });
      return;
    }

    try {
      setCheckingDistance(true);

      const detail = await getPlaceDetail(placeId);
      const location = getPlaceLocation(detail);

      if (!location) {
        setDeliveryPreview({
          deliverable: false,
          message:
            "Không lấy được tọa độ địa chỉ này. Vui lòng chọn địa chỉ khác.",
        });
        return;
      }

      const suggestionAddress = buildDisplayAddressFromSuggestion(suggestion);

      const formattedAddress =
        suggestionAddress ||
        location.formattedAddress ||
        suggestion.description ||
        suggestion.formatted_address ||
        suggestion.name ||
        "Địa chỉ giao hàng";

      setKeyword(formattedAddress);
      setSuggestions([]);
      setShowSuggestions(false);

      await updateSelectedLocation({
        formattedAddress,
        lat: location.lat,
        lng: location.lng,
        shouldMoveMap: true,
        shouldUpdateKeyword: false,
      });
    } catch (error) {
      setDeliveryPreview({
        deliverable: false,
        message: "Không thể kiểm tra khoảng cách giao hàng.",
      });
    } finally {
      setCheckingDistance(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setDeliveryPreview({
        deliverable: false,
        message: "Trình duyệt không hỗ trợ lấy vị trí hiện tại.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const currentKeyword = keywordRef.current?.trim();
        const currentAddress =
          selectedAddressRef.current?.formattedAddress?.trim();

        const formattedAddress =
          currentKeyword || currentAddress || "Vị trí hiện tại của bạn";

        try {
          setCheckingDistance(true);

          await updateSelectedLocation({
            formattedAddress,
            lat,
            lng,
            shouldMoveMap: true,
            shouldUpdateKeyword: false,
          });
        } catch {
          setDeliveryPreview({
            deliverable: false,
            message: "Không thể kiểm tra vị trí hiện tại.",
          });
        } finally {
          setCheckingDistance(false);
        }
      },
      () => {
        setDeliveryPreview({
          deliverable: false,
          message:
            "Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  useEffect(() => {
    const reloadPreview = async () => {
      if (
        !selectedAddress?.customerLatitude ||
        !selectedAddress?.customerLongitude
      ) {
        return;
      }

      try {
        const preview = await previewDelivery({
          formattedAddress: selectedAddress.formattedAddress,
          customerLatitude: selectedAddress.customerLatitude,
          customerLongitude: selectedAddress.customerLongitude,
          subtotal,
        });

        setDeliveryPreview(preview);
      } catch {
        setDeliveryPreview({
          deliverable: false,
          message: "Không thể kiểm tra phí giao hàng.",
        });
      }
    };

    reloadPreview();
  }, [subtotal, selectedAddress, setDeliveryPreview]);

  return (
    <div className="checkout-map-block">
      <label>Địa chỉ giao hàng</label>

      <div className="checkout-map-input-wrap">
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

        {(loadingSuggest || checkingDistance) && (
          <span className="checkout-map-loading">Đang kiểm tra...</span>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="checkout-map-suggestions">
            {suggestions.map((item, index) => {
              const placeId =
                item.place_id || item.placeId || item.properties?.id || item.id;

              const title = getSuggestionTitle(item);
              const description = getSuggestionDescription(item) || title;

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

      <div className="checkout-map-detail-field">
        <label>Địa chỉ chi tiết</label>

        <input
          type="text"
          value={addressDetail}
          placeholder="Số nhà, ngõ, tầng, tên tòa nhà..."
          onChange={(event) => onAddressDetailChange?.(event.target.value)}
        />
      </div>

      <div className="checkout-map-actions">
        <button type="button" onClick={handleUseCurrentLocation}>
          Lấy vị trí hiện tại
        </button>
      </div>

      {TRACKASIA_KEY ? (
        <div ref={mapContainerRef} className="checkout-small-map" />
      ) : (
        <div className="checkout-small-map checkout-small-map-empty">
          Bản đồ chưa sẵn sàng. Vui lòng nhập địa chỉ giao hàng.
        </div>
      )}

      <p className="checkout-map-note">
        Marker màu nâu là vị trí cửa hàng. Marker màu cam là vị trí giao hàng
        của bạn. Bạn có thể bấm trực tiếp trên bản đồ để chỉnh chính xác điểm
        giao hàng.
      </p>

      {deliveryPreview?.message && (
        <div
          className={`checkout-delivery-preview ${
            deliveryPreview.deliverable ? "is-ok" : "is-error"
          }`}
        >
          {deliveryPreview.message}

          {deliveryPreview.nearestStoreName && (
            <span>Quán gần nhất: {deliveryPreview.nearestStoreName}</span>
          )}

          {deliveryPreview.distanceMeters && (
            <span>
              Khoảng cách: {(deliveryPreview.distanceMeters / 1000).toFixed(1)}{" "}
              km
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CheckoutAddressMap;
