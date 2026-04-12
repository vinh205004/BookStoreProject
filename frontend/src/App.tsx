import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth & Layout
import ProtectedRoute from './components/ProtectedRoute';
import Login from './userpages/Auth/Login';
import Register from './userpages/Auth/Register';

// Admin Layout & Pages
import AdminLayout from './layouts/AdminLayout';
import Categories from './pages/Categories';
import Authors from './pages/Authors';
import Books from './pages/Books';
import Publishers from './pages/Publishers';
import Banners from './pages/Banners';
import Vouchers from './pages/Vouchers';
import Orders from './pages/Orders';
import Users from './pages/Users';
import AdminDashboard from './pages/AdminDashboard';

// User Layout & Pages
import UserLayout from './layouts/UserLayout';
import HomePage from './userpages/HomePage';
import ProductCatalog from './userpages/Product/ProductCatalog';
import ProductDetail from './userpages/Product/ProductDetail';
import Cart from './userpages/Cart/Cart';
import CheckoutPage from './userpages/Checkout/CheckoutPage';
import ProfilePage from './userpages/Account/ProfilePage';
import MyOrders from './userpages/Account/MyOrders';

// Component tạm để test giao điện (đã bỏ)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer - Public Routes */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductCatalog />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
        </Route>

        {/* Customer - Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<UserLayout />}>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="orders" element={<MyOrders />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="categories" element={<Categories />} />
            <Route path="authors" element={<Authors />} />
            <Route path="books" element={<Books />} />
            <Route path="banners" element={<Banners />} />
            <Route path="vouchers" element={<Vouchers />} />
            <Route path="orders" element={<Orders />} />
            <Route path="users" element={<Users />} />
            <Route path="publishers" element={<Publishers />} />
          </Route>
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} />
    </BrowserRouter>
  );
}

export default App;