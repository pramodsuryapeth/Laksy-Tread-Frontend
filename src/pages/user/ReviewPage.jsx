import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState,} from "react";
import { addReview } from "../../services/reviewService";

function ReviewPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const productId = params.get("productId");

  const [rating, setRating] = useState(0);        // start at 0 so user has to pick
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState([]);          // File objects
  const [previews, setPreviews] = useState([]);    // object URLs
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);    // { type: 'success' | 'error', text: '' }

  // ── star handlers ────────────────────────────────────────────────
  const handleStarClick = (value) => setRating(value);
  const handleStarEnter = (value) => setHoveredStar(value);
  const handleStarLeave = () => setHoveredStar(0);

  // ── file upload with preview ────────────────────────────────────
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length === 0) return;

    // Revoke old previews to avoid memory leaks
    previews.forEach((url) => URL.revokeObjectURL(url));

    const newPreviews = selected.map((file) => URL.createObjectURL(file));
    setFiles(selected);
    setPreviews(newPreviews);
  };

  const removeImage = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    // Revoke the removed preview URL
    URL.revokeObjectURL(previews[index]);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  // ── submit review ──────────────────────────────────────────────
  const handleSubmit = async () => {
    // Validation
    if (!rating) {
      setMessage({ type: "error", text: "Please select a star rating." });
      return;
    }
    if (!comment.trim()) {
      setMessage({ type: "error", text: "Please write your review." });
      return;
    }
    if (!productId) {
      setMessage({ type: "error", text: "Product not found. Cannot submit review." });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("productId", productId);
      formData.append("rating", rating);
      formData.append("comment", comment.trim());

      files.forEach((file) => {
        formData.append("images", file);
      });

      await addReview(formData);

      setMessage({ type: "success", text: "Review submitted successfully! 🎉" });

      // Navigate after a short delay so user sees the success message
      setTimeout(() => navigate("/profile"), 1500);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to submit review. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // ── rating labels ───────────────────────────────────────────────
  const ratingLabels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4 sm:px-6">
      <div className="max-w-lg mx-auto">
        
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
          
          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Write a Review
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            Share your experience with this product.
          </p>

          {/* Feedback message */}
          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              <span className="text-lg">{message.type === "success" ? "✅" : "❌"}</span>
              {message.text}
            </div>
          )}

          {/* ⭐ Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarEnter(star)}
                  onMouseLeave={handleStarLeave}
                  className={`text-3xl sm:text-4xl transition-transform duration-150 ${
                    (hoveredStar || rating) >= star
                      ? "text-yellow-400 scale-110"
                      : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="ml-3 text-sm font-medium text-gray-600">
                {rating ? ratingLabels[rating - 1] : "Select a rating"}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Review
            </label>
            <textarea
              placeholder="Tell us what you liked (or didn't)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none text-sm"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">
                {comment.length}/500
              </span>
              {comment.length > 0 && (
                <span className="text-xs text-gray-400">
                  {500 - comment.length} remaining
                </span>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Photos (optional)
            </label>
            <label
              className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                files.length >= 5
                  ? "border-gray-200 bg-gray-100 cursor-not-allowed"
                  : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
              }`}
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-600">
                {files.length > 0 ? `${files.length} photo(s) selected` : "Tap to upload"}
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={files.length >= 5}
              />
            </label>
            <p className="text-xs text-gray-400 mt-1">Up to 5 images (jpg, png)</p>

            {/* Image Previews with remove button */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={src}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800 active:scale-[0.98] shadow-md"
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewPage;