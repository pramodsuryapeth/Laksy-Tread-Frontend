// src/pages/admin/discount/AddDiscount.jsx

import { useEffect, useState } from "react";
import {
  createDiscount,
  getSingleDiscount,
  updateDiscount,
} from "../../services/discountService";
import { useNavigate, useParams } from "react-router-dom";
import Popup from "../../components/common/Popup";

const AddDiscount = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: "",
    percentage: "",
  });

  const [popup, setPopup] = useState({
    show: false,
    type: "",
    message: "",
  });

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ================= FETCH SINGLE DISCOUNT =================
  const fetchSingleDiscount = async () => {
    try {
      const res = await getSingleDiscount(id);
      setFormData({
        name: res.discount.name,
        percentage: res.discount.percentage,
      });
    } catch (error) {
      console.log(error);
      setPopup({
        show: true,
        type: "error",
        message: "Failed To Fetch Discount",
      });
    }
  };

  useEffect(() => {
    const loadDiscount = async () => {
      if (isEdit) {
        await fetchSingleDiscount();
      }
    };
    loadDiscount();
  }, [id]);

  // ================= HANDLE SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateDiscount(id, formData);
        setPopup({
          show: true,
          type: "success",
          message: "Discount Updated Successfully",
        });
      } else {
        await createDiscount(formData);
        setPopup({
          show: true,
          type: "success",
          message: "Discount Added Successfully",
        });
      }

      setFormData({
        name: "",
        percentage: "",
      });

      setTimeout(() => {
        navigate("/admin/discount-list");
      }, 1500);
    } catch (error) {
      console.log(error);
      setPopup({
        show: true,
        type: "error",
        message: "Something Went Wrong",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Card container with max-width scalability for 4K screens */}
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl bg-white border border-gray-200 shadow-2xl rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12">
        {/* Header */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-black mb-2">
          {isEdit ? "Edit Discount" : "Add Discount"}
        </h2>
        <p className="text-gray-500 text-sm sm:text-base mb-8">
          {isEdit
            ? "Update the discount details below."
            : "Create a new discount for your products."}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="discount-name"
              className="text-sm sm:text-base font-medium text-gray-700"
            >
              Discount Name
            </label>
            <input
              id="discount-name"
              type="text"
              name="name"
              placeholder="e.g., Summer Sale"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 text-sm sm:text-base text-black placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
            />
          </div>

          {/* Percentage Field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="discount-percentage"
              className="text-sm sm:text-base font-medium text-gray-700"
            >
              Discount Percentage
            </label>
            <div className="relative">
              <input
                id="discount-percentage"
                type="number"
                name="percentage"
                placeholder="0"
                value={formData.percentage}
                onChange={handleChange}
                className="w-full px-4 py-3 pr-12 text-sm sm:text-base text-black placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base pointer-events-none">
                %
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 mt-2 text-sm sm:text-base font-semibold text-white bg-black hover:bg-gray-800 active:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
          >
            {isEdit ? "Update Discount" : "Add Discount"}
          </button>
        </form>
      </div>

      {/* Popup Notification (unchanged) */}
      <Popup
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={() =>
          setPopup({
            show: false,
            type: "",
            message: "",
          })
        }
      />
    </div>
  );
};

export default AddDiscount;