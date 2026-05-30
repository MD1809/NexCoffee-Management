import React, { useEffect, useRef, useState } from "react";
import trackasiagl from "trackasia-gl";
import "trackasia-gl/dist/trackasia-gl.css";

import {
  autocompleteAddress,
  getPlaceDetail,
  previewDelivery,
} from "../../../apis/mapApi";

import "./CheckoutAddressMap.css";

const TRACKASIA_KEY = import.meta.env.VITE_TRACKASIA_MAP_KEY;

const getSuggestionTitle = (item) => {
  return (
    item.name ||
    item.structured_formatting?.main_text ||
    item.properties?.name ||
    item.text ||
    ""
  );
};

const getSuggestionDescription = (item) => {
  return (
    item.description ||
    item.formatted_address ||
    item.structured_formatting?.secondary_text ||
    item.properties?.label ||
    item.properties?.address ||
    item.place_name ||
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
  const location = result?.geometry?.location;

  if (location?.lat && location?.lng) {
    return {
      lat: Number(location.lat),
      lng: Number(location.lng),
      formattedAddress:
        result.formatted_address ||
        result.formattedAddress ||
        result.description ||
        result.name,
    };
  }

  const coordinates = result?.geometry?.coordinates;

  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    return {
      lng: Number(coordinates[0]),
      lat: Number(coordinates[1]),
      formattedAddress:
        result.formatted_address ||
        result.formattedAddress ||
        result.description ||
        result.name,
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
  const markerRef = useRef(null);

  const [keyword, setKeyword] = useState(
    selectedAddress?.formattedAddress || "",
  );
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [checkingDistance, setCheckingDistance] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new trackasiagl.Map({
      container: mapContainerRef.current,
      style: `https://maps.track-asia.com/styles/v2/streets.json?key=${TRACKASIA_KEY}`,
      center: [105.804817, 21.028511],
      zoom: 13,
    });

    mapRef.current.addControl(new trackasiagl.NavigationControl(), "top-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const normalized = keyword.trim();

    if (selectedAddress?.formattedAddress !== normalized) {
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
  }, [keyword]);

  const moveMapToAddress = ({ lat, lng }) => {
    if (!mapRef.current) return;

    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 16,
    });

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    } else {
      markerRef.current = new trackasiagl.Marker({ color: "#ff8914" })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
    }
  };

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
        suggestion.name;

      const nextAddress = {
        formattedAddress,
        customerLatitude: location.lat,
        customerLongitude: location.lng,
      };

      setKeyword(formattedAddress);
      setSelectedAddress(nextAddress);
      setShowSuggestions(false);
      // setSuggestions([]);

      moveMapToAddress({
        lat: location.lat,
        lng: location.lng,
      });

      const preview = await previewDelivery({
        formattedAddress,
        customerLatitude: location.lat,
        customerLongitude: location.lng,
        subtotal,
      });

      setDeliveryPreview(preview);
    } catch (error) {
      setDeliveryPreview({
        deliverable: false,
        message: "Không thể kiểm tra khoảng cách giao hàng.",
      });
    } finally {
      setCheckingDistance(false);
    }
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
  }, [subtotal]);

  return (
    <div className="checkout-map-block">
      <label>Địa chỉ giao hàng</label>

      <div className="checkout-map-input-wrap">
        <input
          type="text"
          value={keyword}
          placeholder="Nhập địa chỉ và chọn từ gợi ý"
          onFocus={() => setShowSuggestions(true)}
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
              const placeId = item.place_id || item.placeId || item.id;

              const title =
                item.name ||
                item.structured_formatting?.main_text ||
                "Địa chỉ gợi ý";

              const description =
                item.description ||
                item.formatted_address ||
                item.structured_formatting?.secondary_text ||
                title;

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

      <div ref={mapContainerRef} className="checkout-small-map" />

      {deliveryPreview?.message && (
        <div
          className={`checkout-delivery-preview ${
            deliveryPreview.deliverable ? "is-ok" : "is-error"
          }`}
        >
          {deliveryPreview.message}

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
