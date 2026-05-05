import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyOrders } from "../../services/ordreService";

function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getMyOrders();

        console.log("API RESPONSE 👉", res.data); // 🔥 DEBUG

        setOrders(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Profile</h2>

      {/* 👤 USER INFO */}
      <div className="bg-white p-6 rounded-xl shadow space-y-3 mb-6">
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
      </div>

      {/* 🛒 ORDERS */}
      <h3 className="text-xl font-semibold mb-3">My Orders</h3>

      {orders.length === 0 ? (
        <p className="text-gray-500">No orders found ❌</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white p-4 rounded-lg shadow border"
            >
              <p className="font-semibold">Status: {order.status}</p>

              <p className="text-green-600 font-bold">
                ₹{order.charges?.finalAmount}
              </p>

              {/* 🔥 REVIEW BUTTON */}
              {order.status === "delivered" && !order.isReviewed && (
                <button
                  onClick={() => {
                    console.log("ORDER 👉", order);
                    console.log("ITEMS 👉", order.items);

                    const rawProduct = order.items?.[0]?.productId;

                    console.log("RAW PRODUCT 👉", rawProduct);

                    // 🔥 FIX (object किंवा string handle)
                    const productId =
                      typeof rawProduct === "object"
                        ? rawProduct._id
                        : rawProduct;

                    console.log("FINAL PRODUCT ID 👉", productId);

                    if (!productId) {
                      alert("Product not found ❌");
                      return;
                    }

                    navigate(
                      `/review/${order._id}?productId=${productId}`
                    );
                  }}
                  className="bg-black text-white px-3 py-1 rounded mt-2"
                >
                  ⭐ Write Review
                </button>
              )}

              {/* 🧾 ITEMS */}
              <div className="mt-3 space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <img
                      src={item.image}
                      alt=""
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.size && `Size: ${item.size}`}{" "}
                        {item.color && `| Color: ${item.color}`}
                      </p>
                      <p className="text-xs">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 mt-2">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Profile;