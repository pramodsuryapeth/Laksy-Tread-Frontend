import { useState, useEffect } from "react";

function ImageSlider({ images = [] }) {
  const [active, setActive] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);

  // 🔥 auto slide only on hover
  useEffect(() => {
    if (!hovered || images.length < 2) return;

    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, 800);

    return () => clearInterval(interval);
  }, [hovered, images.length]);

  if (!images.length) {
    return (
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg">
        No images
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setActive(0); // ✅ FIX: reset here instead of useEffect
      }}
    >
      {/* MAIN IMAGE */}
      <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Image not available
          </div>
        ) : (
          <img
            src={images[active]}
            className="w-full h-full object-cover transition duration-300"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* THUMBNAILS */}
      <div className="flex gap-2 mt-2 overflow-x-auto">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            onMouseEnter={() => setActive(i)}
            className={`w-10 h-10 border rounded ${
              active === i ? "border-black" : "border-gray-300"
            }`}
          >
            <img
              src={img}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default ImageSlider;