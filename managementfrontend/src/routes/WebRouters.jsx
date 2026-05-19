import { BrowserRouter, Routes, Route } from "react-router-dom";
import UserLayout from "../layouts/user/UserLayout";
import Home from "../pages/user/Home";
import Login from "../pages/user/auth/login/Login";
import Register from "../pages/user/auth/register/Register";
import VerifyAccount from "../pages/user/auth/VerifyAccount";
import RegisterSuccess from "../pages/user/auth/register/RegisterSuccess";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ResendVerification from "../pages/user/auth/ResendVerification";
import Menu from "../pages/user/menu/Menu";
import ProtectedRoute from "./ProtectedRoute";
import BlockAdminRoute from "./BlockAdminRoute";
import GuestOnlyRoute from "./GuestOnlyRoute";
import ProductDetail from "../pages/user/product-detail/ProductDetail";
import Cart from "../pages/user/cart/Cart";

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
        {/* User routes */}
        <Route path="/" element={<UserLayout />}>
          {/* Guest + CUSTOMER được xem, ADMIN bị đá về /admin */}
          <Route element={<BlockAdminRoute />}>
            <Route index element={<Home />} />
            <Route path="menu" element={<Menu />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
          </Route>

          {/* Chỉ người chưa đăng nhập mới được vào */}
          <Route element={<GuestOnlyRoute />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          {/* Các route xác thực email vẫn để public */}
          <Route path="verify" element={<VerifyAccount />} />
          <Route path="register-success" element={<RegisterSuccess />} />
          <Route path="resend-verification" element={<ResendVerification />} />
        </Route>

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashBoardPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/add" element={<AddProductPage />} />
          <Route path="products/edit/:id" element={<EditProductPage />} />
          <Route path="products/detail/:id" element={<ProductDetailPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="orders" element={<OrderPage />} />
          <Route path="orders/detail/:id" element={<OrderDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default WebRouters;
