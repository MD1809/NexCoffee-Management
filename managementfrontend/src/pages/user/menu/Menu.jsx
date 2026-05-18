import React, { useEffect, useMemo, useState } from "react";
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
    const fetchMenuData = async () => {
      try {
        setLoading(true);

        const [productsResponse, categoriesResponse] = await Promise.all([
          getMenuProducts(),
          getMenuCategories(),
        ]);

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
        toast.error("Không thể tải menu sản phẩm.");
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
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

          <ul>
            <li>
              <button
                type="button"
                className={`menu-category-btn ${
                  activeCategoryId === "all" ? "active" : ""
                }`}
                onClick={() => setActiveCategoryId("all")}
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
                  onClick={() => setActiveCategoryId(category.id)}
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="menu-content" id="menu-content">
          {loading && <p className="menu-empty">Đang tải menu...</p>}

          {!loading && Object.keys(groupedProducts).length === 0 && (
            <p className="menu-empty">Không tìm thấy sản phẩm phù hợp.</p>
          )}

          {!loading &&
            Object.entries(groupedProducts).map(([groupName, items]) => (
              <div className="menu-group" key={groupName}>
                <h2>{groupName}</h2>

                <div className="menu-products">
                  {items.map((product) => (
                    <ProductCard product={product} key={product.id} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default Menu;
