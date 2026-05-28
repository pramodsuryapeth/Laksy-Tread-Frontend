// src/services/discountService.js

import API from "./api";


// ================= CREATE DISCOUNT =================

export const createDiscount = async (data) => {
  const res = await API.post("/discount/create", data);
  return res.data;
};


// ================= GET ALL DISCOUNTS =================

export const getAllDiscounts = async () => {
  const res = await API.get("/discount");
  return res.data;
};


// ================= GET SINGLE DISCOUNT =================

export const getSingleDiscount = async (id) => {
  const res = await API.get(`/discount/${id}`);
  return res.data;
};


// ================= UPDATE DISCOUNT =================

export const updateDiscount = async (id, data) => {
  const res = await API.put(`/discount/update/${id}`, data);
  return res.data;
};


// ================= DELETE DISCOUNT =================

export const deleteDiscount = async (id) => {
  const res = await API.delete(`/discount/delete/${id}`);
  return res.data;
};