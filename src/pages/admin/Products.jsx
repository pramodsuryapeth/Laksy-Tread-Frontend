import { useEffect, useState } from "react";
import PageWrapper from "../../components/admin/PageWrapper";
import Loader from "../../components/common/Loader";
import Popup from "../../components/common/Popup";
import {
  getAllDiscounts,
} from "../../services/discountService";
import {
  getProducts,
  addVariant,
  deleteProduct,
  updateProduct,
  getVariants,
  updateVariant,
  deleteVariant,
  applyDiscountToProduct,
  removeDiscountFromProduct, // ← ADD THIS to your productService.js
} from "../../services/productService";
import { getErrorMessage } from "../../utils/getErrorMessage";

const BASE_URL = "http://localhost:5000";

const getImageArray = (item) => {
  if (!item) return [];
  let arr = [];
  if (Array.isArray(item.images) && item.images.length) arr = item.images;
  else if (Array.isArray(item.imageUrls) && item.imageUrls.length) arr = item.imageUrls;
  else if (Array.isArray(item.pictures) && item.pictures.length) arr = item.pictures;
  else if (Array.isArray(item.variantImages) && item.variantImages.length) arr = item.variantImages;
  else if (item.image) arr = [item.image];
  return arr.map((img) => (img.startsWith("http") ? img : `${BASE_URL}${img}`));
};

const ImageCarousel = ({ images, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white text-2xl hover:text-gray-300"
        >
          ✕
        </button>
        <div
          className="relative bg-black rounded-2xl overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={images[currentIndex]}
            alt="carousel"
            className="w-full h-[60vh] object-contain"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75"
              >
                ‹
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75"
              >
                ›
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex ? "bg-white w-4" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState({ show: false, message: "", type: "success" });
  const [confirmPopup, setConfirmPopup] = useState({ show: false, message: "", onConfirm: null });

  const [discounts, setDiscounts] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState("");
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isRemovingDiscount, setIsRemovingDiscount] = useState(false); // ← NEW

  const [isAddVariantModalOpen, setIsAddVariantModalOpen] = useState(false);
  const [isViewVariantsModalOpen, setIsViewVariantsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProductCarouselOpen, setIsProductCarouselOpen] = useState(false);
  const [isVariantCarouselOpen, setIsVariantCarouselOpen] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedCarouselImages, setSelectedCarouselImages] = useState([]);

  // Add variant form
  const [variantForm, setVariantForm] = useState({
    sizes: [],
    sizeInput: "",
    colors: [],
    colorInput: "",
    price: "",
    stock: "",
  });

  // Edit variant form
  const [editingVariant, setEditingVariant] = useState(null);
  const [editingVariantSizes, setEditingVariantSizes] = useState([]);
  const [editingVariantColors, setEditingVariantColors] = useState([]);
  const [editSizeInput, setEditSizeInput] = useState("");
  const [editColorInput, setEditColorInput] = useState("");

  // Edit product form
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  // Image states
  const [productUpdateImages, setProductUpdateImages] = useState([]);
  const [productUpdatePreviews, setProductUpdatePreviews] = useState([]);
  const [variantImages, setVariantImages] = useState([]);
  const [variantImagePreviews, setVariantImagePreviews] = useState([]);
  const [editVariantImages, setEditVariantImages] = useState([]);
  const [editVariantPreviews, setEditVariantPreviews] = useState([]);

  // Loading states
  const [isVariantSubmitting, setIsVariantSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVariantActionLoading, setIsVariantActionLoading] = useState(false);

  // ── helpers ──────────────────────────────────────────────────────────────
  const showPopup = (message, type = "success") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup((prev) => ({ ...prev, show: false })), 3000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmPopup({ show: true, message, onConfirm });
  };

  const closeDiscountModal = () => {
    setIsDiscountModalOpen(false);
    setSelectedDiscount("");
  };

  // ── fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [productsRes, discountsRes] = await Promise.all([
          getProducts(),
          getAllDiscounts(),
        ]);
        setProducts(productsRes.data);
        setDiscounts(discountsRes.discounts);
      } catch (err) {
        showPopup(getErrorMessage(err), "error");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const refreshProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch (err) {
      showPopup(getErrorMessage(err), "error");
    }
  };

  const fetchVariants = async (productId) => {
    try {
      const res = await getVariants(productId);
      setVariants(res.data);
    } catch (err) {
      showPopup(getErrorMessage(err), "error");
      setVariants([]);
    }
  };

  // ── discount ──────────────────────────────────────────────────────────────
  const handleAddDiscount = (product) => {
    setSelectedProduct(product);
    setSelectedDiscount("");
    setIsDiscountModalOpen(true);
  };

  const handleApplyDiscount = async () => {
    if (!selectedDiscount) {
      showPopup("Please select a discount first", "error");
      return;
    }
    setIsApplyingDiscount(true);
    try {
      await applyDiscountToProduct({
        productId: selectedProduct._id,
        discountId: selectedDiscount,
      });
      showPopup("Discount applied successfully!", "success");
      closeDiscountModal();
      refreshProducts();
    } catch (error) {
      showPopup(getErrorMessage(error), "error");
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  // ── NEW: Remove discount handler ──────────────────────────────────────────
  const handleRemoveDiscount = async () => {
    setIsRemovingDiscount(true);
    try {
      await removeDiscountFromProduct({ productId: selectedProduct._id });
      showPopup("Discount removed successfully!", "success");
      closeDiscountModal();
      refreshProducts();
    } catch (error) {
      showPopup(getErrorMessage(error), "error");
    } finally {
      setIsRemovingDiscount(false);
    }
  };

  // ── Helper: get active discount object for selected product ───────────────
  // Works whether selectedProduct.discount is a populated object or just an ID string
  const getActiveDiscount = () => {
    if (!selectedProduct?.discount) return null;
    // If populated as an object
    if (typeof selectedProduct.discount === "object" && selectedProduct.discount._id) {
      return selectedProduct.discount;
    }
    // If stored as an ID string, look it up from discounts list
    if (typeof selectedProduct.discount === "string") {
      return discounts.find((d) => d._id === selectedProduct.discount) || null;
    }
    return null;
  };

  // ── product actions ───────────────────────────────────────────────────────
  const handleViewVariants = async (product) => {
    setSelectedProduct(product);
    setSelectedProductId(product._id);
    await fetchVariants(product._id);
    setIsViewVariantsModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProductId(product._id);
    setEditForm({ name: product.name, description: product.description });
    setProductUpdateImages([]);
    setProductUpdatePreviews([]);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    showConfirm("Delete this product?", async () => {
      setIsDeleting(true);
      try {
        await deleteProduct(id);
        await refreshProducts();
        showPopup("Product deleted successfully", "success");
      } catch (err) {
        showPopup(getErrorMessage(err), "error");
      } finally {
        setIsDeleting(false);
        setConfirmPopup({ show: false, message: "", onConfirm: null });
      }
    });
  };

  const openProductCarousel = (product) => {
    const images = getImageArray(product);
    if (images.length) {
      setSelectedCarouselImages(images);
      setIsProductCarouselOpen(true);
    }
  };

  // ── product image handlers ────────────────────────────────────────────────
  const handleProductUpdateImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (productUpdateImages.length + files.length > 5) {
      showPopup("Maximum 5 images per product", "error");
      return;
    }
    setProductUpdateImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setProductUpdatePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeProductUpdateImage = (index) => {
    setProductUpdateImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(productUpdatePreviews[index]);
    setProductUpdatePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── add variant: sizes & colors ───────────────────────────────────────────
  const addSize = () => {
    const trimmed = variantForm.sizeInput.trim();
    if (!trimmed) return;
    if (variantForm.sizes.includes(trimmed)) {
      showPopup("Size already added", "error");
      return;
    }
    setVariantForm({ ...variantForm, sizes: [...variantForm.sizes, trimmed], sizeInput: "" });
  };

  const removeSize = (index) => {
    setVariantForm({ ...variantForm, sizes: variantForm.sizes.filter((_, i) => i !== index) });
  };

  const addColor = () => {
    const trimmed = variantForm.colorInput.trim();
    if (!trimmed) return;
    if (variantForm.colors.includes(trimmed)) {
      showPopup("Color already added", "error");
      return;
    }
    setVariantForm({ ...variantForm, colors: [...variantForm.colors, trimmed], colorInput: "" });
  };

  const removeColor = (index) => {
    setVariantForm({ ...variantForm, colors: variantForm.colors.filter((_, i) => i !== index) });
  };

  const handleAddVariant = (id) => {
    setSelectedProductId(id);
    setVariantForm({ sizes: [], sizeInput: "", colors: [], colorInput: "", price: "", stock: "" });
    setVariantImages([]);
    setVariantImagePreviews([]);
    setIsAddVariantModalOpen(true);
  };

  // ── edit variant: sizes & colors ──────────────────────────────────────────
  const addEditSize = () => {
    const trimmed = editSizeInput.trim();
    if (!trimmed) return;
    if (editingVariantSizes.includes(trimmed)) {
      showPopup("Size already added", "error");
      return;
    }
    setEditingVariantSizes([...editingVariantSizes, trimmed]);
    setEditSizeInput("");
  };

  const removeEditSize = (index) => {
    setEditingVariantSizes(editingVariantSizes.filter((_, i) => i !== index));
  };

  const addEditColor = () => {
    const trimmed = editColorInput.trim();
    if (!trimmed) return;
    if (editingVariantColors.includes(trimmed)) {
      showPopup("Color already added", "error");
      return;
    }
    setEditingVariantColors([...editingVariantColors, trimmed]);
    setEditColorInput("");
  };

  const removeEditColor = (index) => {
    setEditingVariantColors(editingVariantColors.filter((_, i) => i !== index));
  };

  const handleEditVariant = (variant) => {
    let sizesArray = [];
    if (Array.isArray(variant.sizes)) sizesArray = [...variant.sizes];
    else if (typeof variant.sizes === "string" && variant.sizes)
      sizesArray = variant.sizes.split(",").map((s) => s.trim());

    let colorsArray = [];
    if (Array.isArray(variant.colors)) colorsArray = [...variant.colors];
    else if (typeof variant.colors === "string" && variant.colors)
      colorsArray = variant.colors.split(",").map((c) => c.trim());

    setEditingVariant({ ...variant });
    setEditingVariantSizes(sizesArray);
    setEditingVariantColors(colorsArray);
    setEditSizeInput("");
    setEditColorInput("");
    setEditVariantImages([]);
    setEditVariantPreviews([]);
  };

  const handleEditVariantImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (editVariantImages.length + files.length > 5) {
      showPopup("Maximum 5 images per variant", "error");
      return;
    }
    setEditVariantImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setEditVariantPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeEditVariantImage = (index) => {
    setEditVariantImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(editVariantPreviews[index]);
    setEditVariantPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = async () => {
    if (!editingVariant) return;
    setIsVariantActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("productId", selectedProductId);
      formData.append("variantId", editingVariant._id);
      formData.append("sizes", JSON.stringify(editingVariantSizes));
      formData.append("colors", JSON.stringify(editingVariantColors));
      formData.append("price", editingVariant.price);
      formData.append("stock", editingVariant.stock);
      editVariantImages.forEach((img) => formData.append("images", img));
      await updateVariant(formData);
      await fetchVariants(selectedProductId);
      setEditingVariant(null);
      showPopup("Variant updated successfully", "success");
    } catch (err) {
      showPopup(getErrorMessage(err), "error");
    } finally {
      setIsVariantActionLoading(false);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    showConfirm("Delete this variant?", async () => {
      setIsVariantActionLoading(true);
      try {
        await deleteVariant(variantId);
        await fetchVariants(selectedProductId);
        showPopup("Variant deleted successfully", "success");
      } catch (err) {
        showPopup(getErrorMessage(err), "error");
      } finally {
        setIsVariantActionLoading(false);
        setConfirmPopup({ show: false, message: "", onConfirm: null });
      }
    });
  };

  const openVariantCarousel = (variant) => {
    const images = getImageArray(variant);
    if (images.length) {
      setSelectedCarouselImages(images);
      setIsVariantCarouselOpen(true);
    }
  };

  // ── new variant image handlers ────────────────────────────────────────────
  const handleVariantImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (variantImages.length + files.length > 5) {
      showPopup("Maximum 5 images per variant", "error");
      return;
    }
    setVariantImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setVariantImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeVariantImage = (index) => {
    setVariantImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(variantImagePreviews[index]);
    setVariantImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── submit handlers ───────────────────────────────────────────────────────
  const handleVariantSubmit = async (e) => {
    e.preventDefault();
    if (variantForm.sizes.length === 0) {
      showPopup("Please add at least one size", "error");
      return;
    }
    if (variantForm.colors.length === 0) {
      showPopup("Please add at least one color", "error");
      return;
    }
    if (!variantForm.price || !variantForm.stock) {
      showPopup("Please fill price and stock", "error");
      return;
    }
    setIsVariantSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("productId", selectedProductId);
      formData.append("sizes", JSON.stringify(variantForm.sizes));
      formData.append("colors", JSON.stringify(variantForm.colors));
      formData.append("price", variantForm.price);
      formData.append("stock", variantForm.stock);
      variantImages.forEach((img) => formData.append("images", img));
      await addVariant(formData);
      await refreshProducts();
      setIsAddVariantModalOpen(false);
      showPopup(
        `Variant added — sizes: ${variantForm.sizes.join(", ")} | colors: ${variantForm.colors.join(", ")}`,
        "success"
      );
    } catch (err) {
      showPopup(getErrorMessage(err), "error");
    } finally {
      setIsVariantSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name) {
      showPopup("Product name is required", "error");
      return;
    }
    setIsEditSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("productId", selectedProductId);
      formData.append("name", editForm.name);
      formData.append("description", editForm.description);
      productUpdateImages.forEach((img) => formData.append("images", img));
      await updateProduct(formData);
      await refreshProducts();
      setIsEditModalOpen(false);
      showPopup("Product updated successfully", "success");
    } catch (err) {
      showPopup(getErrorMessage(err), "error");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <PageWrapper title="Products">
      {/* ── Products table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">All Products</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your product catalog</p>
        </div>

        {/* Mobile card view */}
        <div className="block md:hidden divide-y divide-gray-100">
          {products.map((product) => {
            const productImages = getImageArray(product);
            return (
              <div key={product._id} className="p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="flex gap-1 flex-wrap flex-1">
                    {productImages.slice(0, 3).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={product.name}
                        onClick={() => openProductCarousel(product)}
                        className="w-16 h-16 rounded-lg object-cover border cursor-pointer"
                      />
                    ))}
                    {productImages.length > 3 && (
                      <div
                        onClick={() => openProductCarousel(product)}
                        className="w-16 h-16 flex items-center justify-center bg-black text-white rounded-lg cursor-pointer text-sm"
                      >
                        +{productImages.length - 3}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{product.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{product.description || "—"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleAddDiscount(product)}
                    className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100"
                  >
                    Discount
                  </button>
                  <button
                    onClick={() => handleViewVariants(product)}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
                  >
                    View Var.
                  </button>
                  <button
                    onClick={() => handleAddVariant(product._id)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
                  >
                    + Var.
                  </button>
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="px-4 py-2 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                  >
                    Del
                  </button>
                </div>
              </div>
            );
          })}
          {products.length === 0 && (
            <div className="p-8 text-center text-gray-400">No products found</div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left font-medium">Images</th>
                <th className="px-6 py-4 text-left font-medium">Name</th>
                <th className="px-6 py-4 text-left font-medium">Description</th>
                <th className="px-6 py-4 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => {
                const productImages = getImageArray(product);
                return (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {productImages.slice(0, 3).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="product"
                            onClick={() => openProductCarousel(product)}
                            className="w-14 h-14 rounded-lg object-cover border cursor-pointer"
                          />
                        ))}
                        {productImages.length > 3 && (
                          <div
                            onClick={() => openProductCarousel(product)}
                            className="w-14 h-14 flex items-center justify-center bg-black text-white rounded-lg cursor-pointer"
                          >
                            +{productImages.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">{product.name}</td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                      {product.description || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleAddDiscount(product)}
                          className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100"
                        >
                          Discount
                        </button>
                        <button
                          onClick={() => handleViewVariants(product)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100"
                        >
                          View Var.
                        </button>
                        <button
                          onClick={() => handleAddVariant(product._id)}
                          className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800"
                        >
                          + Var.
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-medium hover:bg-amber-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          disabled={isDeleting}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════ MODALS ══════════════ */}

      {/* ── Discount Modal (with Remove Discount support) ── */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Manage Discount</h3>
              <button
                onClick={closeDiscountModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Sub-label */}
            <p className="text-sm text-gray-500 mb-3">
              Product:{" "}
              <span className="font-medium text-gray-700">{selectedProduct?.name}</span>
            </p>

            {/* ── Active discount banner ── */}
            {(() => {
              const activeDiscount = getActiveDiscount();
              if (!activeDiscount) return null;
              return (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 mb-4">
                  <div>
                    <p className="text-xs text-green-600 font-medium mb-0.5">Active discount</p>
                    <p className="text-sm text-green-800 font-semibold">
                      {activeDiscount.name}{" "}
                      <span className="font-normal text-green-700">
                        ({activeDiscount.percentage}% OFF)
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveDiscount}
                    disabled={isRemovingDiscount}
                    className="ml-3 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isRemovingDiscount ? "Removing..." : "Remove"}
                  </button>
                </div>
              );
            })()}

            {/* Divider when discount exists */}
            {getActiveDiscount() && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or replace with</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}

            {/* Select */}
            <select
              value={selectedDiscount}
              onChange={(e) => setSelectedDiscount(e.target.value)}
              className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="">— Select Discount —</option>
              {discounts.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} ({item.percentage}% OFF)
                </option>
              ))}
            </select>

            {discounts.length === 0 && (
              <p className="text-xs text-amber-500 mt-2">
                No discounts available. Create one first.
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={closeDiscountModal}
                className="flex-1 border border-gray-200 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyDiscount}
                disabled={!selectedDiscount || isApplyingDiscount}
                className="flex-1 bg-black text-white py-2 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApplyingDiscount ? "Applying..." : getActiveDiscount() ? "Replace" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Carousel ── */}
      {isProductCarouselOpen && (
        <ImageCarousel
          images={selectedCarouselImages}
          onClose={() => setIsProductCarouselOpen(false)}
        />
      )}

      {/* ── View / Edit / Delete Variants Modal ── */}
      {isViewVariantsModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsViewVariantsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Variants — {selectedProduct.name}
              </h3>
              <button
                onClick={() => setIsViewVariantsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              {variants.length > 0 ? (
                variants.map((variant) => {
                  const variantImagesArr = getImageArray(variant);
                  const isEditing = editingVariant?._id === variant._id;
                  return (
                    <div
                      key={variant._id}
                      className="border border-gray-100 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          {/* Sizes */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Sizes (add one by one)
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="e.g., S, M, L"
                                value={editSizeInput}
                                onChange={(e) => setEditSizeInput(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={addEditSize}
                                className="px-3 bg-black text-white rounded"
                              >
                                Add
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {editingVariantSizes.map((s, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                                >
                                  {s}
                                  <button
                                    type="button"
                                    onClick={() => removeEditSize(idx)}
                                    className="text-red-500"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Colors */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Colors (add one by one)
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="e.g., Red, Blue, Green"
                                value={editColorInput}
                                onChange={(e) => setEditColorInput(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={addEditColor}
                                className="px-3 bg-black text-white rounded"
                              >
                                Add
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {editingVariantColors.map((c, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                                >
                                  {c}
                                  <button
                                    type="button"
                                    onClick={() => removeEditColor(idx)}
                                    className="text-red-500"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <input
                            type="number"
                            value={editingVariant.price}
                            onChange={(e) =>
                              setEditingVariant({ ...editingVariant, price: e.target.value })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="Price"
                          />
                          <input
                            type="number"
                            value={editingVariant.stock}
                            onChange={(e) =>
                              setEditingVariant({ ...editingVariant, stock: e.target.value })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="Stock quantity"
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Variant Images (max 5)
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleEditVariantImagesChange}
                              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-50"
                            />
                            {editVariantPreviews.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {editVariantPreviews.map((preview, idx) => (
                                  <div key={idx} className="relative">
                                    <img
                                      src={preview}
                                      className="w-16 h-16 rounded-lg object-cover border"
                                      alt="preview"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeEditVariantImage(idx)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateVariant}
                              disabled={isVariantActionLoading}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50"
                            >
                              {isVariantActionLoading ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingVariant(null)}
                              className="px-3 py-1 bg-gray-300 rounded-lg text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div>
                              <p className="font-medium text-gray-800">
                                Sizes:{" "}
                                {Array.isArray(variant.sizes)
                                  ? variant.sizes.join(", ")
                                  : variant.sizes}
                              </p>
                              <p className="text-sm text-gray-500">
                                Colors:{" "}
                                {Array.isArray(variant.colors)
                                  ? variant.colors.join(", ")
                                  : Array.isArray(variant.color)
                                  ? variant.color.join(", ")
                                  : variant.color || variant.colors}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                ₹{variant.price} • Stock: {variant.stock}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditVariant(variant)}
                                className="text-amber-600 hover:text-amber-800 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteVariant(variant._id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {variantImagesArr.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 mb-1">Images:</p>
                              <div className="flex flex-wrap gap-2">
                                {variantImagesArr.map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt="variant"
                                    className="w-16 h-16 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-80"
                                    onClick={() => openVariantCarousel(variant)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No variants available for this product.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Variant Carousel ── */}
      {isVariantCarouselOpen && (
        <ImageCarousel
          images={selectedCarouselImages}
          onClose={() => setIsVariantCarouselOpen(false)}
        />
      )}

      {/* ── Add Variant Modal ── */}
      {isAddVariantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-[95%] max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Add New Variant</h3>
              <button
                onClick={() => setIsAddVariantModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleVariantSubmit} className="p-6 space-y-4">
              {/* Sizes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sizes (add one by one)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., S, M, L, XL"
                    value={variantForm.sizeInput}
                    onChange={(e) => setVariantForm({ ...variantForm, sizeInput: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <button type="button" onClick={addSize} className="px-3 bg-black text-white rounded">
                    Add
                  </button>
                </div>
                {variantForm.sizes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {variantForm.sizes.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => removeSize(idx)}
                          className="text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Colors (add one by one)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Red, Blue, Black"
                    value={variantForm.colorInput}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, colorInput: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <button type="button" onClick={addColor} className="px-3 bg-black text-white rounded">
                    Add
                  </button>
                </div>
                {variantForm.colors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {variantForm.colors.map((c, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                      >
                        {c}
                        <button
                          type="button"
                          onClick={() => removeColor(idx)}
                          className="text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  placeholder="e.g., 1999"
                  value={variantForm.price}
                  onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  placeholder="e.g., 50"
                  value={variantForm.stock}
                  onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variant Images (max 5)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleVariantImagesChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-50"
                />
                {variantImagePreviews.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {variantImagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={preview}
                          className="w-16 h-16 rounded-lg object-cover border"
                          alt="preview"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddVariantModalOpen(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVariantSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50"
                >
                  {isVariantSubmitting
                    ? "Adding..."
                    : `Add Variant (${variantForm.sizes.length} size${variantForm.sizes.length !== 1 ? "s" : ""}, ${variantForm.colors.length} color${variantForm.colors.length !== 1 ? "s" : ""})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Product Modal ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-[95%] max-w-md max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Edit Product</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  placeholder="Product name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Product description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Images (max 5)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleProductUpdateImagesChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-50"
                />
                {productUpdatePreviews.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {productUpdatePreviews.map((preview, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={preview}
                          className="w-16 h-16 rounded-lg object-cover border"
                          alt="preview"
                        />
                        <button
                          type="button"
                          onClick={() => removeProductUpdateImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Leave empty to keep existing images. Uploading new images will replace old ones.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 border rounded-lg py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="flex-1 bg-gray-900 text-white rounded-lg py-2 disabled:opacity-50"
                >
                  {isEditSubmitting ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirmation Popup ── */}
      {confirmPopup.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <p className="text-gray-800 mb-6">{confirmPopup.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() =>
                  setConfirmPopup({ show: false, message: "", onConfirm: null })
                }
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmPopup.onConfirm && confirmPopup.onConfirm()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Global Toast Popup ── */}
      <Popup
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={() => setPopup({ ...popup, show: false })}
      />
    </PageWrapper>
  );
}

export default Products;