import React, { useEffect, useRef, useState } from "react";
import trackasiagl from "trackasia-gl";
import "trackasia-gl/dist/trackasia-gl.css";
import { FaCompass, FaMapMarkerAlt } from "react-icons/fa";
import { getActiveStores } from "../../../apis/publicStoreApi";

const DEFAULT_CENTER = {
  lat: 21.028511,
  lng: 105.804817,
};

const TRACKASIA_KEY = import.meta.env.VITE_TRACKASIA_MAP_KEY;

const StoreLocatorMap = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const popupsRef = useRef({});

  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Tải danh sách cửa hàng
  useEffect(() => {
    let isMounted = true;

    const fetchStores = async () => {
      try {
        setLoading(true);
        const data = await getActiveStores();
        if (isMounted) {
          const storeList = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : [];
          setStores(storeList);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách cửa hàng:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStores();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Khởi tạo bản đồ Track Asia khi có danh sách cửa hàng thực tế
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !TRACKASIA_KEY) return;

    const map = new trackasiagl.Map({
      container: mapContainerRef.current,
      style: `https://maps.track-asia.com/styles/v2/streets.json?key=${TRACKASIA_KEY}`,
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: 12,
      scrollZoom: true,
      dragPan: true,
      doubleClickZoom: true,
    });

    // Thêm cụm nút điều khiển zoom & góc quay
    map.addControl(new trackasiagl.NavigationControl(), "top-right");

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [stores.length]);

  // 3. Render Markers & Bounds khi có danh sách cửa hàng
  useEffect(() => {
    if (!mapRef.current) return;

    // Xóa markers cũ
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    popupsRef.current = {};

    const validStores = stores.filter((store) => {
      const latitude = Number(store.latitude);
      const longitude = Number(store.longitude);

      return (
        !Number.isNaN(latitude) &&
        !Number.isNaN(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      );
    });

    if (validStores.length === 0) return;

    validStores.forEach((store) => {
      const latitude = Number(store.latitude);
      const longitude = Number(store.longitude);

      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

      // Nội dung popup hiển thị chi tiết khi click marker
      const popup = new trackasiagl.Popup({
        offset: 28,
        closeButton: true,
        closeOnClick: false,
        className: "store-locator-popup",
      }).setHTML(`
        <div class="store-popup-card">
          <div class="store-popup-header">
            <span class="store-popup-badge">NexCoffee</span>
            <h4 class="store-popup-title">${store.name || "Cơ sở NexCoffee"}</h4>
          </div>
          <div class="store-popup-body">
            <p class="store-popup-item">
              <span class="popup-icon">📍</span>
              <span>${store.address || "Chưa cập nhật địa chỉ"}</span>
            </p>
            ${
              store.phone
                ? `<p class="store-popup-item">
                    <span class="popup-icon">📞</span>
                    <a href="tel:${store.phone}" class="popup-phone-link">${store.phone}</a>
                  </p>`
                : ""
            }
            <p class="store-popup-item">
              <span class="popup-icon">⏰</span>
              <span>07:00 - 22:30 hàng ngày</span>
            </p>
          </div>
          <div class="store-popup-footer">
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="store-popup-direction-btn">
              <span>Chỉ đường trên Google Maps</span>
              <span class="btn-arrow">↗</span>
            </a>
          </div>
        </div>
      `);

      popupsRef.current[store.id] = popup;

      // Custom marker DOM element
      const markerElement = document.createElement("div");
      markerElement.className = "store-locator-marker";
      markerElement.innerHTML = `
        <div class="store-locator-marker-pin">
          <div class="store-locator-marker-pulse"></div>
          <div class="store-locator-marker-dot"></div>
        </div>
        <div class="store-locator-marker-label">
          <span>${store.name || "NexCoffee"}</span>
        </div>
      `;

      markerElement.addEventListener("click", () => {
        setSelectedStoreId(store.id);
      });

      const marker = new trackasiagl.Marker({
        element: markerElement,
        anchor: "bottom",
      })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });

    // Căn chỉnh góc nhìn (fitBounds hoặc flyTo)
    if (validStores.length === 1) {
      const store = validStores[0];
      mapRef.current.flyTo({
        center: [Number(store.longitude), Number(store.latitude)],
        zoom: 14,
        essential: true,
      });
    } else if (validStores.length > 1) {
      const bounds = new trackasiagl.LngLatBounds();
      validStores.forEach((store) => {
        bounds.extend([Number(store.longitude), Number(store.latitude)]);
      });

      mapRef.current.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: 14,
        duration: 900,
      });
    }
  }, [stores]);

  // Bay đến cửa hàng cụ thể khi người dùng click chọn chip
  const handleSelectStore = (store) => {
    if (!mapRef.current || !store) return;
    const lat = Number(store.latitude);
    const lng = Number(store.longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    setSelectedStoreId(store.id);

    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 15,
      essential: true,
      duration: 1000,
    });

    // Mở popup tương ứng
    const targetPopup = popupsRef.current[store.id];
    if (targetPopup) {
      targetPopup.addTo(mapRef.current);
    }
  };

  // Nút bao quát toàn bộ cửa hàng
  const handleResetView = () => {
    if (!mapRef.current || stores.length === 0) return;
    setSelectedStoreId(null);

    const validStores = stores.filter(
      (s) => !Number.isNaN(Number(s.latitude)) && !Number.isNaN(Number(s.longitude))
    );

    if (validStores.length === 1) {
      mapRef.current.flyTo({
        center: [Number(validStores[0].longitude), Number(validStores[0].latitude)],
        zoom: 14,
        duration: 800,
      });
    } else if (validStores.length > 1) {
      const bounds = new trackasiagl.LngLatBounds();
      validStores.forEach((store) => {
        bounds.extend([Number(store.longitude), Number(store.latitude)]);
      });
      mapRef.current.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: 14,
        duration: 800,
      });
    }
  };

  const chipsScrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Kéo chuột để cuộn ngang danh sách cơ sở
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - (chipsScrollRef.current?.offsetLeft || 0);
    scrollLeftRef.current = chipsScrollRef.current?.scrollLeft || 0;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !chipsScrollRef.current) return;
    const x = e.pageX - chipsScrollRef.current.offsetLeft;
    const distance = Math.abs(x - startXRef.current);
    if (distance > 5) {
      hasDraggedRef.current = true;
    }
    const walk = (x - startXRef.current) * 1.5;
    chipsScrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleWheel = (e) => {
    if (!chipsScrollRef.current) return;
    if (e.deltaY !== 0) {
      chipsScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // Ẩn hoàn toàn khung bản đồ nếu không có key TrackAsia hoặc không lấy được cửa hàng nào từ backend
  if (!TRACKASIA_KEY || stores.length === 0) {
    return null;
  }

  return (
    <div className="store-locator-map-wrapper">
      {/* Danh sách các cơ sở hiển thị theo hàng ngang (kéo trượt sang được) */}
      {stores.length > 0 && (
        <div
          ref={chipsScrollRef}
          className="store-chips-scroll"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onWheel={handleWheel}
        >
          {/* Nút Xem tất cả cơ sở */}
          <button
            type="button"
            className={`store-chip-btn ${!selectedStoreId ? "store-chip-btn--active" : ""}`}
            onClick={() => {
              if (hasDraggedRef.current) return;
              handleResetView();
            }}
            title="Xem toàn cảnh tất cả các cơ sở"
          >
            <FaCompass className="chip-icon" />
            <span className="chip-name">Tất cả cơ sở ({stores.length})</span>
          </button>

          {/* Nút từng cơ sở */}
          {stores.map((store) => {
            const isSelected = selectedStoreId === store.id;
            return (
              <button
                key={store.id}
                type="button"
                className={`store-chip-btn ${isSelected ? "store-chip-btn--active" : ""}`}
                onClick={() => {
                  if (hasDraggedRef.current) return;
                  handleSelectStore(store);
                }}
                title={store.name}
              >
                <FaMapMarkerAlt className="chip-icon" />
                <span className="chip-name">{store.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Khung Bản đồ Track Asia */}
      <div className="store-map-container-box">
        <div ref={mapContainerRef} className="store-trackasia-map-element" />

        {loading && (
          <div className="store-map-loading-overlay">
            <div className="store-map-spinner"></div>
            <span>Đang tải vị trí các cửa hàng...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreLocatorMap;
