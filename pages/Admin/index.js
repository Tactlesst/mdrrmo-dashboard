import * as AiIcons_md from "react-icons/md";
import React, { useState } from 'react';
import { useRouter } from "next/router";
import Dashboard from "./Dashboard";
import IncomingAlerts from "./Incoming Alert";
import POS from "./Users";
import SystemNotif from "./Logs";
import ManageUsers from "./PCR form";


export default function Incharge_Main() {
    const router = useRouter();

    const [SelectedModal, setSelectedModal] = useState('');
    const [IsProfileDropdown, setProfileDpOpen] = useState(false);
    const [selectedPage, setSelectedPage] = useState("Dashboard");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const handleProfileClick = () => setProfileDpOpen(prev => !prev);
    const handlePageChange = (page) => setSelectedPage(page);
    const CloseModal = () => setSelectedModal('');

    const LogoutFunc = () => {
        router.push('/');
    };

    return (
        <div className="flex h-screen bg-gray-100 text-gray-900">
            <title>Admin | iAssistaka</title>

            {/* Sidebar */}
            <aside className={`flex flex-col bg-white text-black w-${isSidebarOpen ? '50' : '20'} transition-all duration-300`}>
                <div className="flex items-center justify-between py-4 px-3">
                    <div className="flex">
                        
                        {isSidebarOpen && <h2 className="ml-2 text-lg">iAssistaka</h2>}
                    </div>

                    <button className="text-red-900" onClick={toggleSidebar}><AiIcons_md.MdMenu size={28} /></button>  
                </div>
                <img src="./Logoo.png" alt="Logo" className="h-15 w-32 ml-6" />
                <div className="flex flex-col mt-10 gap-4 px-4">
                    <button className={`flex items-center gap-2 p-2 rounded hover:bg-red-200 ${selectedPage === "Dashboard" ? 'text-red-600' : ''}`} onClick={() => handlePageChange("Dashboard")}>
                        <AiIcons_md.MdDashboard size={25} />
                        {isSidebarOpen && 'Dashboard'}
                    </button>
                    <button className={`flex items-center gap-2 p-2 rounded hover:bg-red-200 ${selectedPage === "IncomingAlerts" ? 'text-red-600' : ''}`} onClick={() => handlePageChange("IncomingAlerts")}>
                        <AiIcons_md.MdInventory size={25} />
                        {isSidebarOpen && 'Incoming Alerts'}
                    </button>
                 

                    <button className={`flex items-center gap-2 p-2 rounded hover:bg-red-200 ${selectedPage === "ManageUsers" ? 'text-red-600' : ''}`} onClick={() => handlePageChange("ManageUsers")}>
                        <AiIcons_md.MdAssessment size={25} />
                        {isSidebarOpen && 'PCR form'}
                    </button>
                    <button className={`flex items-center gap-2 p-2 rounded hover:bg-red-200 ${selectedPage === "SystemNotif" ? 'text-red-600' : ''}`} onClick={() => handlePageChange("SystemNotif")}>
                        <AiIcons_md.MdAssessment size={25} />
                        {isSidebarOpen && 'Logs'}
                    </button>
                    <button className="flex items-center gap-2 p-2 mt-auto hover:bg-red-200" onClick={LogoutFunc}>
                        <AiIcons_md.MdExitToApp size={25} />
                        {isSidebarOpen && 'Logout'}
                    </button>
                </div>

            </aside>

            {/* Main Content */}
            <div className="flex flex-col flex-grow">
                {/* Header */}
                <header className="flex items-center justify-between bg-white shadow px-4 py-3">
                    <div className="flex gap-1">
                        <AiIcons_md.MdHome size={25} />
                        <h1>{selectedPage}</h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        
                        <div className="relative">
                            <img onClick={handleProfileClick} src="./profile.jpg" className={`h-10 w-10 rounded-full cursor-pointer border-2 ${IsProfileDropdown ? 'border-blue-600' : 'border-transparent'}`} />
                            {IsProfileDropdown && (
                                <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-md z-10 text-sm">
                                    <ul className="py-2">
                                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center" onClick={() => setSelectedModal("ProfileSettings")}>
                                            <AiIcons_md.MdSettings size={16} className="mr-2" />
                                            Profile Settings
                                        </li>
                                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center" onClick={LogoutFunc}>
                                            <AiIcons_md.MdExitToApp size={16} className="mr-2" />
                                            Logout
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                        <p className="font-semibold hidden sm:block">Ann Lee</p>
                    </div>
                </header>

                {/* Body */}
               <main className="flex-grow p-4 overflow-y-auto">
                    {selectedPage === "Dashboard" && <Dashboard/>}
                    {selectedPage === "IncomingAlerts" && <IncomingAlerts />}
                    {selectedPage === "ManageUsers" && <ManageUsers />}
                    {selectedPage === "SystemNotif" && <SystemNotif />}
                </main>

            </div>

            {/* Modal */}
            {SelectedModal === 'ProfileSettings' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Settings onClose={CloseModal} />
                </div>
            )}
        </div>
    );
}
