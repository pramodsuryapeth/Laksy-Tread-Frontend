import { Routes, Route } from "react-router-dom";

/* ================= ADMIN ================= */
import AdminLayout from "../layout/AdminLayout";
import AdminLogin from "../pages/admin/Login";
import Dashboard from "../pages/admin/Dashboard";
import AddProduct from "../pages/admin/AddProduct";
import Products from "../pages/admin/Products";
import Orders from "../pages/admin/Orders";
import AdminRoute from "../components/common/AdminRoute";

/* ================= USER ================= */
import UserLayout from "../layout/UserLayout";
import Home from "../pages/user/Home";
import ProductDetails from "../pages/user/ProductDetails";
import CustomizeProduct from "../pages/user/CustomizeProduct";
import Cart from "../pages/user/Cart";
import Checkout from "../pages/user/Checkout";
import Profile from "../pages/user/Profile";
import ReviewPage from "../pages/user/ReviewPage"

// optional protection
import UserRoute from "../components/common/UserRoute";
import { CanvasProvider } from '../context/CanvasProvider';

const AppRoutes = () => {
  return (
    <Routes>

      {/* ================= ADMIN ROUTES ================= */}

      {/* Login */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Dashboard */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </AdminRoute>
        }
      />

      {/* Products */}
      <Route
        path="/admin/products"
        element={
          <AdminRoute>
            <AdminLayout>
              <Products />
            </AdminLayout>
          </AdminRoute>
        }
      />

      {/* Add Product */}
      <Route
        path="/admin/add-product"
        element={
          <AdminRoute>
            <AdminLayout>
              <AddProduct />
            </AdminLayout>
          </AdminRoute>
        }
      />

      {/* Orders */}
      <Route
        path="/admin/orders"
        element={
          <AdminRoute>
            <AdminLayout>
              <Orders />
            </AdminLayout>
          </AdminRoute>
        }
      />

      {/* ================= USER ROUTES ================= */}

      {/* Home (public) */}
      <Route
        path="/"
        element={
          <UserLayout>
            <Home />
          </UserLayout>
        }
      />
      <Route
  path="/product/:id"
  element={
    <UserLayout>
      <ProductDetails />
    </UserLayout>
  }
/>

<Route
  path="/customize/:productId"
  element={
    <UserLayout>
    <CanvasProvider>
      <CustomizeProduct />
    </CanvasProvider>
    </UserLayout>
  }
/>

      {/* Cart (protected) */}
      <Route
        path="/cart"
        element={
          <UserRoute>
            <UserLayout>
              <Cart />
            </UserLayout>
          </UserRoute>
        }
      />

         <Route
        path="/checkout"
        element={
          <UserRoute>
            <UserLayout>
              <Checkout />
            </UserLayout>
          </UserRoute>
        }
      />

      {/* Profile (protected) */}
      <Route
        path="/profile"
        element={
          <UserRoute>
            <UserLayout>
              <Profile />
            </UserLayout>
          </UserRoute>
        }
      />
       <Route
        path="/review/:orderId"
        element={
          <UserRoute>
            <UserLayout>
              <ReviewPage />
            </UserLayout>
          </UserRoute>
        }
      />

    </Routes>
  );
};

export default AppRoutes;