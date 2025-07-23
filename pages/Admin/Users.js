import { useState } from "react";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";

export default function InventoryDashboard() {
  

  const users = [
    {
      fullName: "Razel Del Puerto",
      email: "razel@example.com",
      dob: "1995-06-12",
      contact: "09171234567",
      address: "Brgy. 1 Balingasag",
    },
    {
      fullName: "Marian Cortez",
      email: "marian@example.com",
      dob: "1990-09-30",
      contact: "09181112233",
      address: "Zone 5, Cugman",
    },
    {
      fullName: "Jason De Mesa",
      email: "jason@example.com",
      dob: "1988-04-15",
      contact: "09228889999",
      address: "Aplaya, Davao City",
    },
    {
      fullName: "Lourdes Tan",
      email: "lourdes@example.com",
      dob: "1992-12-01",
      contact: "09178887766",
      address: "Bunawan, Agusan",
    },
    {
      fullName: "Arvin Santos",
      email: "arvin@example.com",
      dob: "1985-01-25",
      contact: "09175556677",
      address: "Claveria, Misamis Oriental",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F1F1F1] p-8 font-serif">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold tracking-wide">Manage Residents</h1>
        <button className="bg-[#ff0000] text-white px-4 py-2 rounded-md flex items-center gap-2">
          <FiPlus /> Add New Resident
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded shadow p-4 mt-5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg">Residents</h2>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search"
              className="border px-4 py-2 rounded-md"
            />
            <button className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-black px-4 py-2 rounded-xl shadow-sm transition duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 019 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filter
            </button>
            <button className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-black px-4 py-2 rounded-xl shadow-sm transition duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h11M3 6h7m-7 8h5m7 0l3 3m0 0l-3 3m3-3H10" />
              </svg>
              Sort
            </button>
          </div>
        </div>

        <table className="w-full text-left border-t border-gray-300">
          <thead>
            <tr className="text-sm text-gray-700">
              <th className="py-2">Full Name</th>
              <th>Email</th>
              <th>Date of Birth</th>
              <th>Contact Number</th>
              <th>Address</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={idx} className="border-t text-sm">
                <td className="py-2">{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.dob}</td>
                <td>{user.contact}</td>
                <td>{user.address}</td>
                <td className="flex gap-3 text-gray-700 py-2">
                  <FaEye className="cursor-pointer hover:text-blue-600" />
                  <FaEdit className="cursor-pointer hover:text-green-600" />
                  <FaTrash className="cursor-pointer hover:text-red-600" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}