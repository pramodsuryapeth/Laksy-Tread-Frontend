// src/pages/admin/Dashboard.jsx
import { useEffect, useState } from "react";
import PageWrapper from "../../components/admin/PageWrapper";
import StatCard from "../../components/admin/StatCard";
import { getDashboardStats } from "../../services/adminService";
import { getErrorMessage } from "../../utils/getErrorMessage";

// Helper to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
};

// Skeleton card for stats loading
const StatCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-6 sm:h-8 bg-gray-200 rounded w-3/4"></div>
  </div>
);

// Skeleton for recent orders table rows
const RecentOrdersSkeleton = () => (
  <div className="animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-16 sm:w-24"></div>
        <div className="h-4 bg-gray-200 rounded w-20 sm:w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-14 sm:w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-12 sm:w-16"></div>
        <div className="h-4 bg-gray-200 rounded w-20 sm:w-28"></div>
      </div>
    ))}
  </div>
);

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setData(res.data);
        setRecentOrders(res.data.recentOrders || []);
      } catch (err) {
        console.error(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRecentLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <PageWrapper title="Dashboard">
        <div className="mb-6">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-32 sm:w-48 animate-pulse mb-2"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-56 sm:w-72 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 mb-8">
          {[...Array(6)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-24 sm:w-32 animate-pulse"></div>
          </div>
          <RecentOrdersSkeleton />
        </div>
      </PageWrapper>
    );
  }

  const pendingOrders = (data.totalOrders || 0) - (data.completedOrders || 0);
  const revenue = data.revenue || 0;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PageWrapper title="Dashboard">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Welcome back, Admin</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 mb-8">
        <StatCard
          title="Total Products"
          value={data.totalProducts || 0}
          icon={
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          title="Total Orders"
          value={data.totalOrders || 0}
          icon={
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
          color="purple"
        />
        <StatCard
          title="New Orders"
          value={data.newOrders || 0}
          icon={
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="orange"
        />
        <StatCard
          title="Completed Orders"
          value={data.completedOrders || 0}
          icon={
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
        />
        <StatCard
          title="Pending Orders"
          value={pendingOrders}
          icon={
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="red"
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(revenue)}
          icon={
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
        />
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">🔄 Recent Orders</h3>
          <button className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors">
            View all →
          </button>
        </div>

        {recentLoading ? (
          <RecentOrdersSkeleton />
        ) : recentOrders.length > 0 ? (
          <div className="overflow-x-auto min-w-full">
            <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider hidden xs:table-cell">Customer</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap font-medium text-gray-900 text-xs sm:text-sm">
                      #{order.orderId || order._id.slice(-6)}
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-gray-600 text-xs sm:text-sm hidden xs:table-cell">
                      {order.user?.name || "Guest"}
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap font-medium text-gray-800 text-xs sm:text-sm">
                      {formatCurrency(order.charges?.finalAmount || 0)}
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status || "pending"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-gray-500 text-xs sm:text-sm hidden sm:table-cell">
                      {new Date(order.createdAt || order.date).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-sm sm:text-base text-gray-400">
            No recent orders found.
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

export default Dashboard;