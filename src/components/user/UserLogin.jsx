import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { sendOTP, verifyOTP } from "../../services/otpService";

// ─── Icons ─────────────────────────────────────────────
const MailIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ArrowRightIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const XIcon = ({ className, onClick }) => (
  <svg onClick={onClick} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ShieldIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const LoaderIcon = ({ className }) => (
  <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// ─── Main Component ───────────────────────────────────
function UserLogin({ onSuccess, onClose }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [shake, setShake] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const { login } = useAuth();

  // Mount animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const showMessage = useCallback((msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
    if (type === "error") {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  }, [onClose]);

 const handleSendOtp = async (e) => {
  e.preventDefault();

  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    showMessage("Please enter a valid email", "error");
    return;
  }

  setStep(2);
  setLoading(true);
  showMessage("Sending code...", "info");

  try {
    const res = await sendOTP(email.trim().toLowerCase());
    showMessage(res.data.message || "Code sent!", "success");

    setCountdown(30); // 🔥 better UX (5 sec too small)
  } catch (err) {
    console.error(err);
    showMessage("Failed to send. Try again.", "error");
    setStep(1);
  } finally {
    setLoading(false);
  }
};

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!otp.trim() || otp.replace(/\s/g, "").length < 4) {
      showMessage("Enter a valid code", "error");
      return;
    }

    setLoading(true);
    showMessage("Verifying...", "info");

    try {
      const res = await verifyOTP(
        email.trim().toLowerCase(),
        otp.replace(/\s/g, "")
      );

      login({
        token: res.data.token,
        role: "user",
        email: res.data.user.email,
      });

      showMessage("Success! Welcome back", "success");

      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onSuccess?.(), 300);
      }, 800);

    } catch (err) {
      showMessage(err.response?.data?.message || "Invalid code", "error");
    } finally {
      setLoading(false);
    }
  };

  // const handleResend = (e) => {
  //   e.preventDefault();
  //   if (countdown > 0) return;
  //   handleSendOtp(e);
  // };

  const goBack = () => {
    setStep(1);
    setOtp("");
    setMessage("");
    setCountdown(0);
  };

  const messageConfig = {
    info: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: LoaderIcon },
    success: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckIcon },
    error: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: null }
  };

  const MsgIcon = messageConfig[messageType].icon;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={!loading ? handleClose : undefined}
      />

      {/* Modal Card */}
      <div className={`relative w-full max-w-sm bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden transition-all duration-300 transform ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'} ${shake ? 'animate-shake' : ''}`}>
        
        {/* Top gradient line */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-30 z-10"
        >
          <XIcon className="w-5 h-5" />
        </button>

        <div className="p-6 pt-5">
          {/* Icon + Title */}
          <div className="text-center mb-5">
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 transition-all duration-500 ${step === 1 ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200' : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200'}`}>
              {step === 1 ? (
                <MailIcon className="w-7 h-7 text-white" />
              ) : (
                <ShieldIcon className="w-7 h-7 text-white" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {step === 1 ? "Welcome Back" : "Verify Email"}
            </h2>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              {step === 1 
                ? "Enter your email to continue" 
                : <>We sent a code to <span className="font-semibold text-gray-700">{email}</span></>}
            </p>
          </div>

          {/* Alert Message */}
          {message && (
            <div className={`mb-4 px-3.5 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2.5 transition-all duration-300 ${messageConfig[messageType].bg} ${messageConfig[messageType].text} ${messageConfig[messageType].border}`}>
              {MsgIcon && <MsgIcon className="w-4 h-4 shrink-0" />}
              {messageType === "error" && (
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="leading-snug">{message}</span>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 text-[15px]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="group w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoaderIcon className="w-5 h-5" />
                    Sending...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 ml-1">
                  Verification Code
                </label>
                <div className="relative group">
                  <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={8}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-200 text-center tracking-[0.2em] font-mono text-lg font-semibold"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.replace(/\s/g, "").length < 4}
                className="group w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoaderIcon className="w-5 h-5" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Login
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={loading}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-40 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Change email
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={countdown > 0 || loading}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure OTP encryption</span>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.45s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default UserLogin;