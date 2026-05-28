// src/hooks/useDiscounts.js
import { useState, useEffect, useCallback } from "react";
import { getAllDiscounts, deleteDiscount } from "../services/discountService";

export const useDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState({ show: false, type: "", message: "" });

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllDiscounts();
      setDiscounts(res.discounts);
    } catch (error) {
      setPopup({ show: true, type: "error", message: "Failed to load discounts", error });
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {

  const loadDiscounts = async () => {

    try {

      await fetchDiscounts();

    } catch (error) {

      console.log(error);

    }

  };

  loadDiscounts();

}, []);

  const handleDelete = async (id) => {
    try {
      await deleteDiscount(id);
      setPopup({ show: true, type: "success", message: "Discount Deleted Successfully" });
      await fetchDiscounts(); // refresh list
    } catch (error) {
      setPopup({ show: true, type: "error", message: "Failed to delete discount", error });
    }
  };

  return { discounts, loading, popup, setPopup, handleDelete };
};