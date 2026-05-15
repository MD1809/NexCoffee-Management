import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layout Page
import AdminLayout from "../layouts/admin/AdminLayout";

// Content AdminPage
import DashBoardPage from "../pages/admin/dashboard/Dashboard";
import CategoriesPage from "../pages/admin/category/Categories";
import ProductsPage from "../pages/admin/product/Products";
import AddProductPage from "../pages/admin/product/AddProductPage";
import EditProductPage from "../pages/admin/product/EditProductPage";
import ProductDetailPage from "../pages/admin/product/ProductDetail";
import UsersPage from "../pages/admin/Users";
import OrderPage from "../pages/admin/order/Order";
import OrderDetailPage from "../pages/admin/order/OrderDetail";

function WebRouters() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashBoardPage />} />
            <Route path="categories" element={<CategoriesPage />}/>
            <Route path="products" element={<ProductsPage />}/>
            <Route path="products/add" element={<AddProductPage />}/>
            <Route path="products/edit/:id" element={<EditProductPage />}/>
            <Route path="products/detail/:id" element={<ProductDetailPage />}/>
            <Route path="users" element={<UsersPage />}/>
            <Route path="orders" element={<OrderPage />}/>
            <Route path="orders/detail/:id" element={<OrderDetailPage />}/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default WebRouters;
