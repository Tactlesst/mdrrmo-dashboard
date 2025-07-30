import { useState, useEffect } from "react";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";

export default function Users() {
  const tabs = ["Residents", "Responders", "Co-Admins"];
  const [activeTab, setActiveTab] = useState("Residents");
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState({ Residents: [], Responders: [], "Co-Admins": [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        setAllUsers(data);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = allUsers[activeTab]?.filter((user) =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-white p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage {activeTab}</h1>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition duration-150">
          <FiPlus className="text-sm" />
          Add New {activeTab.slice(0, -1)}
        </button>
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
                ? "bg-red-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <h2 className="text-lg font-semibold text-gray-700">{activeTab} List</h2>
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full md:w-64 px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-red-300 outline-none transition"
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
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition duration-150">
                    <td className="py-3 px-4 font-medium">{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.dob || "—"}</td>
                    <td>{user.contact || "—"}</td>
                    <td>{user.address || "—"}</td>
                    <td className="flex justify-center gap-3 py-2 text-gray-600">
                      <FaEye className="cursor-pointer hover:text-blue-500" />
                      <FaEdit className="cursor-pointer hover:text-green-500" />
                      <FaTrash className="cursor-pointer hover:text-red-500" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-6">
                    {loading ? "Loading..." : `No ${activeTab.toLowerCase()} found.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
