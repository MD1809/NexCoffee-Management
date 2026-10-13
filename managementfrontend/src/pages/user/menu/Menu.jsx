import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import "./Menu.css";
import ProductCard from "../../../components/user/product-card/ProductCard";
import { getMenuCategories, getMenuProducts } from "../../../apis/menuApi";

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

const getCategoryId = (product) => {
  return (
    product.category?.id ??
    product.categoryId ??
    product.idCategory ??
    product.category_id ??
    null
  );
};

const getCategoryName = (product) => {
  return (
    product.category?.name ||
    product.categoryName ||
    product.nameCategory ||
    "Sản phẩm khác"
  );
};

const isProductActive = (product) => {
  return String(product.status || "").toLowerCase() === "active";
};

const groupProductsByCategory = (products) => {
  return products.reduce((result, product) => {
    const groupName = getCategoryName(product);

    if (!result[groupName]) {
      result[groupName] = [];
    }

    result[groupName].push(product);

    return result;
  }, {});
};

const Menu = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [keyword, setKeyword] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");

    if (categoryFromUrl) {
      setActiveCategoryId(categoryFromUrl);
    } else {
      setActiveCategoryId("all");
    }
  }, [searchParams]);
  useEffect(() => {
    let isMounted = true;

    const fetchMenuData = async () => {
      try {
        setLoading(true);

        const [productsResponse, categoriesResponse] = await Promise.all([
          getMenuProducts(),
          getMenuCategories(),
        ]);

        if (!isMounted) return;

        const productsData = Array.isArray(productsResponse)
          ? productsResponse
          : Array.isArray(productsResponse?.data)
            ? productsResponse.data
            : [];

        const categoriesData = Array.isArray(categoriesResponse)
          ? categoriesResponse
          : Array.isArray(categoriesResponse?.data)
            ? categoriesResponse.data
            : [];

        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        if (!isMounted) return;
        toast.error("Không thể tải menu sản phẩm.");
        setProducts([]);
        setCategories([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMenuData();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleProducts = useMemo(() => {
    const normalizedKeyword = normalizeText(keyword);

    return products.filter((product) => {
      if (!isProductActive(product)) {
        return false;
      }

      const productCategoryId = getCategoryId(product);

      const matchCategory =
        activeCategoryId === "all" ||
        String(productCategoryId) === String(activeCategoryId);

      const matchKeyword =
        !normalizedKeyword ||
        normalizeText(product.name).includes(normalizedKeyword) ||
        normalizeText(product.description).includes(normalizedKeyword) ||
        normalizeText(getCategoryName(product)).includes(normalizedKeyword);

      return matchCategory && matchKeyword;
    });
  }, [products, activeCategoryId, keyword]);

  const groupedProducts = useMemo(() => {
    return groupProductsByCategory(visibleProducts);
  }, [visibleProducts]);

  const visibleCategories = useMemo(() => {
    const activeProducts = products.filter(isProductActive);
    const usedCategoryIds = new Set(
      activeProducts.map((product) => String(getCategoryId(product))),
    );

    return categories.filter((category) => {
      return usedCategoryIds.has(String(category.id));
    });
  }, [products, categories]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <section className="menu-section fade-in">
      <div className="main-content menu-container">
        {/* Cột lọc danh mục bên trái */}
        <div className="menu-sidebar-wrapper">
          <aside className="menu-sidebar">
            <form className="menu-search" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                value={keyword}
                placeholder="Tìm đồ uống..."
                onChange={(event) => setKeyword(event.target.value)}
              />
              <button type="submit">Tìm</button>
            </form>

            <h3 className="menu-sidebar-heading">Danh Mục</h3>

            {loading && categories.length === 0 ? (
              <ul className="menu-category-skeleton-list">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <li key={idx}>
                    <div className="skeleton-category-item skeleton-shimmer"></div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul>
                <li>
                  <button
                    type="button"
                    className={`menu-category-btn ${
                      activeCategoryId === "all" ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveCategoryId("all");
                      setSearchParams({});
                    }}
                  >
                    Tất cả
                  </button>
                </li>

                {visibleCategories.map((category) => (
                  <li key={category.id}>
                    <button
                      type="button"
                      className={`menu-category-btn ${
                        String(activeCategoryId) === String(category.id)
                          ? "active"
                          : ""
                      }`}
                      onClick={() => {
                        setActiveCategoryId(category.id);
                        setSearchParams({ category: String(category.id) });
                      }}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>

        {/* Cột danh sách sản phẩm bên phải */}
        <div className="menu-content" id="menu-content">
          {loading ? (
            <div className="menu-skeleton-container" aria-busy="true" aria-label="Đang tải thực đơn...">
              {/* Nhóm sản phẩm 1 */}
              <div className="menu-group skeleton-group">
                <div className="skeleton-title skeleton-shimmer"></div>
                <div className="menu-products">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div className="menu-card menu-card-skeleton" key={`sk-1-${idx}`}>
                      <div className="skeleton-img skeleton-shimmer"></div>
                      <div className="menu-card-info skeleton-card-info">
                        <div className="skeleton-line skeleton-name skeleton-shimmer"></div>
                        <div className="skeleton-line skeleton-price skeleton-shimmer"></div>
                      </div>
                      <div className="skeleton-cart-btn skeleton-shimmer"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nhóm sản phẩm 2 */}
              <div className="menu-group skeleton-group">
                <div className="skeleton-title skeleton-title-short skeleton-shimmer"></div>
                <div className="menu-products">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div className="menu-card menu-card-skeleton" key={`sk-2-${idx}`}>
                      <div className="skeleton-img skeleton-shimmer"></div>
                      <div className="menu-card-info skeleton-card-info">
                        <div className="skeleton-line skeleton-name skeleton-shimmer"></div>
                        <div className="skeleton-line skeleton-price skeleton-shimmer"></div>
                      </div>
                      <div className="skeleton-cart-btn skeleton-shimmer"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : Object.keys(groupedProducts).length === 0 ? (
            <p className="menu-empty">Không tìm thấy sản phẩm phù hợp.</p>
          ) : (
            Object.entries(groupedProducts).map(([groupName, items]) => (
              <div className="menu-group" key={groupName}>
                <h2>{groupName}</h2>

                <div className="menu-products">
                  {items.map((product) => (
                    <ProductCard product={product} key={product.id} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Menu;
