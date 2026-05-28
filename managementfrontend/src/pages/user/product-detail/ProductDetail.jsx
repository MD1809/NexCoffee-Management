import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaCheckCircle,
  FaCoffee,
  FaMinus,
  FaPlus,
  FaShieldAlt,
  FaShoppingCart,
  FaTruck,
} from "react-icons/fa";
import { toast } from "react-toastify";

import "./ProductDetail.css";
import "../menu/Menu.css";

import ProductCard from "../../../components/user/product-card/ProductCard";
import { getMenuProductById, getMenuProducts } from "../../../apis/menuApi";
import { addCartItem } from "../../../apis/cartApi";
import { showCartToast } from "../../../utils/cartToast";
import ProductBreadcrumb from "../../../components/user/breadcrumb/ProductBreadcrumb";

const BACKEND_URL = "http://localhost:8080";

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return new Intl.NumberFormat("vi-VN").format(Number(value)) + "đ";
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

const normalizeImage = (image) => {
  if (!image) return null;

  if (typeof image === "string") {
    return {
      id: image,
      url: getImageUrl(image),
    };
  }

  const rawUrl = image.url || image.imageUrl;

  if (!rawUrl) return null;

  return {
    id: image.id || rawUrl,
    url: getImageUrl(rawUrl),
  };
};

const getProductImages = (product) => {
  const result = [];

  const main = normalizeImage(product?.mainImage);
  if (main) result.push(main);

  const galleryImages = Array.isArray(product?.galleryImages)
    ? product.galleryImages
    : [];

  galleryImages.forEach((image) => {
    const normalized = normalizeImage(image);
    if (normalized) result.push(normalized);
  });

  const uniqueImages = [];
  const seen = new Set();

  result.forEach((image) => {
    if (!seen.has(image.url)) {
      seen.add(image.url);
      uniqueImages.push(image);
    }
  });

  return uniqueImages;
};

const isProductActive = (product) => {
  return String(product?.status || "").toLowerCase() === "active";
};

const isVariantAvailable = (variant) => {
  return String(variant?.status || "").toLowerCase() === "available";
};

const sortVariants = (variants) => {
  const sizeOrder = {
    S: 1,
    M: 2,
    L: 3,
    XL: 4,
  };

  return [...variants].sort((a, b) => {
    const aSize = String(a.size || "").toUpperCase();
    const bSize = String(b.size || "").toUpperCase();

    const aOrder = sizeOrder[aSize] || 99;
    const bOrder = sizeOrder[bSize] || 99;

    if (aOrder !== bOrder) return aOrder - bOrder;

    return Number(a.price || 0) - Number(b.price || 0);
  });
};

const clampQuantity = (value) => {
  const nextValue = Number(value);

  if (Number.isNaN(nextValue)) return 1;

  return Math.min(100, Math.max(1, nextValue));
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [selectedImage, setSelectedImage] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [id]);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);

        const [productResponse, productsResponse] = await Promise.all([
          getMenuProductById(id),
          getMenuProducts(),
        ]);

        const productData = productResponse?.data || productResponse || null;

        const productsData = Array.isArray(productsResponse)
          ? productsResponse
          : Array.isArray(productsResponse?.data)
            ? productsResponse.data
            : [];

        if (!productData || !isProductActive(productData)) {
          setProduct(null);
          setRelatedProducts([]);
          return;
        }

        const images = getProductImages(productData);

        const availableVariants = sortVariants(
          (productData.variants || []).filter(isVariantAvailable),
        );

        const related = productsData
          .filter((item) => {
            return (
              String(item.categoryId) === String(productData.categoryId) &&
              String(item.id) !== String(productData.id) &&
              isProductActive(item)
            );
          })
          .slice(0, 5);

        setProduct(productData);
        setSelectedImage(images[0]?.url || "");
        setSelectedVariantId(availableVariants[0]?.id || null);
        setQuantity(1);
        setRelatedProducts(related);
      } catch (error) {
        toast.error("Không thể tải chi tiết sản phẩm.");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [id]);

  const productImages = useMemo(() => {
    return getProductImages(product);
  }, [product]);

  const availableVariants = useMemo(() => {
    return sortVariants((product?.variants || []).filter(isVariantAvailable));
  }, [product]);

  const selectedVariant = useMemo(() => {
    return (
      availableVariants.find(
        (variant) => String(variant.id) === String(selectedVariantId),
      ) ||
      availableVariants[0] ||
      null
    );
  }, [availableVariants, selectedVariantId]);

  const sizeVariants = useMemo(() => {
    return availableVariants.filter((variant) => variant.size);
  }, [availableVariants]);

  const hasSizeOptions = sizeVariants.length > 0;
  const currentPrice = selectedVariant?.price;
  const canBuy = Boolean(
    product && isProductActive(product) && selectedVariant,
  );

  const shortDescription = product?.description
    ? String(product.description).split("\n").filter(Boolean).slice(0, 3)
    : [];

  const handleDecrease = () => {
    setQuantity((prev) => clampQuantity(prev - 1));
  };

  const handleIncrease = () => {
    setQuantity((prev) => clampQuantity(prev + 1));
  };

  const handleQuantityChange = (event) => {
    setQuantity(clampQuantity(event.target.value));
  };

  const buildCartPayload = () => {
    return {
      productId: product.id,
      variantId: selectedVariant?.id || null,
      size: selectedVariant?.size || null,
      quantity,
    };
  };

  const handleAddToCart = async () => {
    if (!canBuy) {
      toast.warning("Sản phẩm hiện không khả dụng.");
      return;
    }

    try {
      await addCartItem({
        variantId: selectedVariant.id,
        quantity,
      });

      window.dispatchEvent(new Event("cart-changed"));

      showCartToast({
        type: "success",
        title: "Đã thêm vào giỏ hàng",
        productName: product.name,
        productImage: selectedImage,
        size: selectedVariant?.size || "",
        quantity,
        message: "Sản phẩm đã được thêm vào giỏ hàng của bạn.",
      });
    } catch (error) {
      showCartToast({
        type: "error",
        title: "Không thể thêm vào giỏ hàng",
        productName: product.name,
        productImage: selectedImage,
        size: selectedVariant?.size || "",
        quantity,
        message: "Vui lòng thử lại sau.",
      });
    }
  };

  const handleBuyNow = async () => {
    if (!canBuy) {
      toast.warning("Sản phẩm hiện không khả dụng.");
      return;
    }

    try {
      setBuyNowLoading(true);

      await addCartItem({
        variantId: selectedVariant.id,
        quantity,
      });

      window.dispatchEvent(new Event("cart-changed"));

      navigate("/checkout");
    } catch (error) {
      toast.error("Không thể mua ngay sản phẩm này. Vui lòng thử lại.");
    } finally {
      setBuyNowLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="product-detail-page fade-in">
        <div className="main-content">
          <div className="product-detail-state">
            Đang tải chi tiết sản phẩm...
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="product-detail-page fade-in">
        <div className="main-content">
          <div className="product-detail-empty">
            <h2>Không tìm thấy sản phẩm</h2>
            <p>Sản phẩm không tồn tại hoặc hiện đã ngừng kinh doanh.</p>

            <button
              type="button"
              className="product-detail-outline-btn"
              onClick={() => navigate("/menu")}
            >
              Quay lại menu
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="product-detail-page fade-in">
      <div className="main-content">
        <ProductBreadcrumb
          categoryId={product.categoryId}
          categoryName={product.categoryName}
          productName={product.name}
        />
        <div className="product-detail-shell">
          <div className="product-detail-gallery">
            <div className="product-detail-main-image">
              {selectedImage ? (
                <img src={selectedImage} alt={product.name} />
              ) : (
                <div className="product-detail-placeholder">NexCoffee</div>
              )}
            </div>

            <div className="product-detail-thumbs">
              {productImages.length > 0 ? (
                productImages.map((image) => (
                  <button
                    type="button"
                    key={image.id}
                    className={`product-detail-thumb ${
                      selectedImage === image.url ? "active" : ""
                    }`}
                    onClick={() => setSelectedImage(image.url)}
                  >
                    <img src={image.url} alt={product.name} />
                  </button>
                ))
              ) : (
                <div className="product-detail-thumb product-detail-thumb--empty">
                  <FaCoffee />
                </div>
              )}
            </div>
          </div>

          <aside className="product-detail-panel">
            <div className="product-detail-badge">
              <FaCheckCircle />
              <span>{canBuy ? "Còn hàng" : "Tạm hết hàng"}</span>
            </div>

            <h1 className="product-detail-title">{product.name}</h1>

            <div className="product-detail-price">
              {formatCurrency(currentPrice)}
            </div>

            {shortDescription.length > 0 && (
              <div className="product-detail-summary">
                {shortDescription.map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            )}

            <div className="product-detail-benefits">
              {/* <div>
                <FaCoffee />
                <span>Hương vị NexCoffee đặc trưng</span>
              </div>
              <div>
                <FaTruck />
                <span>Giao hàng nhanh trong khu vực</span>
              </div> */}
              <div>
                <FaShieldAlt />
                <span>Nguyên liệu được chọn lọc</span>
              </div>
            </div>

            {hasSizeOptions && (
              <div className="product-detail-option">
                <div className="product-detail-option-title">Kích thước</div>

                <div className="product-detail-sizes">
                  {sizeVariants.map((variant) => (
                    <button
                      type="button"
                      key={variant.id}
                      className={`product-detail-size ${
                        String(selectedVariant?.id) === String(variant.id)
                          ? "active"
                          : ""
                      }`}
                      onClick={() => setSelectedVariantId(variant.id)}
                    >
                      <span>{variant.size}</span>
                      <small>{formatCurrency(variant.price)}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="product-detail-option">
              <div className="product-detail-option-title">Số lượng</div>

              <div className="product-detail-quantity">
                <button type="button" onClick={handleDecrease}>
                  <FaMinus />
                </button>

                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={handleQuantityChange}
                  onBlur={handleQuantityChange}
                />

                <button type="button" onClick={handleIncrease}>
                  <FaPlus />
                </button>
              </div>
            </div>

            <div className="product-detail-actions">
              <button
                type="button"
                className="product-detail-buy-btn"
                onClick={handleBuyNow}
                disabled={!canBuy || buyNowLoading}
              >
                {buyNowLoading ? "Đang xử lý..." : "Mua ngay"}
              </button>

              <button
                type="button"
                className="product-detail-cart-btn"
                onClick={handleAddToCart}
                disabled={!canBuy}
              >
                <FaShoppingCart />
                <span>Thêm vào giỏ hàng</span>
              </button>
            </div>

            {/* <div className="product-detail-policy">
              <div>
                <FaTruck />
                <span>Giao hàng nội thành</span>
              </div>
              <div>
                <FaShieldAlt />
                <span>Đảm bảo chất lượng</span>
              </div>
            </div> */}
          </aside>
        </div>

        {product.description && (
          <div className="product-detail-description">
            <h2>Mô tả sản phẩm</h2>

            {String(product.description)
              .split("\n")
              .filter(Boolean)
              .map((line, index) => (
                <p key={index}>{line}</p>
              ))}
          </div>
        )}

        {relatedProducts.length > 0 && (
          <div className="product-detail-related">
            <div className="product-detail-related-heading">
              <h2>Sản phẩm cùng loại</h2>
            </div>

            <div className="product-detail-related-list">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard product={relatedProduct} key={relatedProduct.id} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductDetail;
