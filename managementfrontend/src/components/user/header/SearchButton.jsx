import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getSearchProducts } from "../../../apis/searchApi";
import "./SearchButton.css";

const BACKEND_URL = "http://localhost:8080";

const PLACEHOLDER_TEXTS = [
  "Bạn muốn thưởng thức gì hôm nay?",
  "Tìm cà phê, trà, bánh ngọt...",
  "Nhập tên món bạn yêu thích...",
];

const normalizeText = (value = "") => {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "đ";
};

const getImageUrl = (product) => {
  const imagePath = product?.mainImage?.url || product?.imageUrl || "";

  if (!imagePath) return "";

  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/images")) return `${BACKEND_URL}${imagePath}`;
  if (imagePath.startsWith("images")) return `${BACKEND_URL}/${imagePath}`;

  return `${BACKEND_URL}/images/${imagePath}`;
};

const getMinPrice = (product) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];

  const availablePrices = variants
    .filter((variant) => variant.status === "available")
    .map((variant) => Number(variant.price || 0))
    .filter((price) => price > 0);

  if (availablePrices.length === 0) return 0;

  return Math.min(...availablePrices);
};

const normalizeProductList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.products)) return data.products;

  return [];
};

const SearchButton = () => {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const isFetchingProductsRef = useRef(false);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (isFetchingProductsRef.current) return;

    try {
      isFetchingProductsRef.current = true;
      setProductsLoading(true);

      const data = await getSearchProducts();
      setProducts(normalizeProductList(data));
      setProductsLoaded(true);
    } catch (error) {
      setProducts([]);
      setProductsLoaded(false);
    } finally {
      setProductsLoading(false);
      isFetchingProductsRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 250);

    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    const currentText = PLACEHOLDER_TEXTS[placeholderIndex];

    const typingTimer = setTimeout(
      () => {
        if (!isDeleting) {
          setPlaceholderText(currentText.slice(0, typingIndex + 1));
          setTypingIndex((prev) => prev + 1);

          if (typingIndex + 1 === currentText.length) {
            setTimeout(() => setIsDeleting(true), 900);
          }
        } else {
          setPlaceholderText(currentText.slice(0, typingIndex - 1));
          setTypingIndex((prev) => prev - 1);

          if (typingIndex - 1 === 0) {
            setIsDeleting(false);
            setPlaceholderIndex(
              (prev) => (prev + 1) % PLACEHOLDER_TEXTS.length,
            );
          }
        }
      },
      isDeleting ? 45 : 80,
    );

    return () => clearTimeout(typingTimer);
  }, [typingIndex, isDeleting, placeholderIndex]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const searchResults = useMemo(() => {
    const normalizedKeyword = normalizeText(debouncedKeyword);

    if (!normalizedKeyword || normalizedKeyword.length < 2) return [];

    const keywords = normalizedKeyword.split(/\s+/).filter(Boolean);

    return products
      .filter((product) => normalizeText(product.status) === "active")
      .filter((product) => {
        const name = normalizeText(product.name);

        return keywords.every((word) => name.includes(word));
      })
      .sort((a, b) => {
        const nameA = normalizeText(a.name);
        const nameB = normalizeText(b.name);

        const aStarts = nameA.startsWith(normalizedKeyword);
        const bStarts = nameB.startsWith(normalizedKeyword);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return nameA.localeCompare(nameB);
      });
  }, [products, debouncedKeyword]);

  const shouldShowDropdown = isFocused && keyword.trim().length > 0;

  const handleGoToProduct = (productId) => {
    setKeyword("");
    setIsFocused(false);
    navigate(`/products/${productId}`);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (searchResults.length > 0) {
      handleGoToProduct(searchResults[0].id);
    }
  };

  return (
    <div className="user-search-box" ref={searchRef}>
      <form className="user-search-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={keyword}
          placeholder={placeholderText}
          onChange={(event) => setKeyword(event.target.value)}
          onFocus={() => {
            setIsFocused(true);

            if (!productsLoaded && !productsLoading) {
              fetchProducts();
            }
          }}
        />

        <button type="submit" aria-label="Tìm kiếm">
          <FaSearch />
        </button>
      </form>

      {shouldShowDropdown && (
        <div className="user-search-dropdown">
          <div className="user-search-title">
            Kết quả tìm kiếm cho <strong>{keyword.trim()}</strong>
          </div>

          {productsLoading && !productsLoaded ? (
            <div className="user-search-empty">Đang tải sản phẩm...</div>
          ) : searchResults.length === 0 ? (
            <div className="user-search-empty">
              Không tìm thấy sản phẩm phù hợp
            </div>
          ) : (
            <div className="user-search-list">
              {searchResults.map((product) => {
                const imageUrl = getImageUrl(product);
                const price = getMinPrice(product);

                return (
                  <button
                    type="button"
                    className="user-search-item"
                    key={product.id}
                    onClick={() => handleGoToProduct(product.id)}
                  >
                    {imageUrl ? (
                      <img src={imageUrl} alt={product.name} />
                    ) : (
                      <div className="user-search-placeholder">Nex</div>
                    )}

                    <div className="user-search-info">
                      <h4>{product.name}</h4>
                      <p>{price > 0 ? formatCurrency(price) : "Liên hệ"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchButton;
