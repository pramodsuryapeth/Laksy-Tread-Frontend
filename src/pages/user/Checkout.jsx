// pages/Checkout.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import API from "../../services/api";
import Popup from "../../components/common/Popup";
import Loader from "../../components/common/Loader";
import { uploadFiles } from "../../services/uploadSevice";

// ------------------- Responsive Step Indicator (New Style) -------------------
const StepIndicator = ({ currentStep }) => {
  const steps = [
    { id: 1, label: "Cart" },
    { id: 2, label: "Address" },
    { id: 3, label: "Delivery" },
    { id: 4, label: "Upload" },
    { id: 5, label: "Review" },
    { id: 6, label: "Payment" },
    { id: 7, label: "Confirm" },
  ];

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex justify-between min-w-[640px] md:min-w-0 md:flex-nowrap gap-2">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div className="relative flex items-center w-full">
              {/* Connector line (except last) */}
              {step.id < steps.length && (
                <div
                  className={`absolute left-1/2 w-full h-0.5 -z-10 transition-colors ${
                    currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                  }`}
                  style={{ left: "50%", width: "calc(100% - 2rem)" }}
                />
              )}
              <div className="relative z-10 flex justify-center w-full">
                <div
                  className={`
                    w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold
                    transition-all duration-300 shadow-md
                    ${
                      currentStep === step.id
                        ? "bg-black text-white ring-4 ring-black/20 scale-110"
                        : currentStep > step.id
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }
                  `}
                >
                  {currentStep > step.id ? "✓" : step.id}
                </div>
              </div>
            </div>
            <span
              className={`
                mt-2 text-[10px] md:text-xs font-medium text-center whitespace-nowrap
                ${currentStep === step.id ? "text-black font-bold" : "text-gray-500"}
              `}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SectionCard = ({ children, title }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
    {title && <h2 className="text-lg sm:text-xl font-bold mb-4">{title}</h2>}
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [orderData, setOrderData] = useState({
    items: state?.selectedItems || [],
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

  // ---------- File Upload with Progress Animation ----------
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);

    const valid = files.filter(
      (f) => f.type.startsWith("image/") || f.type === "application/pdf"
    );

    if (valid.length !== files.length) {
      showPopup("Only PDF and image files allowed ❌", "error");
      return;
    }

    if (valid.length > 5) {
      showPopup("Max 5 files allowed", "error");
      return;
    }

    if (valid.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    // Simulate progress (since actual upload progress might not be available)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const formData = new FormData();
      valid.forEach((file) => {
        formData.append("files", file);
      });

      const urls = await uploadFiles(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setOrderData((prev) => ({
          ...prev,
          uploadedFiles: urls,
        }));
        setUploading(false);
        setUploadProgress(0);
        showPopup("Files uploaded successfully ✅", "success");
      }, 300);
    } catch (err) {
      clearInterval(progressInterval);
      console.error(err);
      showPopup("Upload failed ❌", "error");
      setUploading(false);
      setUploadProgress(0);
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
    const delivery = orderData.deliveryType === "delivery" ? 60 : 0;
  const gst = Number(((productTotal + delivery) * 0.02).toFixed(2));

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
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: " The कला Trends",
        description: "Order Payment",
        order_id: order.id,
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay using UPI",
                instruments: [{ method: "upi" }],
              },
            },
            sequence: ["block.upi"],
            preferences: { show_default_blocks: true },
          },
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

  const updateAddressField = (field, value) => {
    setOrderData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-4 sm:px-6">
      <Popup
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={closePopup}
        showConfirm={false}
        showResend={false}
      />

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">Checkout</h1>
          <StepIndicator currentStep={step} />
        </div>

        {/* STEP 1 — Product Summary */}
        {step === 1 && (
          <SectionCard title="Your Items">
            <div className="space-y-4">
              {orderData.items.map((item) => (
                <div key={item.variantId} className="flex flex-col sm:flex-row gap-4 pb-4 border-b last:border-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-24 w-24 object-cover rounded-lg mx-auto sm:mx-0"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-lg sm:text-xl font-semibold">{item.name}</h2>
                    <p className="text-gray-600 text-sm">
                      {item.size && `Size: ${item.size}`}
                      {item.color && ` | Color: ${item.color}`}
                    </p>
                    <p className="text-gray-600">Qty: {item.quantity}</p>
                    <p className="text-xl font-bold mt-1">₹{item.price}</p>
                    {item.designImage?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Design:</p>
                        <div className="flex justify-center sm:justify-start gap-2 mt-1">
                          {item.designImage.map((img, i) => (
                            <img key={i} src={img} alt="design" className="w-12 h-12 border rounded object-cover" />
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

        {/* STEP 2 — Address Details */}
        {step === 2 && (
          <SectionCard title="Delivery Address">
            <div className="space-y-4">
              <input type="text" placeholder="Full Name" value={orderData.address.name} onChange={(e) => updateAddressField("name", e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black" />
              <input type="email" placeholder="Email Address" value={orderData.address.email} onChange={(e) => updateAddressField("email", e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black" />
              <input type="tel" placeholder="Phone Number" value={orderData.address.phone} onChange={(e) => updateAddressField("phone", e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black" />
              <input type="text" placeholder="House number And Area name" value={orderData.address.addressLine} onChange={(e) => updateAddressField("addressLine", e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black" />
              <input type="text" placeholder="City" value={orderData.address.city} onChange={(e) => updateAddressField("city", e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black" />
              <input type="text" placeholder="State" value={orderData.address.state} onChange={(e) => updateAddressField("state", e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black" />
              <input type="text" placeholder="Pincode" value={orderData.address.pincode} onChange={(e) => updateAddressField("pincode", e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button onClick={() => setStep(1)} className="order-2 sm:order-1 flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50">Back</button>
              <button onClick={() => { if (validateAddress()) setStep(3); }} className="order-1 sm:order-2 flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800">Next → Delivery</button>
            </div>
          </SectionCard>
        )}

        {/* STEP 3 — Delivery Option */}
        {step === 3 && (
          <SectionCard title="Choose Delivery Method">
            <div className="space-y-3">
              <button onClick={() => setOrderData((prev) => ({ ...prev, deliveryType: "delivery" }))} className={`w-full p-4 border-2 rounded-lg text-left transition ${orderData.deliveryType === "delivery" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div><p className="font-semibold">Home Delivery 🚚</p><p className="text-sm text-gray-500">Delivered to your doorstep</p></div>
                  <p className="font-semibold">₹60</p>
                </div>
              </button>
              <button onClick={() => setOrderData((prev) => ({ ...prev, deliveryType: "pickup" }))} className={`w-full p-4 border-2 rounded-lg text-left transition ${orderData.deliveryType === "pickup" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div><p className="font-semibold">Store Pickup 🏬</p><p className="text-sm text-gray-500">Free pickup from our store</p></div>
                  <p className="font-semibold text-green-600">Free</p>
                </div>
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button onClick={() => setStep(2)} className="order-2 sm:order-1 flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50">Back</button>
              <button onClick={() => { if (!orderData.deliveryType) { showPopup("Please select a delivery method", "error"); return; } setStep(4); }} className="order-1 sm:order-2 flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800">Next → Upload</button>
            </div>
          </SectionCard>
        )}

        {/* STEP 4 — Upload Files with Progress Animation */}
        {step === 4 && (
          <SectionCard title="Additional Information">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">  अपनी T-shirt पर जो Design Print करना है, उसकी Image यहाँ Upload करें।(Max 5, PDF/Images)</label>
                <input type="file" multiple accept="image/*,application/pdf" onChange={handleFileUpload} disabled={uploading} className="w-full p-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 disabled:opacity-50" />
                {uploading && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-black h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
                  </div>
                )}
                {orderData.uploadedFiles.length > 0 && !uploading && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Uploaded files ({orderData.uploadedFiles.length}) :</p>
                    <div className="flex flex-wrap gap-2">
                      {orderData.uploadedFiles.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs bg-white border rounded px-2 py-1 hover:bg-gray-100">File {i+1}</a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">कौनसी Print कहाँ चाहिए, उसकी जानकारी यहाँ लिखें... (Optional)</label>
                <textarea placeholder="Any special instructions..." value={orderData.note} onChange={(e) => setOrderData((prev) => ({ ...prev, note: e.target.value }))} rows="3" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button onClick={() => setStep(3)} className="order-2 sm:order-1 flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50">Back</button>
              <button onClick={() => { calculateCharges(); setStep(5); }} className="order-1 sm:order-2 flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800">Next → Review</button>
            </div>
          </SectionCard>
        )}

        {/* STEP 5 — Order Review */}
        {step === 5 && (
          <SectionCard title="Order Summary">
            <div className="space-y-4">
              {orderData.items.map((item) => (
                <div key={item.variantId} className="flex flex-col sm:flex-row gap-4 pb-4 border-b">
                  <img src={item.image} alt={item.name} className="h-20 w-20 object-cover rounded mx-auto sm:mx-0" />
                  <div className="flex-1 text-center sm:text-left">
                    <p className="font-semibold">{item.name}</p>
                    {item.size && <p className="text-gray-600 text-sm">Size: {item.size}</p>}
                    {item.color && <p className="text-gray-600">Color: {item.color}</p>}
                    <p className="text-gray-600">Qty: {item.quantity}</p>
                    <p className="font-semibold">₹{item.price}</p>
                    {item.designImage?.length > 0 && (
                      <div className="mt-2 flex justify-center sm:justify-start gap-2">
                        {item.designImage.map((img, i) => <img key={i} src={img} className="w-12 h-12 border rounded object-cover" alt="design" />)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="space-y-2 text-sm">
                <div className="flex flex-col sm:flex-row justify-between gap-2"><span className="text-gray-600">Delivery Address:</span><span className="text-right sm:text-left">{orderData.address.name}, {orderData.address.addressLine}, {orderData.address.city}, {orderData.address.state} - {orderData.address.pincode}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Delivery Method:</span><span className="capitalize">{orderData.deliveryType === "delivery" ? "Home Delivery" : "Store Pickup"}</span></div>
                {orderData.uploadedFiles.length > 0 && <div className="flex justify-between"><span className="text-gray-600">Documents:</span><span>{orderData.uploadedFiles.length} file(s)</span></div>}
                {orderData.note && <div className="flex justify-between"><span className="text-gray-600">Note:</span><span className="italic">{orderData.note}</span></div>}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between"><span>Product Total</span><span>₹{orderData.charges.productTotal}</span></div>
                <div className="flex justify-between"><span>Delivery Charges</span><span>₹{orderData.charges.deliveryCharge}</span></div>
                <div className="flex justify-between"><span>GST (2%)</span><span>₹{orderData.charges.gst}</span></div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total Amount</span><span>₹{orderData.charges.finalAmount}</span></div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button onClick={() => setStep(4)} className="order-2 sm:order-1 flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50">Back</button>
              <button onClick={() => setStep(6)} className="order-1 sm:order-2 flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800">Proceed to Payment</button>
            </div>
          </SectionCard>
        )}

        {/* STEP 6 — Payment */}
        {step === 6 && (
          <SectionCard title="Payment">
            <div className="text-center space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg"><p className="text-gray-600 mb-2">Total Amount to Pay</p><p className="text-3xl sm:text-4xl font-bold">₹{orderData.charges.finalAmount}</p></div>
              {isProcessing ? <Loader /> : <button onClick={handlePayment} className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition">Pay ₹{orderData.charges.finalAmount}</button>}
              <button onClick={() => setStep(5)} className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50">Back</button>
            </div>
          </SectionCard>
        )}

        {/* STEP 7 — Success */}
        {step === 7 && (
          <SectionCard>
            <div className="text-center py-8">
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold mb-2">Order Confirmed! 🎉</h2>
              <p className="text-gray-600 mb-6">Thank you for your purchase. You will receive an email confirmation shortly.</p>
              <button onClick={() => navigate("/")} className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition">Continue Shopping</button>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

export default Checkout;