import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import AdminLayout from './pages/Admin/AdminLayout';
import Dashboard from './pages/Admin/Dashboard';
import Banners from './pages/Admin/Banners';
import Products from './pages/Admin/Products';
import Categories from './pages/Admin/Categories';
import Orders from './pages/Admin/Orders';
import OrderDetail from './pages/Admin/OrderDetail';
import OrderHistory from './pages/Admin/OrderHistory';
import Users from './pages/Admin/Users';
import Chat from './pages/Admin/Chat';
import Coupons from './pages/Admin/Coupons';
import AdminNotifications from './pages/Admin/Notifications';
import InvoiceTemplatePage from './pages/Admin/InvoiceTemplatePage';
import HomePageSettingsPage from './pages/Admin/HomePageSettings';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import OrdersPage from './pages/OrdersPage';
import OrderStatusPage from './pages/OrderStatusPage';
import WishlistPage from './pages/WishlistPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:slug" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/orders/status/:orderNumber" element={<OrderStatusPage />} />
      <Route path="/payment/:orderId" element={<PaymentPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/homepage" element={<Navigate to="/" replace />} />
      <Route path="/home" element={<Navigate to="/" replace />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="banners" element={<Banners />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="order-history" element={<OrderHistory />} />
        <Route path="users" element={<Users />} />
        <Route path="chat" element={<Chat />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="invoice-template" element={<InvoiceTemplatePage />} />
        <Route path="homepage-settings" element={<HomePageSettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
