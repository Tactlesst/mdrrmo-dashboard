// components/PCREdit.jsx
"use client";

import React from "react";
import PCRForm from "./PCRForm";

const PCREdit = ({ form, onClose }) => {
  const handleSubmit = async (formData) => {
    try {
      const response = await fetch(`/api/pcr/${form.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to update form");
      }

      onClose(true);
    } catch (error) {
      console.error("Error updating form:", error);
      alert(error.message);
    }
  };

  return (
    <PCRForm
      onClose={onClose}
      initialData={form.full_form}
      onSubmit={handleSubmit}
    />
  );
};

export default PCREdit;