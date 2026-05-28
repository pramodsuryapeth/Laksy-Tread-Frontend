// src/pages/admin/discount/DiscountList.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDiscounts } from "../../hooks/useDiscounts";
import Popup from "../../components/common/Popup";

// ---------------- Sub-components ----------------

const DiscountHeader = ({ discountCount, onAdd, children }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
    <div>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-black">
        Discount List
      </h2>
      {discountCount !== null && (
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          {discountCount} discount{discountCount !== 1 ? "s" : ""} found
        </p>
      )}
    </div>
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
      {children}
      <button
        onClick={onAdd}
        className="bg-black hover:bg-gray-800 active:bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-lg shadow transition-colors duration-200 whitespace-nowrap"
      >
        Add Discount
      </button>
    </div>
  </div>
);

const SearchBar = ({ value, onChange }) => (
  <input
    type="text"
    placeholder="Search by name..."
    value={value}
    onChange={onChange}
    className="w-full sm:w-64 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white placeholder-gray-400 text-black"
  />
);

const SkeletonCard = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
    <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
    <div className="flex justify-between gap-2">
      <div className="h-9 bg-gray-200 rounded w-1/2"></div>
      <div className="h-9 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

const DiscountCard = ({ discount, onEdit, onDelete }) => (
  <div className="bg-white border border-gray-200 hover:border-black rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
    <div>
      <h3 className="font-bold text-lg text-black truncate mb-1">{discount.name}</h3>
      <p className="text-3xl sm:text-4xl font-extrabold text-black leading-none mb-1">
        {discount.percentage}%
      </p>
      <p className="text-sm text-gray-500">OFF</p>
    </div>
    <div className="flex gap-2 mt-4">
      <button
        onClick={() => onEdit(discount._id)}
        className="flex-1 px-4 py-2 text-sm font-medium bg-white text-black border border-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
      >
        Edit
      </button>
      <button
        onClick={() => onDelete(discount._id)}
        className="flex-1 px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        Delete
      </button>
    </div>
  </div>
);

const EmptyState = ({ isSearchActive, onAdd }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
    <div className="text-5xl mb-4 text-gray-300">🏷️</div>
    <h3 className="text-xl font-bold text-black mb-2">
      {isSearchActive ? "No discounts match your search" : "No discounts yet"}
    </h3>
    <p className="text-gray-500 mb-6">
      {isSearchActive
        ? "Try a different keyword or clear the search."
        : "Create your first discount to start offering promotions."}
    </p>
    {!isSearchActive && (
      <button
        onClick={onAdd}
        className="bg-black hover:bg-gray-800 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
      >
        Add your first discount
      </button>
    )}
  </div>
);

// ---------------- Main Component ----------------

const DiscountList = () => {
  const navigate = useNavigate();
  const { discounts, loading, popup, setPopup, handleDelete } = useDiscounts();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDiscounts = discounts.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (id) => navigate(`/admin/edit-discount/${id}`);
  const handleAddDiscount = () => navigate("/admin/add-discount");

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with search bar */}
        <DiscountHeader
          discountCount={loading ? null : filteredDiscounts.length}
          onAdd={handleAddDiscount}
        >
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </DiscountHeader>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredDiscounts.length === 0 && (
          <EmptyState isSearchActive={searchTerm.length > 0} onAdd={handleAddDiscount} />
        )}

        {/* Discount Cards Grid */}
        {!loading && filteredDiscounts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredDiscounts.map((item) => (
              <DiscountCard
                key={item._id}
                discount={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Popup Notification */}
      <Popup
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={() => setPopup({ show: false, type: "", message: "" })}
      />
    </div>
  );
};

export default DiscountList;