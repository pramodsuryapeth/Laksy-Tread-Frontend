import API from "./api";

export const sendOTP = (email) => {
  return API.post("/otp/send-otp", { email }); // ✅ correct
};

export const verifyOTP = (email, otp) => {
  return API.post("/otp/verify-otp", { email, otp }); // ✅ correct
};