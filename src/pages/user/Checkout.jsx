// pages/Checkout.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import API from "../../services/api";
import Popup from "../../components/common/Popup";
import Loader from "../../components/common/Loader";
import { uploadFiles } from "../../services/uploadSevice";

// ------------------- Sub-components (outside render) -------------------
const StepIndicator = ({ currentStep }) => (
  <div className="flex items-center justify-between mb-8">
    {[1, 2, 3, 4, 5, 6, 7].map((s) => (
      <div key={s} className="flex items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            currentStep === s
              ? "bg-black text-white"
              : currentStep > s
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          {currentStep > s ? "✓" : s}
        </div>
        {s < 7 && (
          <div
            className={`w-12 h-0.5 mx-1 ${
              currentStep > s ? "bg-green-500" : "bg-gray-200"
            }`}
          />
        )}
      </div>
    ))}
  </div>
);

const SectionCard = ({ children, title }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
    {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
    {children}
  </div>
);

// ------------------- Main Checkout Component -------------------
function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [popup, setPopup] = useState({ show: false, type: "info", message: "" });
  const [isProcessing, setIsProcessing] = useState(false);

  const [orderData, setOrderData] = useState({
    items: state?.selectedItems || [],   // 🔥 SAME FOR CART + BUY NOW
    fromCart: state?.fromCart || false,
    address: {
      name: "",
      email: "",
      phone: "",
      addressLine: "",
      city: "",
      state: "",
      pincode: "",
    },
    deliveryType: "",
    uploadedFiles: [],
    note: "",
    charges: {
      productTotal: 0,
      deliveryCharge: 0,
      gst: 0,
      finalAmount: 0,
    },
  });

  const showPopup = (message, type = "error") => {
    setPopup({ show: true, type, message });
  };

  const closePopup = () => setPopup({ show: false, type: "info", message: "" });

  // ---------- PDF Validation ----------
const handleFileUpload = async (e) => {
  const files = Array.from(e.target.files);

  const valid = files.filter(
    (f) =>
      f.type.startsWith("image/") ||
      f.type === "application/pdf"
  );

  if (valid.length !== files.length) {
    showPopup("Only PDF and image files allowed ❌", "error");
    return;
  }

  if (valid.length > 5) {
    showPopup("Max 5 files allowed", "error");
    return;
  }

  try {
    const formData = new FormData();

    valid.forEach((file) => {
      formData.append("files", file); // 🔥 same name as backend
    });

    setIsProcessing(true); // optional loader

    const urls = await uploadFiles(formData); // 🔥 API call

    setOrderData((prev) => ({
      ...prev,
      uploadedFiles: urls, // ✅ now URLs
    }));

    showPopup("Files uploaded successfully ✅", "success");

  } catch (err) {
    console.error(err);
    showPopup("Upload failed ❌", "error");
  } finally {
    setIsProcessing(false);
  }
};

  // ---------- Address Validation ----------
  const validateAddress = () => {
    const { name, email, phone, addressLine, city, state, pincode } = orderData.address;
    if (!name || !email || !phone || !addressLine || !city || !state || !pincode) {
      showPopup("Please fill all address fields", "error");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showPopup("Please enter a valid email address", "error");
      return false;
    }
    if (phone.length < 10 || phone.length > 15) {
      showPopup("Please enter a valid phone number", "error");
      return false;
    }
    if (pincode.length < 4 || pincode.length > 10) {
      showPopup("Please enter a valid pincode", "error");
      return false;
    }
    return true;
  };

  // ---------- Calculate Charges ----------
  const calculateCharges = () => {
    const productTotal = orderData.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    const delivery = orderData.deliveryType === "delivery" ? 50 : 0;
    const gst = 0;

    setOrderData((prev) => ({
      ...prev,
      charges: {
        productTotal,
        deliveryCharge: delivery,
        gst,
        finalAmount: productTotal + delivery + gst,
      },
    }));
  };

  // ---------- Razorpay Payment ----------
  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const res = await API.post("/order/razorpay-order", {
        amount: orderData.charges.finalAmount,
      });
      const order = res.data;

     const options = {
  key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_SlFENtTIAMo2e3",   // ✅ FIXED
  amount: order.amount,
  currency: "INR",
  name: "Lakshy Trade",
  description: "Order Payment",
  order_id: order.id,

  config: {
  display: {
    blocks: {
      upi: {
        name: "Pay using UPI",
        instruments: [
          {
            method: "upi"
          }
        ]
      }
    },
    sequence: ["block.upi"],
    preferences: {
      show_default_blocks: true
    }
  }
},

  prefill: {
    name: orderData.address.name || "Guest",
    email: orderData.address.email || "test@example.com",
    contact: orderData.address.phone || "9999999999",
  },

  handler: async (response) => {
    try {
      await API.post("/order/verify-payment", {
        ...response,
        orderData: {
          user: orderData.address,
          items: orderData.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            size: item.size,
            color: item.color,
            designImage: item.designImage,
          })),
          uploadedFiles: orderData.uploadedFiles,
          note: orderData.note,
          deliveryType: orderData.deliveryType,
          charges: orderData.charges,
          clearCart: orderData.fromCart,
        },
      });

      setStep(7);
      showPopup("Payment successful! Order confirmed 🎉", "success");
    } catch (err) {
      console.error(err);
      showPopup("Payment verification failed.", "error");
    } finally {
      setIsProcessing(false);
    }
  },

  modal: {
    ondismiss: () => {
      setIsProcessing(false);
      showPopup("Payment cancelled", "warning");
    },
  },

  theme: { color: "#000" },
};

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      showPopup("Failed to initiate payment. Please try again.", "error");
      setIsProcessing(false);
    }
  };

  // ---------- Update address field ----------
  const updateAddressField = (field, value) => {
    setOrderData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };
console.log("Checkout items 👉", orderData.items);
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Popup
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={closePopup}
        showConfirm={false}
        showResend={false}
      />

      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-center">Checkout</h1>
          <StepIndicator currentStep={step} />
        </div>

        {/* ── STEP 1 — Product Summary ── */}
        {step === 1 && (
          <SectionCard title="Product Summary">
            <div className="space-y-4">
              {orderData.items.map((item) => (
                <div key={item.variantId} className="flex gap-4 pb-4 border-b last:border-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-24 w-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{item.name}</h2>
                    <p className="text-gray-600">
                      {item.size && `Size: ${item.size}`}
                      {item.color && ` | Color: ${item.color}`}
                    </p>
                    <p className="text-gray-600">Qty: {item.quantity}</p>
                    <p className="text-2xl font-bold mt-2">₹{item.price}</p>

                    {/* ✅ Design preview — front + back thumbnails */}
                    {item.designImage?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Design:</p>
                        <div className="flex gap-2">
                          {item.designImage.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt={`Design ${i + 1}`}
                              className="w-16 h-16 border rounded object-cover"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full bg-black text-white py-3 rounded-lg mt-6 hover:bg-gray-800 transition"
            >
              Proceed to Address
            </button>
          </SectionCard>
        )}

        {/* ── STEP 2 — Address Details ── */}
        {step === 2 && (
          <SectionCard title="Delivery Address">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={orderData.address.name}
                onChange={(e) => updateAddressField("name", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={orderData.address.email}
                onChange={(e) => updateAddressField("email", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={orderData.address.phone}
                onChange={(e) => updateAddressField("phone", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              />
              <input
                type="text"
                placeholder="Street Address"
                value={orderData.address.addressLine}
                onChange={(e) => updateAddressField("addressLine", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              />
              <input
                type="text"
                placeholder="City"
                value={orderData.address.city}
                onChange={(e) => updateAddressField("city", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              />
              <input
                type="text"
                placeholder="State"
                value={orderData.address.state}
                onChange={(e) => updateAddressField("state", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              />
              <input
                type="text"
                placeholder="Pincode"
                value={orderData.address.pincode}
                onChange={(e) => updateAddressField("pincode", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => { if (validateAddress()) setStep(3); }}
                className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800"
              >
                Next → Delivery
              </button>
            </div>
          </SectionCard>
        )}

        {/* ── STEP 3 — Delivery Option ── */}
        {step === 3 && (
          <SectionCard title="Choose Delivery Method">
            <div className="space-y-3">
              <button
                onClick={() => setOrderData((prev) => ({ ...prev, deliveryType: "delivery" }))}
                className={`w-full p-4 border-2 rounded-lg text-left transition ${
                  orderData.deliveryType === "delivery"
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">Home Delivery 🚚</p>
                    <p className="text-sm text-gray-500">Delivered to your doorstep</p>
                  </div>
                  <p className="font-semibold">₹50</p>
                </div>
              </button>
              <button
                onClick={() => setOrderData((prev) => ({ ...prev, deliveryType: "pickup" }))}
                className={`w-full p-4 border-2 rounded-lg text-left transition ${
                  orderData.deliveryType === "pickup"
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">Store Pickup 🏬</p>
                    <p className="text-sm text-gray-500">Free pickup from our store</p>
                  </div>
                  <p className="font-semibold text-green-600">Free</p>
                </div>
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!orderData.deliveryType) {
                    showPopup("Please select a delivery method", "error");
                    return;
                  }
                  setStep(4);
                }}
                className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800"
              >
                Next → Upload
              </button>
            </div>
          </SectionCard>
        )}

        {/* ── STEP 4 — Upload PDF + Note ── */}
        {step === 4 && (
          <SectionCard title="Additional Information">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload PDF Documents (Max 5 files)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="w-full p-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
                />
                {orderData.uploadedFiles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium">Uploaded files:</p>
                    {orderData.uploadedFiles.map((file, i) => (
                      <p key={i} className="text-sm text-gray-600"> 📄 File {i + 1}</p>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add a Note (Optional)
                </label>
                <textarea
                  placeholder="Any special instructions for the seller..."
                  value={orderData.note}
                  onChange={(e) => setOrderData((prev) => ({ ...prev, note: e.target.value }))}
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(3)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => { calculateCharges(); setStep(5); }}
                className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800"
              >
                Next → Review
              </button>
            </div>
          </SectionCard>
        )}

        {/* ── STEP 5 — Order Review ── */}
        {step === 5 && (
          <SectionCard title="Order Summary">
            <div className="space-y-4">
              {orderData.items.map((item) => (
                <div key={item.variantId} className="flex gap-4 pb-4 border-b">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    {item.size && <p className="text-gray-600">Size: {item.size}</p>}
                    {item.color && <p className="text-gray-600">Color: {item.color}</p>}
                    <p className="text-gray-600">Qty: {item.quantity}</p>
                    <p className="font-semibold">₹{item.price}</p>

                    {/* ✅ Design preview — front + back thumbnails */}
                    {item.designImage?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Design:</p>
                        <div className="flex gap-2">
                          {item.designImage.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt={`Design ${i + 1}`}
                              className="w-14 h-14 border rounded object-cover"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Address:</span>
                  <span className="text-right">
                    {orderData.address.name}, {orderData.address.addressLine},{" "}
                    {orderData.address.city}, {orderData.address.state} -{" "}
                    {orderData.address.pincode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Method:</span>
                  <span className="capitalize">
                    {orderData.deliveryType === "delivery" ? "Home Delivery" : "Store Pickup"}
                  </span>
                </div>
                {orderData.uploadedFiles.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Documents:</span>
                    <span>{orderData.uploadedFiles.length} PDF(s)</span>
                  </div>
                )}
                {orderData.note && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Note:</span>
                    <span className="italic">{orderData.note}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Product Total</span>
                  <span>₹{orderData.charges.productTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span>₹{orderData.charges.deliveryCharge}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>₹{orderData.charges.gst}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total Amount</span>
                  <span>₹{orderData.charges.finalAmount}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(4)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(6)}
                className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800"
              >
                Proceed to Payment
              </button>
            </div>
          </SectionCard>
        )}

        {/* ── STEP 6 — Payment ── */}
        {step === 6 && (
          <SectionCard title="Payment">
            <div className="text-center space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-600 mb-2">Total Amount to Pay</p>
                <p className="text-4xl font-bold">₹{orderData.charges.finalAmount}</p>
              </div>
              {isProcessing ? (
                <Loader />
              ) : (
                <button
                  onClick={handlePayment}
                  className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition"
                >
                  Pay ₹{orderData.charges.finalAmount}
                </button>
              )}
              <button
                onClick={() => setStep(5)}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </SectionCard>
        )}

        {/* ── STEP 7 — Success ── */}
        {step === 7 && (
          <SectionCard>
            <div className="text-center py-8">
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold mb-2">Order Confirmed! 🎉</h2>
              <p className="text-gray-600 mb-6">
                Thank you for your purchase. You will receive an email confirmation shortly.
              </p>
              <button
                onClick={() => navigate("/")}
                className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition"
              >
                Continue Shopping
              </button>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

export default Checkout;