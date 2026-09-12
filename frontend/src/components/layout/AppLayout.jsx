import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Header */}
      <Topbar />

      {/* Main Workspace with Left Sidebar */}
      <div className="flex flex-1 relative">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Content Outlet */}
        <main
          className={`flex-1 transition-all duration-300 ${
            collapsed ? "ml-16" : "ml-60"
          } p-6 overflow-x-hidden min-h-[calc(100vh-3.5rem)]`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
