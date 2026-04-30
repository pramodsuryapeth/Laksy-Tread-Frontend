// utils/getErrorMessage.js

export const getErrorMessage = (err) => {
  // backend error message
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }

  // network error (no response)
  if (err?.message) {
    return err.message;
  }

  // fallback
  return "Something went wrong";
};