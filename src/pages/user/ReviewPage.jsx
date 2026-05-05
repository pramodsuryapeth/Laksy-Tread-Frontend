import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { addReview } from "../../services/reviewService";

function ReviewPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const productId = params.get("productId"); // ✅ IMPORTANT

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // ⭐ Star click
  const handleStarClick = (value) => {
    setRating(value);
  };

  // 📸 file upload
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
  };

  // 🚀 Submit
  const handleSubmit = async () => {
    try {
      if (!productId) {
        alert("Product not found ❌");
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("productId", productId); // ✅ MUST
      formData.append("rating", rating);
      formData.append("comment", comment);

      // 🔥 FIX: images (not files)
      files.forEach((file) => {
        formData.append("images", file);
      });

      await addReview(formData);

      alert("Review submitted ✅");
      navigate("/profile");

    } catch (err) {
      console.error(err);
      alert("Failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow">

        <h2 className="text-xl font-bold mb-4">⭐ Write Review</h2>

        {/* ⭐ STAR RATING */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => handleStarClick(star)}
              className={`cursor-pointer text-2xl ${
                rating >= star ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </span>
          ))}
        </div>

        {/* 📝 COMMENT */}
        <textarea
          placeholder="Write your review..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border rounded-lg p-3 mb-4"
          rows={4}
        />

        {/* 📸 IMAGE UPLOAD */}
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="mb-4"
        />

        {/* 📷 PREVIEW */}
        {files.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {files.map((file, i) => (
              <img
                key={i}
                src={URL.createObjectURL(file)}
                className="w-16 h-16 object-cover rounded border"
              />
            ))}
          </div>
        )}

        {/* 🚀 SUBMIT */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded-lg"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </div>
  );
}

export default ReviewPage;