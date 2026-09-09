import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    const [sidebarHidden, setSidebarHidden] = useState(false);

    const toggleSidebar = () => setSidebarHidden((hidden) => !hidden);

    return (
        <div className="bg-gray-50 text-gray-800 h-screen flex overflow-hidden">
            <Sidebar hidden={sidebarHidden} onToggle={toggleSidebar} />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
}
