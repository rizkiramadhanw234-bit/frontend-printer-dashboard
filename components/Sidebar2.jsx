"use client";

import { Home, Users, Settings, LogOut, Menu, Printer, ClipboardPlus, User } from "lucide-react";
import React from "react";

export default function Sidebar({ activeTab, setActiveTab }) {
    const [open, setOpen] = React.useState(true);

    const links = [
        { name: "Home", icon: <Home /> },
        { name: "Agents", icon: <Users /> },
        { name: "Printers", icon: <Printer /> },
        { name: "Reports", icon: <ClipboardPlus /> },
        { name: "Settings", icon: <Settings /> },
    ];

    return (
        <div
            className={`bg-white border-r border-gray-200 h-screen transition-all duration-300 ${open ? "w-64" : "w-16"
                }`}
        >
            <div className="flex flex-col h-full justify-between">
                <div>
                    {/* Toggle collapse */}
                    <button
                        onClick={() => setOpen(!open)}
                        className="flex items-center p-2 m-2 rounded hover:bg-gray-100"
                    >
                        <Menu />
                        {open && <span className="ml-2 font-semibold text-lg">MPS Newton</span>}
                    </button>

                    {/* Menu Links */}
                    <nav className="mt-5 flex flex-col gap-2">
                        {links.map((link) => {
                            const isActive = activeTab === link.name;
                            return (
                                <button
                                    key={link.name}
                                    onClick={() => setActiveTab(link.name)}
                                    className={`flex items-center p-2 rounded w-full text-left transition-colors duration-200
                    ${isActive ? "bg-blue-100 text-black font-semibold" : "hover:bg-gray-100"}
                  `}
                                >
                                    {link.icon}
                                    {open && <span className="ml-3">{link.name}</span>}
                                </button>
                            );
                        })}

                        {/* System Status */}
                        {open && (
                            <div className="mt-5 ml-3 mr-3 p-3 bg-gray-100 rounded-sm overflow-hidden">
                                <h1 className="font-semibold mb-2">System Status</h1>
                                <div className="flex flex-col items-start justify-center gap-2">
                                    <div className="flex items-center">
                                        <User className="mr-2" size={16} />
                                        <p className="text-sm">Agents: 10</p>
                                    </div>
                                    <div className="flex items-center">
                                        <Settings className="mr-2" size={16} />
                                        <p className="text-sm">Web Socket: Connected</p>
                                    </div>
                                    <div className="flex items-center">
                                        <Settings className="mr-2" size={16} />
                                        <p className="text-sm">Version: 1</p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </nav>
                </div>

                {/* Logout */}
                <div className="mb-5">
                    <button className="flex items-center p-2 hover:bg-gray-100 rounded w-full text-left">
                        <LogOut />
                        {open && <span className="ml-3">Logout</span>}
                    </button>
                </div>
            </div>
        </div>
    );
}
