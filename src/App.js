import './App.css';
import React, { useEffect, useRef, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';

// Components
import Navbar from './components/Header/Navbar';
import Footer from './components/Footer/Footer';
import MiniCart from './components/Cart/MiniCart';
import ChatModal from './components/Chat/ChatModal';
import ChatWidget from './components/Chat/ChatWidget';

// Context Providers
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Protected Routes
import { PrivateRoute, AdminRoute } from './components/Auth/ProtectedRoutes';

// Static imports for all pages (avoid lazy runtime issues)
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';
import NotFoundPage from './pages/NotFoundPage';
import OrdersPage from './pages/OrdersPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import OrderDetailPage from './pages/OrderDetailPage';

// Static imports for admin pages
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminProducts from './pages/Admin/Products';
import AdminCategories from './pages/Admin/Categories';
import AdminOrders from './pages/Admin/Orders';
import AdminUsers from './pages/Admin/Users';
import AdminBanners from './pages/Admin/Banners';
import AdminOrderHistory from './pages/Admin/OrderHistory';
import AdminCoupons from './pages/Admin/Coupons';
import AdminChat from './pages/Admin/Chat';
import AdminOrderDetail from './pages/Admin/OrderDetail';

const RoutedContent = React.memo(function RoutedContent() {
  const location = useLocation();
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const animation = gsap.fromTo(
      el, 
      { opacity: 0, y: 10 }, 
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
    );

    return () => {
      animation.kill();
    };
  }, [location.pathname]);

  return (
    <div ref={containerRef} style={{ padding: 24 }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* Protected Routes */}
        <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
        <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
        <Route path="/payment/:orderId" element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
        <Route path="/orders/:orderId" element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:orderId" element={<AdminOrderDetail />} />
          <Route path="order-history" element={<AdminOrderHistory />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="chat" element={<AdminChat />} />
        </Route>
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/wishlist/shared/:token" element={<WishlistPage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
});

function App() {
  function PageShell() {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');
    return (
      <>
        <Navbar />
        <RoutedContent />
        {!isAdminRoute && <Footer />}
        <MiniCart />
        <ChatModal />
        {!isAdminRoute && <ChatWidget />}
      </>
    );
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <WishlistProvider>
              <PageShell />
            </WishlistProvider>
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
