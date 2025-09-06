"use client";

import { useState, useEffect } from "react";
import { FaEye, FaEdit } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import EditUserModal from "./EditUserModal";
import ViewUserModal from "./ViewUserModal";
import AddUserModal from "./AddUserModal";

const tabs = ["Residents", "Responders", "Co-Admins"];

export default function Users() {
  const [activeTab, setActiveTab] = useState("Residents");
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const fetchTabUsers = async (tab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?role=${tab}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch users for ${tab}: ${res.statusText}`);
      }
      const data = await res.json();
      console.log(`Fetched users for ${tab}:`, data); // Debugging log
      // Sort users by created_at as a fallback
      const sortedData = data.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB - dateA; // Descending order
      });
      setAllUsers((prev) => ({ ...prev, [tab]: sortedData }));
    } catch (err) {
      console.error(`Failed to fetch users for ${tab}:`, err);
      setAllUsers((prev) => ({ ...prev, [tab]: [] }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allUsers[activeTab]) {
      fetchTabUsers(activeTab);
    }
    setCurrentPage(1); // Reset page when tab changes
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1); // Reset page when searching
  }, [searchTerm]);

  const filteredUsers = (allUsers[activeTab] || []).filter((user) => {
    const name = user.fullName || user.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // In Users.js
  const formatDatePH = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-white p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage {activeTab}</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gray-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition duration-150"
        >
          <FiPlus className="text-sm" />
          Add New {activeTab.slice(0, -1)}
        </button>
        {showAddModal && (
          <AddUserModal
            role={activeTab}
            onClose={() => {
              setShowAddModal(false);
              fetchTabUsers(activeTab);
            }}
            onAddUser={(newUser) => {
              console.log("New user added:", newUser); // Debugging log
              setAllUsers((prev) => ({
                ...prev,
                [activeTab]: [newUser, ...(prev[activeTab] || [])], // Add new user at the top
              }));
              fetchTabUsers(activeTab);
              setShowAddModal(false);
            }}
          />
        )}
      </div>

      <div className="flex gap-3 mb-6 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSearchTerm("");
            }}
            className={`px-5 py-2 rounded-full font-medium text-sm transition ${
              activeTab === tab
                ? "bg-gray-600 text-white shadow-md"
                : "bg-blue-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {activeTab} List
          </h2>
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full md:w-64 px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-300 outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-t border-gray-200">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
              <tr>
                <th className="py-3 px-4">Full Name</th>
                <th>Email</th>
                <th>Date of Birth</th>
                <th>Contact</th>
                <th>Address</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentUsers.length > 0 ? (
                currentUsers.map((user, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 transition duration-150"
                  >
                    <td
                      className="py-3 px-4 font-medium text-blue-600 hover:underline cursor-pointer"
                      onClick={() => setViewUser(user)}
                    >
                      {user.fullName || user.name}
                    </td>
                    <td>{user.email}</td>
                    <td>{formatDatePH(user.dob)}</td>
                    <td>{user.contact || "—"}</td>
                    <td>{user.address || "—"}</td>
                    <td className="flex justify-center gap-3 py-2 text-gray-600">
                      <FaEye
                        className="cursor-pointer hover:text-blue-500"
                        onClick={() => setViewUser(user)}
                      />
                      <FaEdit
                        className="cursor-pointer hover:text-green-500"
                        onClick={() => setEditUser(user)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-6">
                    {loading
                      ? "Loading..."
                      : `No ${activeTab.toLowerCase()} found.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredUsers.length > usersPerPage && (
          <div className="flex justify-center items-center mt-6 gap-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg shadow ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-gray-700"
              }`}
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg shadow ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-gray-700"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {editUser && (
        <EditUserModal
          key={editUser.id}
          user={editUser}
          role={activeTab}
          onClose={() => {
            setEditUser(null);
            fetchTabUsers(activeTab);
          }}
          onSave={(updatedUser) => {
            setAllUsers((prev) => ({
              ...prev,
              [activeTab]: prev[activeTab].map((u) =>
                u.email === updatedUser.email ? updatedUser : u
              ),
            }));
            setEditUser(null);
            fetchTabUsers(activeTab);
          }}
        />
      )}

      {viewUser && (
        <ViewUserModal
          user={viewUser}
          formatDatePH={formatDatePH}
          onClose={() => {
            setViewUser(null);
            fetchTabUsers(activeTab);
          }}
        />
      )}
    </div>
  );
}
