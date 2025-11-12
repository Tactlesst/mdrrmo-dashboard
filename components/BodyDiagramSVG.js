"use client";

import React, { useState, useEffect } from 'react';

const BodyDiagramSVG = ({ initialData = [], onChange, readOnly = false }) => {
  const [selectedBodyParts, setSelectedBodyParts] = useState(initialData || []);
  const [selectedCondition, setSelectedCondition] = useState('injury');
  const [hoveredPart, setHoveredPart] = useState(null);

  const conditions = [
    'injury', 'fracture', 'pain', 'bruise', 'laceration', 'burn',
    'swelling', 'bleeding', 'numbness', 'deformity', 'dislocation'
  ];

  // Body parts with SVG coordinates based on medical reference diagram
  const frontBodyParts = {
    head: { 
      type: 'circle', 
      cx: 150, cy: 50, r: 25,
      label: 'Head'
    },
    neck: { 
      type: 'rect', 
      x: 140, y: 75, width: 20, height: 15,
      label: 'Neck'
    },
    leftShoulder: { 
      type: 'circle', 
      cx: 115, cy: 105, r: 15,
      label: 'Left Shoulder'
    },
    rightShoulder: { 
      type: 'circle', 
      cx: 185, cy: 105, r: 15,
      label: 'Right Shoulder'
    },
    chest: { 
      type: 'rect', 
      x: 130, y: 90, width: 40, height: 50,
      label: 'Chest'
    },
    abdomen: { 
      type: 'rect', 
      x: 135, y: 140, width: 30, height: 40,
      label: 'Abdomen'
    },
    pelvis: { 
      type: 'rect', 
      x: 135, y: 180, width: 30, height: 25,
      label: 'Pelvis'
    },
    leftUpperArm: { 
      type: 'rect', 
      x: 100, y: 120, width: 15, height: 45,
      label: 'Left Upper Arm'
    },
    rightUpperArm: { 
      type: 'rect', 
      x: 185, y: 120, width: 15, height: 45,
      label: 'Right Upper Arm'
    },
    leftForearm: { 
      type: 'rect', 
      x: 95, y: 165, width: 15, height: 40,
      label: 'Left Forearm'
    },
    rightForearm: { 
      type: 'rect', 
      x: 190, y: 165, width: 15, height: 40,
      label: 'Right Forearm'
    },
    leftHand: { 
      type: 'ellipse', 
      cx: 102, cy: 215, rx: 8, ry: 12,
      label: 'Left Hand'
    },
    rightHand: { 
      type: 'ellipse', 
      cx: 198, cy: 215, rx: 8, ry: 12,
      label: 'Right Hand'
    },
    leftThigh: { 
      type: 'rect', 
      x: 135, y: 205, width: 12, height: 60,
      label: 'Left Thigh'
    },
    rightThigh: { 
      type: 'rect', 
      x: 153, y: 205, width: 12, height: 60,
      label: 'Right Thigh'
    },
    leftKnee: { 
      type: 'circle', 
      cx: 141, cy: 275, r: 8,
      label: 'Left Knee'
    },
    rightKnee: { 
      type: 'circle', 
      cx: 159, cy: 275, r: 8,
      label: 'Right Knee'
    },
    leftLowerLeg: { 
      type: 'rect', 
      x: 135, y: 285, width: 12, height: 55,
      label: 'Left Lower Leg'
    },
    rightLowerLeg: { 
      type: 'rect', 
      x: 153, y: 285, width: 12, height: 55,
      label: 'Right Lower Leg'
    },
    leftFoot: { 
      type: 'ellipse', 
      cx: 141, cy: 350, rx: 8, ry: 15,
      label: 'Left Foot'
    },
    rightFoot: { 
      type: 'ellipse', 
      cx: 159, cy: 350, rx: 8, ry: 15,
      label: 'Right Foot'
    }
  };

  const backBodyParts = {
    headBack: { 
      type: 'circle', 
      cx: 450, cy: 50, r: 25,
      label: 'Head (Back)'
    },
    neckBack: { 
      type: 'rect', 
      x: 440, y: 75, width: 20, height: 15,
      label: 'Neck (Back)'
    },
    leftShoulderBack: { 
      type: 'circle', 
      cx: 415, cy: 105, r: 15,
      label: 'Left Shoulder (Back)'
    },
    rightShoulderBack: { 
      type: 'circle', 
      cx: 485, cy: 105, r: 15,
      label: 'Right Shoulder (Back)'
    },
    upperBack: { 
      type: 'rect', 
      x: 430, y: 90, width: 40, height: 50,
      label: 'Upper Back'
    },
    lowerBack: { 
      type: 'rect', 
      x: 435, y: 140, width: 30, height: 40,
      label: 'Lower Back'
    },
    buttocks: { 
      type: 'rect', 
      x: 435, y: 180, width: 30, height: 25,
      label: 'Buttocks'
    },
    leftUpperArmBack: { 
      type: 'rect', 
      x: 400, y: 120, width: 15, height: 45,
      label: 'Left Upper Arm (Back)'
    },
    rightUpperArmBack: { 
      type: 'rect', 
      x: 485, y: 120, width: 15, height: 45,
      label: 'Right Upper Arm (Back)'
    },
    leftForearmBack: { 
      type: 'rect', 
      x: 395, y: 165, width: 15, height: 40,
      label: 'Left Forearm (Back)'
    },
    rightForearmBack: { 
      type: 'rect', 
      x: 490, y: 165, width: 15, height: 40,
      label: 'Right Forearm (Back)'
    },
    leftHandBack: { 
      type: 'ellipse', 
      cx: 402, cy: 215, rx: 8, ry: 12,
      label: 'Left Hand (Back)'
    },
    rightHandBack: { 
      type: 'ellipse', 
      cx: 498, cy: 215, rx: 8, ry: 12,
      label: 'Right Hand (Back)'
    },
    leftThighBack: { 
      type: 'rect', 
      x: 435, y: 205, width: 12, height: 60,
      label: 'Left Thigh (Back)'
    },
    rightThighBack: { 
      type: 'rect', 
      x: 453, y: 205, width: 12, height: 60,
      label: 'Right Thigh (Back)'
    },
    leftKneeBack: { 
      type: 'circle', 
      cx: 441, cy: 275, r: 8,
      label: 'Left Knee (Back)'
    },
    rightKneeBack: { 
      type: 'circle', 
      cx: 459, cy: 275, r: 8,
      label: 'Right Knee (Back)'
    },
    leftCalfBack: { 
      type: 'rect', 
      x: 435, y: 285, width: 12, height: 55,
      label: 'Left Calf'
    },
    rightCalfBack: { 
      type: 'rect', 
      x: 453, y: 285, width: 12, height: 55,
      label: 'Right Calf'
    },
    leftFootBack: { 
      type: 'ellipse', 
      cx: 441, cy: 350, rx: 8, ry: 15,
      label: 'Left Foot (Back)'
    },
    rightFootBack: { 
      type: 'ellipse', 
      cx: 459, cy: 350, rx: 8, ry: 15,
      label: 'Right Foot (Back)'
    }
  };

  // Combine front and back body parts
  const bodyParts = { ...frontBodyParts, ...backBodyParts };

  useEffect(() => {
    setSelectedBodyParts(initialData || []);
  }, [initialData]);

  const handleBodyPartClick = (bodyPartKey) => {
    if (readOnly) return;

    const bodyPart = bodyParts[bodyPartKey];
    const newEntry = { 
      bodyPart: bodyPart.label.toLowerCase(),
      condition: selectedCondition 
    };

    const updatedList = [...selectedBodyParts, newEntry];
    setSelectedBodyParts(updatedList);
    onChange?.(updatedList);
  };

  const handleRemoveBodyPart = (index) => {
    const updatedList = selectedBodyParts.filter((_, i) => i !== index);
    setSelectedBodyParts(updatedList);
    onChange?.(updatedList);
  };

  const isBodyPartSelected = (bodyPartKey) => {
    const bodyPart = bodyParts[bodyPartKey];
    return selectedBodyParts.some(entry => 
      entry.bodyPart.toLowerCase() === bodyPart.label.toLowerCase()
    );
  };

  const getBodyPartColor = (bodyPartKey) => {
    if (isBodyPartSelected(bodyPartKey)) {
      return '#ef4444'; // Red for selected
    }
    if (hoveredPart === bodyPartKey) {
      return '#3b82f6'; // Blue for hover
    }
    return '#e5e7eb'; // Default gray
  };

  const renderBodyPart = (bodyPartKey, part) => {
    const commonProps = {
      key: bodyPartKey,
      fill: getBodyPartColor(bodyPartKey),
      stroke: '#374151',
      strokeWidth: 2,
      style: { cursor: readOnly ? 'default' : 'pointer' },
      onMouseEnter: () => !readOnly && setHoveredPart(bodyPartKey),
      onMouseLeave: () => !readOnly && setHoveredPart(null),
      onClick: () => handleBodyPartClick(bodyPartKey)
    };

    switch (part.type) {
      case 'circle':
        return <circle {...commonProps} cx={part.cx} cy={part.cy} r={part.r} />;
      case 'ellipse':
        return <ellipse {...commonProps} cx={part.cx} cy={part.cy} rx={part.rx} ry={part.ry} />;
      case 'rect':
        return <rect {...commonProps} x={part.x} y={part.y} width={part.width} height={part.height} rx={5} />;
      default:
        return null;
    }
  };

  return (
    <div className="border p-4 rounded-md">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Interactive Body Diagram</h3>
      
      {!readOnly && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Condition:
          </label>
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
          >
            {conditions.map((condition) => (
              <option key={condition} value={condition}>
                {condition.charAt(0).toUpperCase() + condition.slice(1)}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Click on body parts to mark injuries/conditions
          </p>
        </div>
      )}

      <div className="flex justify-center mb-4">
        <svg 
          width="600" 
          height="400" 
          viewBox="0 0 600 400"
          className="border rounded-lg bg-white"
        >
          {/* Body outline for reference */}
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#f9fafb', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#f3f4f6', stopOpacity:1}} />
            </linearGradient>
          </defs>

          {/* Front view outline */}
          <g stroke="#d1d5db" strokeWidth="1.5" fill="none">
            {/* Head outline */}
            <circle cx="150" cy="50" r="25" />
            {/* Neck */}
            <rect x="140" y="75" width="20" height="15" rx="3" />
            {/* Torso outline */}
            <path d="M 130 90 Q 125 95 125 105 L 125 140 Q 125 145 130 150 L 130 180 Q 130 185 135 190 L 135 205 L 165 205 Q 170 200 170 190 L 170 180 Q 170 185 165 150 Q 170 145 170 140 L 170 105 Q 175 95 170 90 Z" />
            {/* Arms outline */}
            <rect x="100" y="120" width="15" height="45" rx="7" />
            <rect x="185" y="120" width="15" height="45" rx="7" />
            <rect x="95" y="165" width="15" height="40" rx="7" />
            <rect x="190" y="165" width="15" height="40" rx="7" />
            {/* Legs outline */}
            <rect x="135" y="205" width="12" height="60" rx="6" />
            <rect x="153" y="205" width="12" height="60" rx="6" />
            <rect x="135" y="285" width="12" height="55" rx="6" />
            <rect x="153" y="285" width="12" height="55" rx="6" />
          </g>

          {/* Back view outline */}
          <g stroke="#d1d5db" strokeWidth="1.5" fill="none">
            {/* Head outline */}
            <circle cx="450" cy="50" r="25" />
            {/* Neck */}
            <rect x="440" y="75" width="20" height="15" rx="3" />
            {/* Torso outline */}
            <path d="M 430 90 Q 425 95 425 105 L 425 140 Q 425 145 430 150 L 430 180 Q 430 185 435 190 L 435 205 L 465 205 Q 470 200 470 190 L 470 180 Q 470 185 465 150 Q 470 145 470 140 L 470 105 Q 475 95 470 90 Z" />
            {/* Arms outline */}
            <rect x="400" y="120" width="15" height="45" rx="7" />
            <rect x="485" y="120" width="15" height="45" rx="7" />
            <rect x="395" y="165" width="15" height="40" rx="7" />
            <rect x="490" y="165" width="15" height="40" rx="7" />
            {/* Legs outline */}
            <rect x="435" y="205" width="12" height="60" rx="6" />
            <rect x="453" y="205" width="12" height="60" rx="6" />
            <rect x="435" y="285" width="12" height="55" rx="6" />
            <rect x="453" y="285" width="12" height="55" rx="6" />
          </g>

          {/* Labels */}
          <text x="150" y="380" textAnchor="middle" className="fill-gray-600 text-sm font-medium">FRONT</text>
          <text x="450" y="380" textAnchor="middle" className="fill-gray-600 text-sm font-medium">BACK</text>

          {/* Render all body parts */}
          {Object.entries(bodyParts).map(([bodyPartKey, part]) => 
            renderBodyPart(bodyPartKey, part)
          )}

          {/* Labels for hovered parts */}
          {hoveredPart && (
            <text
              x="200"
              y="30"
              textAnchor="middle"
              className="fill-gray-700 text-sm font-medium"
            >
              {bodyParts[hoveredPart].label}
            </text>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-4 mb-4 text-xs">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded mr-2"></div>
          <span>Normal</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 border border-gray-400 rounded mr-2"></div>
          <span>Hover</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 border border-gray-400 rounded mr-2"></div>
          <span>Selected</span>
        </div>
      </div>

      {selectedBodyParts.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Body Parts:</h4>
          <ul className="space-y-2">
            {selectedBodyParts.map((entry, index) => (
              <li key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                <span>
                  {entry.bodyPart.charAt(0).toUpperCase() + entry.bodyPart.slice(1)} - {' '}
                  {entry.condition.charAt(0).toUpperCase() + entry.condition.slice(1)}
                </span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveBodyPart(index)}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BodyDiagramSVG;
