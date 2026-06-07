import { useEffect, useRef } from "react";
import trackasiagl from "trackasia-gl";
import "trackasia-gl/dist/trackasia-gl.css";

const DEFAULT_CENTER = {
  lat: 21.028511,
  lng: 105.804817,
};

const TRACKASIA_KEY = import.meta.env.VITE_TRACKASIA_MAP_KEY;

export default function StoreOverviewMap({ stores = [] }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !TRACKASIA_KEY) return;

    const activeStores = stores.filter(
      (store) =>
        store.latitude !== null &&
        store.latitude !== undefined &&
        store.longitude !== null &&
        store.longitude !== undefined,
    );

    const firstStore = activeStores[0];

    const center = firstStore
      ? [Number(firstStore.longitude), Number(firstStore.latitude)]
      : [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat];

    const map = new trackasiagl.Map({
      container: mapContainerRef.current,
      style: `https://maps.track-asia.com/styles/v2/streets.json?key=${TRACKASIA_KEY}`,
      center,
      zoom: firstStore ? 13 : 11,
    });

    map.addControl(new trackasiagl.NavigationControl(), "top-right");

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

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

    validStores.forEach((store) => {
      const latitude = Number(store.latitude);
      const longitude = Number(store.longitude);

      const popup = new trackasiagl.Popup({
        offset: 24,
      }).setHTML(`
        <div style="min-width: 180px">
          <strong>${store.name || "Cửa hàng"}</strong>
          <p style="margin: 6px 0 0">${store.address || ""}</p>
          ${
            store.phone
              ? `<p style="margin: 6px 0 0">SĐT: ${store.phone}</p>`
              : ""
          }
          <p style="margin: 6px 0 0">Trạng thái: ${
            store.status === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"
          }</p>
        </div>
      `);

      const markerElement = document.createElement("div");
      markerElement.className = "store-overview-marker";

      markerElement.innerHTML = `
  <div class="store-overview-marker-pin ${
    store.status === "ACTIVE" ? "active" : "inactive"
  }"></div>
  <div class="store-overview-marker-label">
    ${store.name || "Cửa hàng"}
  </div>
`;

      const marker = new trackasiagl.Marker({
        element: markerElement,
        anchor: "bottom",
      })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });

    if (validStores.length === 1) {
      const store = validStores[0];

      mapRef.current.flyTo({
        center: [Number(store.longitude), Number(store.latitude)],
        zoom: 14,
        essential: true,
      });
    }

    if (validStores.length > 1) {
      const bounds = new trackasiagl.LngLatBounds();

      validStores.forEach((store) => {
        bounds.extend([Number(store.longitude), Number(store.latitude)]);
      });

      mapRef.current.fitBounds(bounds, {
        padding: 70,
        maxZoom: 14,
        duration: 800,
      });
    }
  }, [stores]);

  if (!TRACKASIA_KEY) {
    return (
      <div className="admin-store-overview-empty">
        Chưa thể hiển thị bản đồ cửa hàng. Vui lòng thử lại sau.
      </div>
    );
  }

  return <div ref={mapContainerRef} className="admin-store-overview-map" />;
}
