"use client";

import React, { useEffect, useState } from "react";
import PCRForm from "./PCRForm";

const PCRAdd = ({ onClose }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.name) {
          setCurrentUser(data);
        }
      })
      .catch((err) => console.error("Failed to fetch current user:", err));
  }, []);

  const handleSubmit = async (formData) => {
    try {
      const payload = {
        ...formData,
        recorder: formData.recorder || currentUser?.name || "", // Ensure recorder is set
        created_by_type: currentUser?.type || "",
        created_by_id: currentUser?.id || null,
      };

      console.log("Submitting payload to /api/pcr:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/pcr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const { error } = await response.json();
        console.error("PCR submission error:", error);
        throw new Error(error || "Failed to create form");
      }

      console.log("PCR form submitted successfully");
      onClose(true); // Close with success
    } catch (error) {
      console.error("Error submitting PCR form:", error);
      throw error; // Let PCRForm handle error display
    }
  };

  return (
    <PCRForm
      onClose={onClose}
      onSubmit={handleSubmit}
      initialData={{
        date: new Date().toISOString().split("T")[0], // Consistent YYYY-MM-DD format
        recorder: currentUser?.name || "",
      }}
      createdByType={currentUser?.type || ""}
      createdById={currentUser?.id || null}
    />
  );
};

export default PCRAdd;