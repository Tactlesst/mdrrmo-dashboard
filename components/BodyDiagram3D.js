'use client';
import React, { useState } from 'react';

const parts = [
  { id: 'head', label: 'Head' },
  { id: 'neck', label: 'Neck' },
  { id: 'chest', label: 'Chest' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'upper-back', label: 'Upper Back' },
  { id: 'lower-back', label: 'Lower Back' },
  { id: 'buttocks', label: 'Buttocks' },
  { id: 'left-arm', label: 'Left Arm' },
  { id: 'right-arm', label: 'Right Arm' },
  { id: 'left-forearm', label: 'Left Forearm' },
  { id: 'right-forearm', label: 'Right Forearm' },
  { id: 'left-hand', label: 'Left Hand' },
  { id: 'right-hand', label: 'Right Hand' },
  { id: 'pelvis', label: 'Pelvis' },
  { id: 'left-thigh', label: 'Left Thigh' },
  { id: 'right-thigh', label: 'Right Thigh' },
  { id: 'left-shin', label: 'Left Shin' },
  { id: 'right-shin', label: 'Right Shin' },
  { id: 'left-foot', label: 'Left Foot' },
  { id: 'right-foot', label: 'Right Foot' },
];

export default function HumanoidBody() {
  const [selectedParts, setSelectedParts] = useState([]);
  const [view, setView] = useState('front');

  const togglePart = (id) => {
    setSelectedParts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const partClasses = (id) =>
    `cursor-pointer transition-all duration-200 hover:brightness-110 stroke-2 ${
      selectedParts.includes(id)
        ? 'fill-blue-400 stroke-blue-600'
        : 'fill-gray-100 stroke-gray-400 hover:fill-gray-200'
    }`;

  const FrontView = () => (
    <svg viewBox="0 0 300 1000" className="w-full max-w-sm" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="150" cy="45" rx="28" ry="32" className={partClasses('head')} onClick={() => togglePart('head')} />
      <rect x="138" y="77" width="24" height="18" rx="12" className={partClasses('neck')} onClick={() => togglePart('neck')} />
      <path d="M 125 95 L 175 95 Q 185 100 185 110 L 185 165 Q 185 175 180 180 L 170 185 L 130 185 Q 115 175 115 165 L 115 110 Q 115 100 125 95 Z" className={partClasses('chest')} onClick={() => togglePart('chest')} />
      <path d="M 130 185 L 170 185 Q 175 190 175 200 L 175 235 Q 175 245 170 250 L 130 250 Q 125 245 125 235 L 125 200 Q 125 190 130 185 Z" className={partClasses('abdomen')} onClick={() => togglePart('abdomen')} />
      <ellipse cx="100" cy="130" rx="12" ry="32" transform="rotate(-10 100 130)" className={partClasses('left-arm')} onClick={() => togglePart('left-arm')} />
      <ellipse cx="200" cy="130" rx="12" ry="32" transform="rotate(10 200 130)" className={partClasses('right-arm')} onClick={() => togglePart('right-arm')} />
      <ellipse cx="92" cy="175" rx="10" ry="28" transform="rotate(-5 92 175)" className={partClasses('left-forearm')} onClick={() => togglePart('left-forearm')} />
      <ellipse cx="208" cy="175" rx="10" ry="28" transform="rotate(5 208 175)" className={partClasses('right-forearm')} onClick={() => togglePart('right-forearm')} />
      <ellipse cx="88" cy="210" rx="8" ry="12" className={partClasses('left-hand')} onClick={() => togglePart('left-hand')} />
      <ellipse cx="212" cy="210" rx="8" ry="12" className={partClasses('right-hand')} onClick={() => togglePart('right-hand')} />
      <ellipse cx="150" cy="275" rx="30" ry="22" className={partClasses('pelvis')} onClick={() => togglePart('pelvis')} />
      <ellipse cx="135" cy="330" rx="16" ry="38" className={partClasses('left-thigh')} onClick={() => togglePart('left-thigh')} />
      <ellipse cx="165" cy="330" rx="16" ry="38" className={partClasses('right-thigh')} onClick={() => togglePart('right-thigh')} />
      <ellipse cx="132" cy="395" rx="13" ry="35" className={partClasses('left-shin')} onClick={() => togglePart('left-shin')} />
      <ellipse cx="168" cy="395" rx="13" ry="35" className={partClasses('right-shin')} onClick={() => togglePart('right-shin')} />
      <ellipse cx="128" cy="445" rx="10" ry="15" className={partClasses('left-foot')} onClick={() => togglePart('left-foot')} />
      <ellipse cx="172" cy="445" rx="10" ry="15" className={partClasses('right-foot')} onClick={() => togglePart('right-foot')} />
    </svg>
  );

  const BackView = () => (
    <svg viewBox="0 0 300 500" className="w-full max-w-sm" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="150" cy="45" rx="28" ry="32" className={partClasses('head')} onClick={() => togglePart('head')} />
      <rect x="138" y="77" width="24" height="18" rx="12" className={partClasses('neck')} onClick={() => togglePart('neck')} />

      {/* New Back Sections */}
      <path d="M 125 95 L 175 95 Q 185 100 185 115 L 185 145 Q 185 155 180 160 L 170 165 L 130 165 Q 120 155 120 145 L 120 115 Q 120 100 125 95 Z" className={partClasses('upper-back')} onClick={() => togglePart('upper-back')} />
      <path d="M 130 165 L 170 165 Q 175 170 175 180 L 175 215 Q 175 225 170 230 L 130 230 Q 125 225 125 215 L 125 180 Q 125 170 130 165 Z" className={partClasses('lower-back')} onClick={() => togglePart('lower-back')} />
      <ellipse cx="150" cy="255" rx="28" ry="18" className={partClasses('buttocks')} onClick={() => togglePart('buttocks')} />

      <ellipse cx="100" cy="130" rx="12" ry="32" transform="rotate(-10 100 130)" className={partClasses('right-arm')} onClick={() => togglePart('right-arm')} />
      <ellipse cx="200" cy="130" rx="12" ry="32" transform="rotate(10 200 130)" className={partClasses('left-arm')} onClick={() => togglePart('left-arm')} />
      <ellipse cx="92" cy="175" rx="10" ry="28" transform="rotate(-5 92 175)" className={partClasses('right-forearm')} onClick={() => togglePart('right-forearm')} />
      <ellipse cx="208" cy="175" rx="10" ry="28" transform="rotate(5 208 175)" className={partClasses('left-forearm')} onClick={() => togglePart('left-forearm')} />
      <ellipse cx="88" cy="210" rx="8" ry="12" className={partClasses('right-hand')} onClick={() => togglePart('right-hand')} />
      <ellipse cx="212" cy="210" rx="8" ry="12" className={partClasses('left-hand')} onClick={() => togglePart('left-hand')} />
      <ellipse cx="150" cy="275" rx="30" ry="22" className={partClasses('pelvis')} onClick={() => togglePart('pelvis')} />
      <ellipse cx="135" cy="330" rx="16" ry="38" className={partClasses('right-thigh')} onClick={() => togglePart('right-thigh')} />
      <ellipse cx="165" cy="330" rx="16" ry="38" className={partClasses('left-thigh')} onClick={() => togglePart('left-thigh')} />
      <ellipse cx="132" cy="395" rx="13" ry="35" className={partClasses('right-shin')} onClick={() => togglePart('right-shin')} />
      <ellipse cx="168" cy="395" rx="13" ry="35" className={partClasses('left-shin')} onClick={() => togglePart('left-shin')} />
      <ellipse cx="128" cy="445" rx="10" ry="15" className={partClasses('right-foot')} onClick={() => togglePart('right-foot')} />
      <ellipse cx="172" cy="445" rx="10" ry="15" className={partClasses('left-foot')} onClick={() => togglePart('left-foot')} />
    </svg>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="flex-1 flex flex-col items-center">
        <div className="mb-6 flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setView('front')} className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${view === 'front' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Front View</button>
          <button onClick={() => setView('back')} className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${view === 'back' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Back View</button>
        </div>
        <div className="flex justify-center bg-white p-8 rounded-lg shadow-sm border">
          {view === 'front' ? <FrontView /> : <BackView />}
        </div>
      </div>

      <div className="w-full lg:w-80 bg-white border rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Body Part Selection</h3>
          <p className="text-sm text-gray-600 mt-1">Click on the diagram or use checkboxes</p>
        </div>
        <div className="p-6">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {parts.map(({ id, label }) => (
              <label key={id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                <input type="checkbox" checked={selectedParts.includes(id)} onChange={() => togglePart(id)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" />
                <span className={`text-sm font-medium ${selectedParts.includes(id) ? 'text-blue-700' : 'text-gray-700'}`}>{label}</span>
              </label>
            ))}
          </div>

          {selectedParts.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Selected Parts ({selectedParts.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedParts.map((partId) => {
                  const part = parts.find(p => p.id === partId);
                  return (
                    <span key={partId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {part?.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
