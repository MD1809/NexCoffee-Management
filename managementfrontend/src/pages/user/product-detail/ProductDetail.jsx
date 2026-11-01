import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaCheckCircle,
  FaCoffee,
  FaMinus,
  FaPlus,
  FaShieldAlt,
  FaShoppingCart,
  FaStar,
  FaTruck,
  FaTimes,
  FaArrowRight,
  FaCommentDots,
} from "react-icons/fa";
import { toast } from "react-toastify";

import "./ProductDetail.css";
import "../menu/Menu.css";

import ProductCard from "../../../components/user/product-card/ProductCard";
import { getMenuProductById, getMenuProducts } from "../../../apis/menuApi";
import { getProductReviews } from "../../../apis/reviewApi";
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
  const [productReviews, setProductReviews] = useState([]);

  // State modal toàn bộ đánh giá sản phẩm & đọc đánh giá dài
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [selectedStarFilter, setSelectedStarFilter] = useState("ALL");
  const [readingReview, setReadingReview] = useState(null);

  // Khóa cuộn trang khi mở modal
  useEffect(() => {
    if (isReviewsModalOpen || readingReview) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isReviewsModalOpen, readingReview]);

  // Lọc 3 đánh giá có rating cao nhất (ưu tiên rating cao, sau đó đến mới nhất)
  const topReviews = useMemo(() => {
    return [...productReviews]
      .sort((a, b) => {
        if ((b.rating || 0) !== (a.rating || 0)) {
          return (b.rating || 0) - (a.rating || 0);
        }
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      })
      .slice(0, 3);
  }, [productReviews]);

  // Đếm số lượng theo mức sao
  const starCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    productReviews.forEach((r) => {
      const star = Number(r.rating);
      if (counts[star] !== undefined) counts[star]++;
    });
    return counts;
  }, [productReviews]);

  // Lọc đánh giá hiển thị trong modal theo mức sao
  const modalReviews = useMemo(() => {
    let list = [...productReviews].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
    if (selectedStarFilter !== "ALL") {
      list = list.filter((r) => Number(r.rating) === Number(selectedStarFilter));
    }
    return list;
  }, [productReviews, selectedStarFilter]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    const fetchProductDetail = async () => {
      try {
        setLoading(true);

        const [productResponse, productsResponse, reviewsResponse] = await Promise.all([
          getMenuProductById(id),
          getMenuProducts(),
          getProductReviews(id).catch(() => []),
        ]);

        if (!isMounted) return;

        const productData = productResponse?.data || productResponse || null;

        const productsData = Array.isArray(productsResponse)
          ? productsResponse
          : Array.isArray(productsResponse?.data)
            ? productsResponse.data
            : [];

        if (!productData || !isProductActive(productData)) {
          setProduct(null);
          setRelatedProducts([]);
          setProductReviews([]);
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

        const reviewsData = Array.isArray(reviewsResponse)
          ? reviewsResponse
          : Array.isArray(reviewsResponse?.data)
            ? reviewsResponse.data
            : [];

        setProduct(productData);
        setSelectedImage(images[0]?.url || "");
        setSelectedVariantId(availableVariants[0]?.id || null);
        setQuantity(1);
        setRelatedProducts(related);
        setProductReviews(reviewsData);
      } catch (error) {
        if (!isMounted) return;
        toast.error("Không thể tải chi tiết sản phẩm.");
        setProduct(null);
        setProductReviews([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProductDetail();

    return () => {
      isMounted = false;
    };
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

            <div className="product-detail-rating-meta">
              <div className="product-detail-stars">
                <FaStar className="star-icon" />
                <span className="rating-score">
                  {Number(product.averageRating || 5.0).toFixed(1)}
                </span>
                <span className="rating-count">
                  ({productReviews.length || product.reviewCount || 0} đánh giá)
                </span>
              </div>
              <span className="meta-divider">•</span>
              <div className="product-detail-sold">
                <span>Đã bán:</span> <strong>{product.soldCount || 0}</strong>
              </div>
            </div>

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

        {/* PHẦN ĐÁNH GIÁ SẢN PHẨM TỪ KHÁCH HÀNG */}
        <div className="product-detail-reviews-section">
          <div className="product-reviews-header">
            <div>
              <h2>Đánh giá từ khách hàng ({productReviews.length})</h2>
              <p className="product-reviews-subtitle">
                Nhận xét thực tế từ khách hàng đã đặt và thưởng thức món này tại NexCoffee
              </p>
            </div>
            {productReviews.length > 0 && (
              <div className="product-reviews-score-card">
                <span className="score-number">
                  {Number(product.averageRating || 5.0).toFixed(1)}
                </span>
                <div className="score-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FaStar
                      key={s}
                      className={
                        s <= Math.round(product.averageRating || 5.0)
                          ? "star-filled"
                          : "star-empty"
                      }
                    />
                  ))}
                </div>
                <span className="score-text">
                  {productReviews.length} lượt đánh giá
                </span>
              </div>
            )}
          </div>

          {productReviews.length > 0 ? (
            <>
              <div className="product-reviews-list">
                {topReviews.map((review) => {
                  const commentText = review.comment || "";
                  const isLong = commentText.length > 90 || commentText.includes("\n");

                  return (
                    <div key={review.id} className="product-review-item">
                      <div className="product-review-user">
                        {review.userAvatar ? (
                          <img
                            src={getImageUrl(review.userAvatar)}
                            alt={review.userFullName}
                            className="review-user-avatar"
                          />
                        ) : (
                          <div className="review-user-avatar-placeholder">
                            {(review.userFullName || "U")[0]}
                          </div>
                        )}
                        <div className="review-user-info">
                          <span className="review-user-name">
                            {review.userFullName || "Khách hàng"}
                          </span>
                          <span className="review-user-badge">
                            <FaCheckCircle /> Đã mua hàng
                          </span>
                        </div>
                      </div>

                      <div className="product-review-body">
                        <div className="product-review-stars-row">
                          <div className="review-item-stars">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <FaStar
                                key={s}
                                className={
                                  s <= review.rating ? "star-filled" : "star-empty"
                                }
                              />
                            ))}
                          </div>
                          {review.variantSize && (
                            <span className="review-variant-tag">
                              Size {review.variantSize}
                            </span>
                          )}
                          <div className="review-date-group">
                            {review.orderCreatedAt && (
                              <span className="review-order-date">
                                Đặt: {new Date(review.orderCreatedAt).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                            {review.orderCreatedAt && <span className="review-date-dot">•</span>}
                            <span className="review-date">
                              Đánh giá: {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                            {review.isEdited && (
                              <>
                                <span className="review-date-dot">•</span>
                                <span className="review-edited-tag">Đã chỉnh sửa</span>
                              </>
                            )}
                          </div>
                        </div>

                        {review.isContentHidden || review.status === "HIDDEN" ? (
                          <div className="product-review-hidden-box">
                            <span className="hidden-label">
                              <i className="fa-solid fa-shield-halved" style={{ marginRight: 6 }}></i>
                              Nội dung gốc đã bị ẩn:
                            </span>
                            <span className="hidden-reason-text">&ldquo;{review.comment}&rdquo;</span>
                          </div>
                        ) : (
                          <div className="product-review-comment-wrap">
                            <p
                              className={`product-review-comment ${
                                isLong ? "product-review-comment--clamped" : ""
                              }`}
                            >
                              &ldquo;{commentText}&rdquo;
                            </p>
                            {isLong && (
                              <button
                                type="button"
                                className="btn-product-review-more"
                                onClick={() => setReadingReview(review)}
                                title="Xem toàn bộ nhận xét"
                              >
                                <span>Xem thêm</span>
                                <FaArrowRight style={{ fontSize: "0.68rem", marginLeft: 4 }} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nút Xem thêm X đánh giá nếu có hơn 3 đánh giá */}
              {productReviews.length > 3 && (
                <div className="product-reviews-more-wrap">
                  <button
                    type="button"
                    className="btn-show-all-product-reviews"
                    onClick={() => {
                      setSelectedStarFilter("ALL");
                      setIsReviewsModalOpen(true);
                    }}
                  >
                    <FaCommentDots className="more-reviews-icon" />
                    <span>Xem thêm {productReviews.length - 3} đánh giá</span>
                    <FaArrowRight className="more-reviews-arrow" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="product-reviews-empty">
              <FaCoffee className="empty-icon" />
              <p>Chưa có đánh giá nào cho món này.</p>
              <span>
                Hãy đặt hàng và là người đầu tiên chia sẻ cảm nhận về món nước đặc biệt này nhé!
              </span>
            </div>
          )}
        </div>

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

      {/* MODAL DANH SÁCH TOÀN BỘ ĐÁNH GIÁ SẢN PHẨM KÈM BỘ LỌC SAO */}
      {isReviewsModalOpen &&
        createPortal(
          <div
            className="product-reviews-modal-backdrop"
            onClick={() => setIsReviewsModalOpen(false)}
          >
            <div
              className="product-reviews-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="prm-header">
                <div className="prm-header-info">
                  <h3>Đánh Giá Sản Phẩm</h3>
                  <span className="prm-product-title">{product?.name}</span>
                </div>
                <button
                  type="button"
                  className="btn-prm-close"
                  onClick={() => setIsReviewsModalOpen(false)}
                  aria-label="Đóng cửa sổ đánh giá"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Tóm tắt điểm trung bình & thanh lọc sao */}
              <div className="prm-summary-bar">
                <div className="prm-score-box">
                  <span className="prm-score-number">
                    {Number(product?.averageRating || 5.0).toFixed(1)}
                  </span>
                  <div className="prm-score-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FaStar
                        key={s}
                        className={
                          s <= Math.round(product?.averageRating || 5.0)
                            ? "star-filled"
                            : "star-empty"
                        }
                      />
                    ))}
                  </div>
                  <span className="prm-score-count">
                    {productReviews.length} đánh giá
                  </span>
                </div>

                {/* Star Filter Pills */}
                <div className="prm-filter-pills">
                  <button
                    type="button"
                    className={`prm-filter-btn ${
                      selectedStarFilter === "ALL" ? "active" : ""
                    }`}
                    onClick={() => setSelectedStarFilter("ALL")}
                  >
                    Tất cả ({productReviews.length})
                  </button>
                  {[5, 4, 3, 2, 1].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className={`prm-filter-btn ${
                        selectedStarFilter === String(star) ? "active" : ""
                      }`}
                      onClick={() => setSelectedStarFilter(String(star))}
                    >
                      <span>{star} sao</span>
                      <span className="prm-filter-count">({starCounts[star] || 0})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Danh sách các đánh giá theo bộ lọc */}
              <div className="prm-reviews-body">
                {modalReviews.length === 0 ? (
                  <div className="prm-empty-state">
                    <FaCoffee className="empty-icon" />
                    <p>
                      {selectedStarFilter === "ALL"
                        ? "Chưa có đánh giá nào cho sản phẩm này."
                        : `Chưa có đánh giá nào ở mức ${selectedStarFilter} sao.`}
                    </p>
                  </div>
                ) : (
                  <div className="prm-reviews-list">
                    {modalReviews.map((review) => {
                      const commentText = review.comment || "";
                      const isLong = commentText.length > 90 || commentText.includes("\n");

                      return (
                        <div key={review.id} className="prm-review-item">
                          <div className="prm-review-user-row">
                            {review.userAvatar ? (
                              <img
                                src={getImageUrl(review.userAvatar)}
                                alt={review.userFullName}
                                className="prm-user-avatar"
                              />
                            ) : (
                              <div className="prm-user-avatar-placeholder">
                                {(review.userFullName || "U")[0]}
                              </div>
                            )}

                            <div className="prm-user-meta">
                              <strong className="prm-user-name">
                                {review.userFullName || "Khách hàng"}
                              </strong>
                              <div className="prm-tags-row">
                                <span className="prm-verified-badge">
                                  <FaCheckCircle /> Đã mua hàng
                                </span>
                                {review.variantSize && (
                                  <span className="prm-variant-pill">
                                    Size {review.variantSize}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="prm-review-time">
                              {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                            </div>
                          </div>

                          <div className="prm-stars-row">
                            <div className="prm-stars">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <FaStar
                                  key={s}
                                  className={
                                    s <= review.rating ? "star-filled" : "star-empty"
                                  }
                                />
                              ))}
                            </div>
                            {review.isEdited && (
                              <span className="prm-edited-tag">Đã chỉnh sửa</span>
                            )}
                          </div>

                          {review.isContentHidden || review.status === "HIDDEN" ? (
                            <div className="product-review-hidden-box">
                              <span className="hidden-label">
                                <i className="fa-solid fa-shield-halved" style={{ marginRight: 6 }}></i>
                                Nội dung gốc đã bị ẩn:
                              </span>
                              <span className="hidden-reason-text">&ldquo;{review.comment}&rdquo;</span>
                            </div>
                          ) : (
                            <div className="prm-comment-wrap">
                              <p
                                className={`prm-comment-text ${
                                  isLong ? "prm-comment-text--clamped" : ""
                                }`}
                              >
                                &ldquo;{commentText}&rdquo;
                              </p>
                              {isLong && (
                                <button
                                  type="button"
                                  className="btn-prm-more"
                                  onClick={() => setReadingReview(review)}
                                >
                                  <span>Xem thêm</span>
                                  <FaArrowRight style={{ fontSize: "0.68rem", marginLeft: 4 }} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="prm-footer">
                <button
                  type="button"
                  className="btn-prm-footer-close"
                  onClick={() => setIsReviewsModalOpen(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL ĐỌC TOÀN VĂN NHẬN XÉT DÀI */}
      {readingReview &&
        createPortal(
          <div
            className="product-reviews-modal-backdrop"
            style={{ zIndex: 10001 }}
            onClick={() => setReadingReview(null)}
          >
            <div
              className="product-reading-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="prm-header">
                <div className="prm-header-info">
                  <h3>Cảm Nhận Khách Hàng</h3>
                  <span className="prm-product-title">{product?.name}</span>
                </div>
                <button
                  type="button"
                  className="btn-prm-close"
                  onClick={() => setReadingReview(null)}
                  aria-label="Đóng"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="product-reading-meta">
                <div className="prm-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FaStar
                      key={s}
                      className={
                        s <= (readingReview.rating || 0) ? "star-filled" : "star-empty"
                      }
                    />
                  ))}
                </div>
                <span className="product-reading-author">
                  Khách hàng: <strong>{readingReview.userFullName || "Khách hàng"}</strong>
                </span>
                <span className="product-reading-date">
                  {new Date(readingReview.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>

              <div className="product-reading-comment-box">
                <p className="product-reading-comment-text">
                  &ldquo;{readingReview.comment}&rdquo;
                </p>
              </div>

              <div className="prm-footer">
                <button
                  type="button"
                  className="btn-prm-footer-close"
                  style={{ width: "100%" }}
                  onClick={() => setReadingReview(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};

export default ProductDetail;
