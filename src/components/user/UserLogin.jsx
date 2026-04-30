import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { sendOTP, verifyOTP } from "../../services/otpService";

function UserLogin({ onSuccess }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { login } = useAuth(); // ✅ use this

  // 📩 Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await sendOTP(email.trim().toLowerCase());
      setMessage(res.data.message || "OTP sent 📩");
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send OTP ❌");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await verifyOTP(
        email.trim().toLowerCase(),
        otp.replace(/\s/g, "")
      );

      // 🔐 CALL AUTH LOGIN (IMPORTANT)
      login({
        token: res.data.token,
        role: "user",
        email: res.data.user.email,
      });

      setMessage("Login successful 🔥");

      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-center mb-4">
        LakshyTrade Login
      </h1>

      {message && (
        <p className="text-center text-sm mb-3 text-gray-600">
          {message}
        </p>
      )}

      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <input
            type="email"
            placeholder="Enter email"
            className="w-full px-4 py-3 border rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button className="w-full bg-black text-white py-3 rounded-lg">
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <input
            type="text"
            placeholder="Enter OTP"
            className="w-full px-4 py-3 border rounded-lg text-center"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\s/g, ""))
            }
            required
          />

          <button className="w-full bg-black text-white py-3 rounded-lg">
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <p className="text-center text-sm">
            Didn’t receive OTP?{" "}
            <button type="button" onClick={handleSendOtp}>
              Resend
            </button>
          </p>
        </form>
      )}
    </div>
  );
}

export default UserLogin;