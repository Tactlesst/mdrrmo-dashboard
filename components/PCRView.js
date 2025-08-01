"use client";

import React from "react";
import { FiX } from "react-icons/fi";
import Image from "next/image";

const PCRView = ({ form, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl relative overflow-y-auto max-h-[95vh] p-8 space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition"
        >
          <FiX size={22} />
        </button>

        <div className="text-center border-b pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            Patient Care Report
          </h1>
        </div>

        {/* Case Info */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div><strong>Name:</strong> {form.name}</div>
          <div><strong>Date:</strong> {form.date}</div>
          <div><strong>Location:</strong> {form.location}</div>
          <div><strong>Recorder:</strong> {form.recorder}</div>
          <div><strong>Age:</strong> {form.age}</div>
          <div><strong>Gender:</strong> {form.gender}</div>
          <div><strong>Hospital:</strong> {form.hospital}</div>
          <div><strong>Complaint:</strong> {form.complaint}</div>
        </section>

        {/* Vitals */}
        <section>
          <h2 className="font-semibold text-gray-800 mb-2">Vital Signs</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm bg-gray-50 p-4 rounded-lg">
            <div><strong>BP:</strong> {form.vitalSigns.bp}</div>
            <div><strong>PR:</strong> {form.vitalSigns.pr}</div>
            <div><strong>RR:</strong> {form.vitalSigns.rr}</div>
            <div><strong>O2 Sat:</strong> {form.vitalSigns.o2sat}</div>
            <div><strong>Temp:</strong> {form.vitalSigns.temp}</div>
          </div>
        </section>

        {/* Contact Person */}
        <section>
          <h2 className="font-semibold text-gray-800 mb-2">Contact Person</h2>
          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            {form.contactPerson.name} ({form.contactPerson.relation}) – {form.contactPerson.number}
          </div>
        </section>

        {/* POI */}
        <section>
          <h2 className="font-semibold text-gray-800 mb-2">Place of Incident (POI)</h2>
          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            {form.poi}
          </div>
        </section>

        {/* Evac Code and Influence */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><strong>Evac Code:</strong> {form.evacCode}</div>
          <div><strong>Under Influence:</strong> {form.underInfluence?.join(", ")}</div>
        </section>

        {/* Patient History */}
        <section>
          <h2 className="font-semibold text-gray-800 mb-2">Patient History</h2>
          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            {form.history}
          </div>
        </section>

        {/* Body Diagrams */}
        <section>
          <h2 className="font-semibold text-gray-800 mb-2">Body Diagrams</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border rounded-lg p-2">
              <Image
                src="/images/front-body.png"
                alt="Front Body"
                width={300}
                height={300}
                className="mx-auto"
              />
            </div>
            <div className="border rounded-lg p-2">
              <Image
                src="/images/back-body.png"
                alt="Back Body"
                width={300}
                height={300}
                className="mx-auto"
              />
            </div>
          </div>
        </section>

        {/* Narrative */}
        <section>
          <h2 className="font-semibold text-gray-800 mb-2">Narrative</h2>
          <div className="bg-gray-50 p-4 rounded-lg text-sm leading-relaxed">
            {form.narrative}
          </div>
        </section>

        {/* Waiver */}
        <section>
          <h2 className="font-semibold text-gray-800 mb-2">Waiver</h2>
          <div className="bg-gray-50 p-4 rounded-lg text-sm leading-relaxed">
            {form.waiver}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PCRView;
