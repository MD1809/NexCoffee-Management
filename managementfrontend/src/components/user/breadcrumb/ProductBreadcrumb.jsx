import React from "react";
import { Link } from "react-router-dom";

const ProductBreadcrumb = ({ categoryId, categoryName, productName }) => {
  return (
    <nav className="product-breadcrumb" aria-label="Đường dẫn sản phẩm">
      <Link to="/menu">MENU</Link>

      {categoryName && (
        <>
          <span>/</span>

          {categoryId ? (
            <Link to={`/menu?category=${categoryId}`}>{categoryName}</Link>
          ) : (
            <span>{categoryName}</span>
          )}
        </>
      )}

      {productName && (
        <>
          <span>/</span>
          <strong>{productName}</strong>
        </>
      )}
    </nav>
  );
};

export default ProductBreadcrumb;
