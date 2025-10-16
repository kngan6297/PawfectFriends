import React, { memo } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export const MainLayout: React.FC = memo(() => {
  return (
    <div className="flex flex-col min-h-screen bg-blue-50">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
});
