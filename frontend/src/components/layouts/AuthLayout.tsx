import React, { useState, useEffect, memo } from "react";
import { Outlet } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { Link } from "react-router-dom";

// Simplified background elements component
const BackgroundElements = memo(() => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* Single background shape for mobile */}
      {isMobile ? (
        <div className="absolute top-1/4 right-1/4 opacity-10">
          <PawPrint className="w-32 h-32 text-primary-200" />
        </div>
      ) : (
        /* Desktop: 2 shapes maximum */
        <>
          <div className="absolute bottom-[-10%] right-[-8%] opacity-5 hidden lg:block">
            <PawPrint className="w-96 h-96 text-primary-200" />
          </div>
          <div className="absolute top-[-8%] left-[-6%] opacity-6 hidden md:block">
            <PawPrint className="w-80 h-80 text-accent-purple-200" />
          </div>
        </>
      )}
    </div>
  );
});

BackgroundElements.displayName = "BackgroundElements";

// Background overlay component
const BackgroundOverlay = memo(() => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${
        isMobile
          ? "bg-gradient-to-tl from-white/20 via-transparent to-pink-100/10"
          : "bg-gradient-to-tl from-white/30 via-transparent to-pink-100/20"
      }`}
    />
  );
});

BackgroundOverlay.displayName = "BackgroundOverlay";

// Logo component
const Logo = memo(() => (
  <Link to="/" className="flex justify-center items-center gap-2 group mb-2">
    <PawPrint className="h-10 w-10 sm:h-12 sm:w-12 text-primary-500 group-hover:scale-105 transition-transform duration-200" />
    <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-primary-600 to-fuchsia-400 text-transparent bg-clip-text">
      PawfectFriends
    </span>
  </Link>
));

Logo.displayName = "Logo";

// Tagline component
const Tagline = memo(() => (
  <p
    className="mt-0 text-center italic text-xs sm:text-sm text-[#B2A4FF] font-serif"
    style={{ transform: "rotate(-2deg)" }}
  >
    Connecting loving homes with pets in need
  </p>
));

Tagline.displayName = "Tagline";

// Header component (no mascot)
const Header = memo(() => (
  <div className="relative z-10 w-full sm:mx-auto sm:max-w-lg">
    <Logo />
    <Tagline />
  </div>
));

Header.displayName = "Header";

// Content container component
const ContentContainer = memo(() => (
  <div className="relative z-10 mt-8 w-full sm:mx-auto sm:max-w-lg">
    <div className="shadow-lg backdrop-blur-sm bg-white/75 border border-white/20 rounded-2xl px-4 sm:px-6 py-8 sm:py-10 transition-all duration-200 hover:shadow-xl">
      <Outlet />
    </div>
  </div>
));

ContentContainer.displayName = "ContentContainer";

// Main AuthLayout component
export const AuthLayout: React.FC = memo(() => {
  return (
    <div className="relative min-h-screen flex flex-col justify-center py-14 px-6 bg-gradient-to-tl from-primary-50 via-pink-50 to-purple-50 overflow-hidden">
      <BackgroundElements />
      <BackgroundOverlay />
      <Header />
      <ContentContainer />
    </div>
  );
});

AuthLayout.displayName = "AuthLayout";

export default AuthLayout;
