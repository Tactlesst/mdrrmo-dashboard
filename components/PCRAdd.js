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
          console.log("Fetched current user:", data);
          setCurrentUser(data);
        } else {
          console.warn("No user data received from /api/auth/me");
        }
      })
      .catch((err) => console.error("Failed to fetch current user:", err));
  }, []);

  const handleSubmit = async (formData) => {
    try {
      // Validate bodyDiagram
      const validatedBodyDiagram = Array.isArray(formData.bodyDiagram)
        ? formData.bodyDiagram.filter(
            (entry) =>
              entry &&
              typeof entry === "object" &&
              entry.bodyPart &&
              typeof entry.bodyPart === "string" &&
              entry.condition &&
              typeof entry.condition === "string"
          )
        : [];
      console.log("Validated bodyDiagram in PCRAdd:", validatedBodyDiagram);

      const payload = {
        ...formData,
        bodyDiagram: validatedBodyDiagram, // Ensure bodyDiagram is included
        recorder: formData.recorder || currentUser?.name || "",
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
      onClose(true);
    } catch (error) {
      console.error("Error submitting PCR form:", error);
      throw error;
    }
  };

  return (
    <PCRForm
      onClose={onClose}
      onSubmit={handleSubmit}
      initialData={{
        date: new Date()
          .toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })
          .split("T")[0],
        recorder: currentUser?.name || "",
        bodyDiagram: [], // Explicitly initialize bodyDiagram
      }}
      createdByType={currentUser?.type || ""}
      createdById={currentUser?.id || null}
    />
  );
};

export default PCRAdd;