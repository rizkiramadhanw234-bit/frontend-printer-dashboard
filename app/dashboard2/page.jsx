"use client";

import React from "react";
import Sidebar from "../../components/Sidebar2";

export default function Dashboard2() {
    const [activeTab, setActiveTab] = React.useState("Home");

    const cardsData = [
        { title: "Total Agents", value: "150" },
        { title: "Total Printers", value: "150" },
        { title: "Printers Online", value: "100" },
        { title: "Printers Offline", value: "50" },
        { title: "Agents Offline", value: "50" },
    ];

    const tabContent = {
        Home: (
            <div>
                <h1 className="text-2xl font-bold mb-5">Home Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {cardsData.map((card, index) => (
                        <div key={index}>
                            <div className="p-4 bg-white rounded-lg shadow-md">
                                <div className="text-lg mb-3">{card.title}</div>
                                <div className="text-xl font-bold mt-2">{card.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Overview */}
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">Overview</h2>
                    <div className="bg-white grid grid-cols-2 gap-6 p-6 rounded-lg shadow-md h-100">
                        <div className="bg-gray-200 h-74 flex items-center justify-center rounded-lg">
                            <h1>Overview 1</h1>
                        </div>
                        <div className="bg-gray-200 h-74 flex items-center justify-center rounded-lg">
                            <h1>Overview 2</h1>
                        </div>
                    </div>
                </div>
            </div>
        ),

        Agents: (
            <div>
                <h1 className="text-2xl font-bold mb-5">List Agents</h1>
                <div className="bg-white p-6 rounded-lg shadow-md h-100 mb-4">
                    {/* Konten list agents */}
                    <div>
                        adada
                    </div>
                </div>

            </div>
        ),

        Printers: (
            <div>
                <h1 className="text-2xl font-bold mb-5">List Printers</h1>
                <div className="bg-white p-6 rounded-lg shadow-md h-100 mb-4">
                    {/* Konten list printers */}
                    <div>
                        adada
                    </div>
                </div>

            </div>
        ),  

        Reports: (
            <div>
                <h1 className="text-2xl font-bold mb-5">Reports</h1>
                <p>Ini bagian laporan dashboard.</p>
            </div>
        ),

        Settings: (
            <div>
                <h1 className="text-2xl font-bold mb-5">Settings</h1>
                <p>Ini bagian pengaturan dashboard.</p>
            </div>
        ),
    };

    return (
        <div className="flex min-h-screen bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {/* Sidebar */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Main content */}
            <div className="flex-1 p-5">

                {/* Render */}
                {tabContent[activeTab]}
            </div>
        </div>
    );
}
