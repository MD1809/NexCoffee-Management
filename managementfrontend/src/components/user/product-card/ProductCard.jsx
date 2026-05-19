import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import { toast } from "react-toastify";
import { showCartToast } from "../../../utils/cartToast";

const BACKEND_URL = "http://localhost:8080";

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "";
  }

  return new Intl.NumberFormat("vi-VN").format(Number(value)) + " đ";
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  if (imagePath.startsWith("/images")) {
    return `${BACKEND_URL}${imagePath}`;
  }

  if (imagePath.startsWith("images")) {
    return `${BACKEND_URL}/${imagePath}`;
  }

  return `${BACKEND_URL}/images/${imagePath}`;
};

const getMainImage = (product) => {
  if (product.mainImage?.url) {
    return getImageUrl(product.mainImage.url);
  }

  if (product.mainImage?.imageUrl) {
    return getImageUrl(product.mainImage.imageUrl);
  }

  const galleryImages = Array.isArray(product.galleryImages)
    ? product.galleryImages
    : [];

  const fallbackImage = galleryImages[0];

  if (fallbackImage?.url) {
    return getImageUrl(fallbackImage.url);
  }

  if (fallbackImage?.imageUrl) {
    return getImageUrl(fallbackImage.imageUrl);
  }

  return "";
};

const getAvailableVariants = (product) => {
  const variants = Array.isArray(product.variants) ? product.variants : [];

  return variants.filter((variant) => {
    if (!variant.status) return true;

    return String(variant.status).toLowerCase() === "available";
  });
};

const getDisplayPrice = (product) => {
  const availableVariants = getAvailableVariants(product);

  if (availableVariants.length > 0) {
    return Math.min(
      ...availableVariants.map((variant) => Number(variant.price)),
    );
  }

  const variants = Array.isArray(product.variants) ? product.variants : [];

  if (variants.length > 0) {
    return Math.min(...variants.map((variant) => Number(variant.price)));
  }

  return product.price;
};

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const mainImage = getMainImage(product);
  const displayPrice = getDisplayPrice(product);
  const hasVariants =
    Array.isArray(product.variants) && product.variants.length > 0;

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (hasVariants) {
      navigate(`/products/${product.id}`);
      return;
    }

    showCartToast({
      type: "success",
      title: "Đã thêm vào giỏ hàng",
      productName: product.name,
      productImage: mainImage,
      size: "",
      quantity: 1,
      message: "Sản phẩm đã được thêm vào giỏ hàng của bạn.",
    });
  };
  const truncateText = (text, maxLength = 30) => {
    if (!text) return "";

    const value = String(text).trim();

    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength).trim()}...`;
  };

  return (
    <div className="menu-card">
      <Link
        to={`/products/${product.id}`}
        className="menu-card-link"
        aria-label={`Xem chi tiết ${product.name}`}
      >
        <div className="menu-card-img">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="menu-card-img-placeholder">NexCoffee</div>
          )}
        </div>

        <div className="menu-card-info">
          <p className="menu-card-name" title={product.name}>
            {truncateText(product.name, 15)}
          </p>

          {displayPrice !== null && displayPrice !== undefined && (
            <p className="menu-card-price">{formatCurrency(displayPrice)}</p>
          )}
        </div>
      </Link>

      <button
        type="button"
        className="menu-card-cart"
        title={hasVariants ? "Chọn size" : "Thêm vào giỏ hàng"}
        onClick={handleAddToCart}
      >
        <FaShoppingCart />
      </button>
    </div>
  );
};

export default ProductCard;
