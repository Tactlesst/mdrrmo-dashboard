"use client";

import React, { useState, useEffect } from "react";

const BodyDiagram3D = ({ initialData = [], onChange, readOnly = false }) => {
  const [selectedBodyPart, setSelectedBodyPart] = useState("");
  const [condition, setCondition] = useState("");
  const [bodyPartsList, setBodyPartsList] = useState(
    Array.isArray(initialData)
      ? initialData.filter(
          (entry) =>
            entry &&
            typeof entry === "object" &&
            entry.bodyPart &&
            typeof entry.bodyPart === "string" &&
            entry.condition &&
            typeof entry.condition === "string"
        )
      : []
  );

  useEffect(() => {
    if (readOnly) {
      // Disable interactions when in read-only mode
    }
  }, [readOnly]);

  // Predefined list of body parts
  const bodyParts = [
    "left leg",
    "right leg",
    "left arm",
    "right arm",
    "head",
    "chest",
    "abdomen",
    "back",
    "left shoulder",
    "right shoulder",
    "left hand",
    "right hand",
  ];

  // Predefined list of conditions
  const conditions = ["injury", "fracture", "pain", "bruise", "laceration", "burn"];

  // Update bodyPartsList when initialData changes
  useEffect(() => {
    console.log("BodyDiagram3D initialData:", initialData);
    setBodyPartsList(
      Array.isArray(initialData)
        ? initialData.filter(
            (entry) =>
              entry &&
              typeof entry === "object" &&
              entry.bodyPart &&
              typeof entry.bodyPart === "string" &&
              entry.condition &&
              typeof entry.condition === "string"
          )
        : []
    );
  }, [initialData]);

  const handleAddBodyPart = () => {
    if (selectedBodyPart && condition) {
      const newEntry = { bodyPart: selectedBodyPart, condition };
      const updatedList = [...bodyPartsList, newEntry];
      console.log("BodyDiagram3D adding entry:", newEntry);
      console.log("BodyDiagram3D updated list:", updatedList);
      setBodyPartsList(updatedList);
      onChange?.(updatedList); // Update parent formData.bodyDiagram
      setSelectedBodyPart("");
      setCondition("");
    } else {
      console.warn("BodyDiagram3D: Cannot add entry, missing bodyPart or condition");
    }
  };

  const handleRemoveBodyPart = (index) => {
    const updatedList = bodyPartsList.filter((_, i) => i !== index);
    console.log("BodyDiagram3D removing entry at index:", index);
    console.log("BodyDiagram3D updated list:", updatedList);
    setBodyPartsList(updatedList);
    onChange?.(updatedList); // Update parent formData.bodyDiagram
  };

  return (
    <div className="border p-4 rounded-md print-border-gray-200">
      <style jsx>{`
        @media print {
          .border,
          .rounded-md,
          .shadow-sm {
            border: 1px solid #e5e7eb !important;
            border-radius: 4px !important;
            box-shadow: none !important;
          }
          .text-gray-800,
          .text-gray-700,
          .text-gray-500,
          .text-red-600,
          .bg-blue-600,
          .bg-blue-400,
          .hover\\:bg-blue-700,
          .hover\\:underline {
            color: #374151 !important;
            background-color: transparent !important;
            text-decoration: none !important;
          }
          .print-text-gray-700 {
            color: #374151 !important;
          }
          .print-text-gray-500 {
            color: #6b7280 !important;
          }
          .print-border-gray-200 {
            border-color: #e5e7eb !important;
          }
        }
      `}</style>
      <h3 className="text-sm font-semibold text-gray-800 mb-2 print-text-gray-700">Body Diagram</h3>
      {readOnly ? (
        // Read-only mode: Only show selected body parts
        bodyPartsList.length > 0 ? (
          <div className="mt-2">
            <h4 className="text-sm font-medium text-gray-700 print-text-gray-500">Selected Body Parts:</h4>
            <ul className="mt-2 space-y-2">
              {bodyPartsList.map((entry, index) => (
                <li key={index} className="text-sm print-text-gray-700">
                  {entry.bodyPart.charAt(0).toUpperCase() + entry.bodyPart.slice(1)} -{" "}
                  {entry.condition.charAt(0).toUpperCase() + entry.condition.slice(1)}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-500 print-text-gray-500">No body parts selected.</p>
        )
      ) : (
        // Editable mode: Show dropdowns and add/remove functionality
        <>
          <div className="flex space-x-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 print-text-gray-500">Body Part:</label>
              <select
                value={selectedBodyPart}
                onChange={(e) => setSelectedBodyPart(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm print-border-gray-200 print-text-gray-700"
              >
                <option value="" disabled>Select Body Part</option>
                {bodyParts.map((part) => (
                  <option key={part} value={part}>
                    {part.charAt(0).toUpperCase() + part.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print-text-gray-500">Condition:</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm print-border-gray-200 print-text-gray-700"
              >
                <option value="" disabled>Select Condition</option>
                {conditions.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond.charAt(0).toUpperCase() + cond.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddBodyPart}
              className="mt-6 bg-[#2563eb] text-white px-4 py-2 rounded-md hover:bg-[#1e40af] disabled:bg-[#93c5fd] print-text-gray-700"
              disabled={!selectedBodyPart || !condition}
            >
              Add
            </button>
          </div>
          {bodyPartsList.length > 0 && (
            <div className="mt-2">
              <h4 className="text-sm font-medium text-gray-700 print-text-gray-500">Selected Body Parts:</h4>
              <ul className="mt-2 space-y-2">
                {bodyPartsList.map((entry, index) => (
                  <li key={index} className="flex justify-between items-center text-sm print-text-gray-700">
                    <span>
                      {entry.bodyPart.charAt(0).toUpperCase() + entry.bodyPart.slice(1)} -{" "}
                      {entry.condition.charAt(0).toUpperCase() + entry.condition.slice(1)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBodyPart(index)}
                      className="text-[#dc2626] hover:underline print-text-gray-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BodyDiagram3D;