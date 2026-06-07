import { useEffect, useMemo, useRef, useState } from "react";
import trackasiagl from "trackasia-gl";
import "trackasia-gl/dist/trackasia-gl.css";

const TRACKASIA_KEY = import.meta.env.VITE_TRACKASIA_MAP_KEY;

const isValidCoordinate = (lat, lng) => {
  return (
    lat !== null &&
    lng !== null &&
    lat !== undefined &&
    lng !== undefined &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? null : numberValue;
};

const formatDistanceKm = (meters) => {
  if (meters === null || meters === undefined) return null;

  const km = Number(meters) / 1000;

  if (Number.isNaN(km)) return null;

  return km.toFixed(1);
};

const formatDurationMinutes = (seconds) => {
  if (seconds === null || seconds === undefined) return null;

  const minutes = Math.round(Number(seconds) / 60);

  if (Number.isNaN(minutes)) return null;

  return minutes;
};

const createMarkerElement = (label, type = "store") => {
  const wrapper = document.createElement("div");
  wrapper.className = "order-route-marker";

  const pin = document.createElement("div");
  pin.className = `order-route-marker__pin ${type}`;

  const text = document.createElement("div");
  text.className = "order-route-marker__label";
  text.textContent = label;

  wrapper.appendChild(pin);
  wrapper.appendChild(text);

  return wrapper;
};

const fetchRoute = async ({ storeLat, storeLng, customerLat, customerLng }) => {
  const coordinates = `${storeLng},${storeLat};${customerLng},${customerLat}`;

  const url =
    `https://maps.track-asia.com/route/v1/moto/${coordinates}.json` +
    `?geometries=geojson` +
    `&overview=full` +
    `&steps=false` +
    `&key=${TRACKASIA_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Không thể tải tuyến đường.");
  }

  const data = await response.json();

  return data?.routes?.[0] || null;
};

export default function OrderRouteMap({ order }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const storeMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);

  const [routeInfo, setRouteInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingRoute, setLoadingRoute] = useState(false);

  const routeData = useMemo(() => {
    const customerLat = toNullableNumber(order?.customerLatitude);
    const customerLng = toNullableNumber(order?.customerLongitude);

    const storeLat = toNullableNumber(order?.nearestStoreLatitude);
    const storeLng = toNullableNumber(order?.nearestStoreLongitude);

    return {
      customerLat,
      customerLng,
      storeLat,
      storeLng,
      storeName: order?.nearestStoreName || "Cửa hàng nhận đơn",
      storeAddress: order?.nearestStoreAddress || "",
      customerAddress: order?.address || "Địa chỉ giao hàng",
      distanceMeters: order?.deliveryDistanceMeters,
      durationSeconds: order?.deliveryDurationSeconds,
    };
  }, [order]);

  const hasValidRouteData =
    isValidCoordinate(routeData.customerLat, routeData.customerLng) &&
    isValidCoordinate(routeData.storeLat, routeData.storeLng);

  useEffect(() => {
    if (!TRACKASIA_KEY) {
      setErrorMessage("Bản đồ chưa sẵn sàng. Vui lòng thử lại sau.");
      return;
    }

    if (!hasValidRouteData) {
      return;
    }

    if (!mapContainerRef.current) {
      return;
    }

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      storeMarkerRef.current = null;
      customerMarkerRef.current = null;
    }

    const map = new trackasiagl.Map({
      container: mapContainerRef.current,
      style: `https://maps.track-asia.com/styles/v2/streets.json?key=${TRACKASIA_KEY}`,
      center: [routeData.customerLng, routeData.customerLat],
      zoom: 13,
    });

    mapRef.current = map;

    map.addControl(new trackasiagl.NavigationControl(), "top-right");

    map.on("load", async () => {
      storeMarkerRef.current = new trackasiagl.Marker({
        element: createMarkerElement(routeData.storeName, "store"),
        anchor: "bottom",
      })
        .setLngLat([routeData.storeLng, routeData.storeLat])
        .addTo(map);

      customerMarkerRef.current = new trackasiagl.Marker({
        element: createMarkerElement("Điểm giao hàng", "customer"),
        anchor: "bottom",
      })
        .setLngLat([routeData.customerLng, routeData.customerLat])
        .addTo(map);

      try {
        setLoadingRoute(true);
        setErrorMessage("");

        const route = await fetchRoute({
          storeLat: routeData.storeLat,
          storeLng: routeData.storeLng,
          customerLat: routeData.customerLat,
          customerLng: routeData.customerLng,
        });

        const routeGeometry = route?.geometry;

        if (routeGeometry) {
          const geoJson = {
            type: "Feature",
            properties: {},
            geometry: routeGeometry,
          };

          if (map.getSource("order-route-source")) {
            map.getSource("order-route-source").setData(geoJson);
          } else {
            map.addSource("order-route-source", {
              type: "geojson",
              data: geoJson,
            });

            map.addLayer({
              id: "order-route-line",
              type: "line",
              source: "order-route-source",
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": "#1468e3",
                "line-width": 5,
                "line-opacity": 0.9,
              },
            });
          }

          const coordinates = routeGeometry.coordinates || [];

          if (coordinates.length > 0) {
            const bounds = coordinates.reduce(
              (currentBounds, coordinate) => currentBounds.extend(coordinate),
              new trackasiagl.LngLatBounds(coordinates[0], coordinates[0]),
            );

            map.fitBounds(bounds, {
              padding: 45,
              maxZoom: 15,
              duration: 700,
            });
          }

          setRouteInfo({
            storeName: routeData.storeName,
            distanceKm:
              typeof route.distance === "number"
                ? formatDistanceKm(route.distance)
                : formatDistanceKm(routeData.distanceMeters),
            durationMinutes:
              typeof route.duration === "number"
                ? formatDurationMinutes(route.duration)
                : formatDurationMinutes(routeData.durationSeconds),
          });
        } else {
          setRouteInfo({
            storeName: routeData.storeName,
            distanceKm: formatDistanceKm(routeData.distanceMeters),
            durationMinutes: formatDurationMinutes(routeData.durationSeconds),
          });

          const bounds = new trackasiagl.LngLatBounds();

          bounds.extend([routeData.storeLng, routeData.storeLat]);
          bounds.extend([routeData.customerLng, routeData.customerLat]);

          map.fitBounds(bounds, {
            padding: 45,
            maxZoom: 15,
            duration: 700,
          });
        }
      } catch (error) {
        console.error("Load order route failed:", error);

        setRouteInfo({
          storeName: routeData.storeName,
          distanceKm: formatDistanceKm(routeData.distanceMeters),
          durationMinutes: formatDurationMinutes(routeData.durationSeconds),
        });

        setErrorMessage(
          "Không thể tải tuyến đường. Hệ thống chỉ hiển thị hai điểm giao nhận.",
        );

        const bounds = new trackasiagl.LngLatBounds();

        bounds.extend([routeData.storeLng, routeData.storeLat]);
        bounds.extend([routeData.customerLng, routeData.customerLat]);

        map.fitBounds(bounds, {
          padding: 45,
          maxZoom: 15,
          duration: 700,
        });
      } finally {
        setLoadingRoute(false);
      }
    });

    return () => {
      if (storeMarkerRef.current) {
        storeMarkerRef.current.remove();
      }

      if (customerMarkerRef.current) {
        customerMarkerRef.current.remove();
      }

      if (mapRef.current) {
        mapRef.current.remove();
      }

      storeMarkerRef.current = null;
      customerMarkerRef.current = null;
      mapRef.current = null;
    };
  }, [hasValidRouteData, routeData]);

  if (!hasValidRouteData) {
    return (
      <div className="order-route-card">
        <h3 className="order-route-title">Bản đồ giao hàng</h3>

        <div className="order-route-empty">
          Đơn hàng này chưa có đủ tọa độ cửa hàng hoặc địa điểm giao hàng.
        </div>
      </div>
    );
  }

  return (
    <div className="order-route-card">
      <div className="order-route-header">
        <h3 className="order-route-title">Bản đồ giao hàng</h3>

        {routeInfo && (
          <div className="order-route-summary">
            <span>
              Cửa hàng nhận đơn: <strong>{routeInfo.storeName}</strong>
            </span>

            {routeInfo.distanceKm && (
              <span>
                Khoảng cách: <strong>{routeInfo.distanceKm} km</strong>
              </span>
            )}

            {routeInfo.durationMinutes !== null &&
              routeInfo.durationMinutes !== undefined && (
                <span>
                  Thời gian dự kiến:{" "}
                  <strong>{routeInfo.durationMinutes} phút</strong>
                </span>
              )}
          </div>
        )}
      </div>

      {loadingRoute && (
        <div className="order-route-loading">Đang tải tuyến đường...</div>
      )}

      {errorMessage && (
        <div className="order-route-warning">{errorMessage}</div>
      )}

      <div ref={mapContainerRef} className="order-route-map" />
    </div>
  );
}
