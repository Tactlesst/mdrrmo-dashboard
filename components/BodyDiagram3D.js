import { useState } from "react";

const frontBodyParts = [
  { name: "Head", id: "head" },
  { name: "Neck", id: "neck" },
  { name: "Chest", id: "chest" },
  { name: "Abdomen", id: "abdomen" },
  { name: "Left Arm", id: "leftArm" },
  { name: "Right Arm", id: "rightArm" },
  { name: "Waist", id: "waist" },
  { name: "Left Thigh", id: "leftThigh" },
  { name: "Right Thigh", id: "rightThigh" },
  { name: "Left Shin", id: "leftShin" },
  { name: "Right Shin", id: "rightShin" },
  { name: "Left Foot", id: "leftFoot" },
  { name: "Right Foot", id: "rightFoot" },
];

const backBodyParts = [
  { name: "Back Head", id: "backHead" },
  { name: "Neck Back", id: "neckBack" },
  { name: "Back Shoulders", id: "backShoulders" },
  { name: "Back Torso", id: "backTorso" },
  { name: "Left Arm Back", id: "leftArmBack" },
  { name: "Right Arm Back", id: "rightArmBack" },
  { name: "Lower Back", id: "lowerBack" },
  { name: "Left Thigh Back", id: "leftThighBack" },
  { name: "Right Thigh Back", id: "rightThighBack" },
  { name: "Left Shin Back", id: "leftShinBack" },
  { name: "Right Shin Back", id: "rightShinBack" },
  { name: "Left Foot Back", id: "leftFootBack" },
  { name: "Right Foot Back", id: "rightFootBack" },
];

function Part({
  id,
  x,
  y,
  width,
  height,
  rx = 0,
  ry = 0,
  fill,
  stroke,
  strokeWidth,
  selected,
  onClick,
  label,
}) {
  return (
    <rect
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={label}
      x={x}
      y={y}
      width={width}
      height={height}
      rx={rx}
      ry={ry}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      cursor="pointer"
      style={{
        filter: selected ? "drop-shadow(0 0 6px #3b82f6)" : "none",
        transition: "filter 0.3s ease",
      }}
      onClick={() => onClick(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick(id);
        }
      }}
    />
  );
}

function CirclePart({ cx, cy, r, fill, stroke, strokeWidth, selected, onClick, label }) {
  return (
    <circle
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={label}
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      cursor="pointer"
      style={{
        filter: selected ? "drop-shadow(0 0 6px #3b82f6)" : "none",
        transition: "filter 0.3s ease",
      }}
      onClick={() => onClick(label)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick(label);
        }
      }}
    />
  );
}

export default function BodyDiagramFrontBack() {
  const [selectedFront, setSelectedFront] = useState(new Set());
  const [selectedBack, setSelectedBack] = useState(new Set());

  const toggleSelection = (id, isFront = true) => {
    if (isFront) {
      setSelectedFront((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return newSet;
      });
    } else {
      setSelectedBack((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return newSet;
      });
    }
  };

  return (
    <div className="flex justify-center gap-12 p-6 bg-gray-100">
      {/* Front View */}
      <svg
        width={250}
        height={600}
        viewBox="0 0 200 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Front view humanoid body diagram"
        className="bg-white shadow rounded"
      >
        {/* Head */}
        <CirclePart
          cx={100}
          cy={60}
          r={40}
          fill="#f5d6b4"
          stroke="#333"
          strokeWidth={3}
          selected={selectedFront.has("Head")}
          onClick={() => toggleSelection("Head", true)}
          label="Head"
        />

        {/* Neck */}
        <Part
          x={85}
          y={100}
          width={30}
          height={20}
          fill="#f5d6b4"
          stroke="#333"
          strokeWidth={1}
          rx={3}
          ry={3}
          selected={selectedFront.has("Neck")}
          onClick={() => toggleSelection("Neck", true)}
          label="Neck"
        />

        {/* Chest */}
        <Part
          x={60}
          y={120}
          width={80}
          height={60}
          fill="#ddd"
          stroke="#333"
          strokeWidth={2}
          rx={12}
          ry={12}
          selected={selectedFront.has("Chest")}
          onClick={() => toggleSelection("Chest", true)}
          label="Chest"
        />

        {/* Abdomen */}
        <Part
          x={60}
          y={180}
          width={80}
          height={60}
          fill="#ccc"
          stroke="#333"
          strokeWidth={2}
          rx={12}
          ry={12}
          selected={selectedFront.has("Abdomen")}
          onClick={() => toggleSelection("Abdomen", true)}
          label="Abdomen"
        />

        {/* Left Arm */}
        <Part
          x={15}
          y={120}
          width={30}
          height={140}
          fill="#bbb"
          stroke="#333"
          strokeWidth={2}
          rx={12}
          ry={12}
          selected={selectedFront.has("Left Arm")}
          onClick={() => toggleSelection("Left Arm", true)}
          label="Left Arm"
        />

        {/* Right Arm */}
        <Part
          x={155}
          y={120}
          width={30}
          height={140}
          fill="#bbb"
          stroke="#333"
          strokeWidth={2}
          rx={12}
          ry={12}
          selected={selectedFront.has("Right Arm")}
          onClick={() => toggleSelection("Right Arm", true)}
          label="Right Arm"
        />

        {/* Waist */}
        <Part
          x={70}
          y={240}
          width={60}
          height={30}
          fill="#ccc"
          stroke="#333"
          strokeWidth={2}
          rx={10}
          ry={10}
          selected={selectedFront.has("Waist")}
          onClick={() => toggleSelection("Waist", true)}
          label="Waist"
        />

        {/* Left Thigh */}
        <Part
          x={70}
          y={270}
          width={30}
          height={130}
          fill="#bbb"
          stroke="#333"
          strokeWidth={2}
          rx={15}
          ry={15}
          selected={selectedFront.has("Left Thigh")}
          onClick={() => toggleSelection("Left Thigh", true)}
          label="Left Thigh"
        />

        {/* Right Thigh */}
        <Part
          x={110}
          y={270}
          width={30}
          height={130}
          fill="#bbb"
          stroke="#333"
          strokeWidth={2}
          rx={15}
          ry={15}
          selected={selectedFront.has("Right Thigh")}
          onClick={() => toggleSelection("Right Thigh", true)}
          label="Right Thigh"
        />

        {/* Left Shin */}
        <Part
          x={70}
          y={400}
          width={30}
          height={80}
          fill="#aaa"
          stroke="#333"
          strokeWidth={2}
          rx={15}
          ry={15}
          selected={selectedFront.has("Left Shin")}
          onClick={() => toggleSelection("Left Shin", true)}
          label="Left Shin"
        />

        {/* Right Shin */}
        <Part
          x={110}
          y={400}
          width={30}
          height={80}
          fill="#aaa"
          stroke="#333"
          strokeWidth={2}
          rx={15}
          ry={15}
          selected={selectedFront.has("Right Shin")}
          onClick={() => toggleSelection("Right Shin", true)}
          label="Right Shin"
        />

        {/* Left Foot */}
        <Part
          x={60}
          y={480}
          width={40}
          height={15}
          fill="#999"
          stroke="#333"
          strokeWidth={2}
          rx={8}
          ry={8}
          selected={selectedFront.has("Left Foot")}
          onClick={() => toggleSelection("Left Foot", true)}
          label="Left Foot"
        />

        {/* Right Foot */}
        <Part
          x={100}
          y={480}
          width={40}
          height={15}
          fill="#999"
          stroke="#333"
          strokeWidth={2}
          rx={8}
          ry={8}
          selected={selectedFront.has("Right Foot")}
          onClick={() => toggleSelection("Right Foot", true)}
          label="Right Foot"
        />
      </svg>

      {/* Back View */}
      <svg
        width={250}
        height={600}
        viewBox="0 0 200 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Back view humanoid body diagram"
        className="bg-white shadow rounded"
      >
        {/* Back Head */}
        <CirclePart
          cx={100}
          cy={60}
          r={40}
          fill="#f5d6b4"
          stroke="#333"
          strokeWidth={3}
          selected={selectedBack.has("Back Head")}
          onClick={() => toggleSelection("Back Head", false)}
          label="Back Head"
        />

        {/* Neck Back */}
        <Part
          x={85}
          y={100}
          width={30}
          height={20}
          fill="#f5d6b4"
          stroke="#333"
          strokeWidth={1}
          rx={3}
          ry={3}
          selected={selectedBack.has("Neck Back")}
          onClick={() => toggleSelection("Neck Back", false)}
          label="Neck Back"
        />

        {/* Back Shoulders */}
        <Part
          x={40}
          y={120}
          width={120}
          height={40}
          fill="#ddd"
          stroke="#333"
          strokeWidth={2}
          rx={12}
          ry={12}
          selected={selectedBack.has("Back Shoulders")}
          onClick={() => toggleSelection("Back Shoulders", false)}
          label="Back Shoulders"
        />

        {/* Back Torso */}
        <Part
          x={60}
          y={160}
          width={80}
          height={140}
          fill="#ccc"
          stroke="#333"
          strokeWidth={2}
          rx={15}
          ry={15}
          selected={selectedBack.has("Back Torso")}
          onClick={() => toggleSelection("Back Torso", false)}
          label="Back Torso"
        />

        {/* Left Arm Back */}
        <Part
          x={15}
          y={120}
          width={30}
          height={160}
          fill="#bbb"
          stroke="#333"
          strokeWidth={2}
          rx={12}
          ry={12}
          selected={selectedBack.has("Left Arm Back")}
          onClick={() => toggleSelection("Left Arm Back", false)}
          label="Left Arm Back"
        />

        {/* Right Arm Back */}
        <Part
          x={155}
          y={120}
          width={30}
          height={160}
          fill="#bbb"
          stroke="#333"
          strokeWidth={2}
          rx={12}
          ry={12}
          selected={selectedBack.has("Right Arm Back")}
          onClick={() => toggleSelection("Right Arm Back", false)}
          label="Right Arm Back"
        />

        {/* Lower Back */}
        <Part
          x={70}
          y={300}
          width={60}
          height={40}
          fill="#bbb"
          stroke="#333"
          strokeWidth={2}
          rx={10}
          ry={10}
          selected={selectedBack.has("Lower Back")}
          onClick={() => toggleSelection("Lower Back", false)}
          label="Lower Back"
        />

        {/* Left Thigh Back */}
        <Part
          x={70}
          y={340}
          width={30}
          height={110}
          fill="#aaa"
          stroke="#333"
          strokeWidth={2}
          rx={15}
          ry={15}
          selected={selectedBack.has("Left Thigh Back")}
          onClick={() => toggleSelection("Left Thigh Back", false)}
          label="Left Thigh Back"
        />

        {/* Right Thigh Back */}
        <Part
          x={110}
          y={340}
          width={30}
          height={110}
          fill="#aaa"
          stroke="#333"
          strokeWidth={2}
          rx={15}
          ry={15}
          selected={selectedBack.has("Right Thigh Back")}
          onClick={() => toggleSelection("Right Thigh Back", false)}
          label="Right Thigh Back"
        />

        {/* Left Shin Back */}
        <Part
          x={70}
          y={450}
          width={30}
          height={50}
          fill="#888"
          stroke="#333"
          strokeWidth={2}
          rx={15}
          ry={15}
          selected={selectedBack.has("Left Shin Back")}
          onClick={() => toggleSelection("Left Shin Back", false)}
          label="Left Shin Back"
        />

        {/* Right Shin Back */}
        <Part
          x={110}
          y={450}
          width={30}
          height={50}
          fill="#888"
          stroke="#333"
          strokeWidth={2}
          rx={15}
          ry={15}
          selected={selectedBack.has("Right Shin Back")}
          onClick={() => toggleSelection("Right Shin Back", false)}
          label="Right Shin Back"
        />

        {/* Left Foot Back */}
        <Part
          x={60}
          y={490}
          width={40}
          height={15}
          fill="#666"
          stroke="#333"
          strokeWidth={2}
          rx={8}
          ry={8}
          selected={selectedBack.has("Left Foot Back")}
          onClick={() => toggleSelection("Left Foot Back", false)}
          label="Left Foot Back"
        />

        {/* Right Foot Back */}
        <Part
          x={100}
          y={490}
          width={40}
          height={15}
          fill="#666"
          stroke="#333"
          strokeWidth={2}
          rx={8}
          ry={8}
          selected={selectedBack.has("Right Foot Back")}
          onClick={() => toggleSelection("Right Foot Back", false)}
          label="Right Foot Back"
        />
      </svg>
    </div>
  );
}
