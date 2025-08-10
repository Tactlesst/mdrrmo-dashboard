"use client";
import React, { useEffect, useState } from "react";
import PCRForm from "./PCRForm";

const PCRAdd = ({ onClose }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data?.name) {
          setCurrentUser(data);
        }
      })
      .catch(err => console.error("Failed to fetch current user", err));
  }, []);

  const handleSubmit = async (formData) => {
    const payload = {
      ...formData,
      recorder: currentUser?.name || "", // ensure it's sent
      created_by_type: currentUser?.type || "",
      created_by_id: currentUser?.id || null,
    };

    const response = await fetch(`/api/pcr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error || "Failed to create form");
    }

    onClose();
  };

  return (
    <PCRForm
      onClose={onClose}
      onSubmit={handleSubmit}
      initialData={{
        date: new Date().toISOString().slice(0, 10),
        recorder: currentUser?.name || "", // pre-fill the field
      }}
    />
  );
};

export default PCRAdd;
