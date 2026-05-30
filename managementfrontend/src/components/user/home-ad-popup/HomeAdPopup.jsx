import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getActiveHomeAdvertisement } from "../../../apis/advertisementApi";

import "./HomeAdPopup.css";

const BACKEND_URL = "http://localhost:8080";

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return "";

  if (imageUrl.startsWith("http")) return imageUrl;
  if (imageUrl.startsWith("/images")) return `${BACKEND_URL}${imageUrl}`;

  return `${BACKEND_URL}/images/${imageUrl}`;
};

const HomeAdPopup = () => {
  const navigate = useNavigate();

  const [advertisement, setAdvertisement] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchAdvertisement = async () => {
      try {
        const data = await getActiveHomeAdvertisement();

        if (!data?.id || !data?.imageUrl) {
          return;
        }

        const sessionKey = `nexcoffee_home_ad_closed_${data.id}`;

        if (sessionStorage.getItem(sessionKey)) {
          return;
        }

        setAdvertisement(data);
        setVisible(true);
      } catch {
        setAdvertisement(null);
        setVisible(false);
      }
    };

    fetchAdvertisement();
  }, []);

  const handleClose = () => {
    if (advertisement?.id) {
      sessionStorage.setItem(
        `nexcoffee_home_ad_closed_${advertisement.id}`,
        "true",
      );
    }

    setVisible(false);
  };

  const handleImageClick = () => {
    if (!advertisement?.targetUrl) {
      return;
    }

    handleClose();
    navigate(advertisement.targetUrl);
  };

  if (!visible || !advertisement) return null;

  return (
    <div className="home-ad-overlay">
      <div className="home-ad-modal">
        <button
          type="button"
          className="home-ad-close"
          onClick={handleClose}
          aria-label="Đóng quảng cáo"
        >
          ×
        </button>

        <button
          type="button"
          className={`home-ad-image-button ${
            advertisement.targetUrl ? "is-clickable" : ""
          }`}
          onClick={handleImageClick}
        >
          <img
            src={getImageUrl(advertisement.imageUrl)}
            alt={advertisement.title}
          />
        </button>
      </div>
    </div>
  );
};

export default HomeAdPopup;
