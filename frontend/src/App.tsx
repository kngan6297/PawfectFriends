import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { MainLayout } from "./components/layouts/MainLayout";
import { AuthLayout } from "./components/layouts/AuthLayout";
import DashboardLayout from "./components/layouts/DashboardLayout";
import { ShelterDataProvider } from "./context/ShelterDataContext";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import Home from "@/pages/Home";
import PetList from "@/pages/pets/PetList";
import { PetDetailPage } from "./pages/pets/PetDetail";
import ShelterProfile from "@/pages/shelter/ShelterProfile";
import ShelterList from "@/pages/shelter/ShelterList";
import ShelterDashboard from "@/pages/shelter/Dashboard";
import ShelterSettings from "@/pages/shelter/Settings";
import ShelterPetManagement from "@/pages/shelter/PetManagement";
import ShelterAdoptionRequests from "@/pages/shelter/adoption/AdoptionRequests";
import AdoptionRequestDetailPage from "@/pages/shelter/adoption/AdoptionRequestDetailPage";
import ShelterReports from "@/pages/shelter/Reports";
import ShelterReviews from "@/pages/shelter/Reviews";
import ShelterScheduling from "@/pages/shelter/SchedulingPage";

import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import UserDetailsPage from "@/pages/admin/UserDetailsPage";
import EditUserPage from "@/pages/admin/EditUserPage";
import { EditApplicationPage } from "@/pages/user/adoption/EditApplicationPage";
import UserAdoptionRequestsPage from "@/pages/user/adoption/UserAdoptionRequestsList";
import UserAdoptionRequestDetailPage from "@/pages/user/adoption/UserAdoptionRequestDetail";
import Unauthorized from "@/pages/Unauthorized";

import DashboardProfilePage from "@/pages/dashboard/ProfilePage";
import { FavoritesPage } from "@/pages/favorites/FavoritesPage";
import { AboutPage } from "@/pages/AboutPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import AdoptionGuide from "@/pages/AdoptionGuide";
import PetCare from "@/pages/PetCare";
import SuccessStories from "@/pages/SuccessStories";
import Partnerships from "@/pages/Partnerships";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import AccessibilityPage from "@/pages/AccessibilityPage";
import CareersPage from "@/pages/CareersPage";
import ContactPage from "@/pages/ContactPage";
import { AiRecommendationsPage } from "@/pages/recommendations/AiRecommendationsPage";
import { WizardRecommendationsPage } from "@/pages/recommendations/WizardRecommendationsPage";
import { RecommendationsLandingPage } from "@/pages/recommendations/RecommendationsLandingPage";
import CreatePetForm from "@/pages/pets/CreatePetForm";
import CommunicationPage from "@/pages/CommunicationPage";

// Dashboard Layout Wrapper Component - Updated to use DashboardLayout directly
const DashboardLayoutWrapper: React.FC = () => {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

// Shelter Layout Wrapper Component - Updated to use DashboardLayout directly
const ShelterLayoutWrapper: React.FC = () => {
  return (
    <ShelterDataProvider>
      <DashboardLayout role="shelter">
        <Outlet />
      </DashboardLayout>
    </ShelterDataProvider>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Public Routes - Only accessible to unauthenticated users and regular users */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/pets" element={<PetList />} />
        <Route path="/pets/:petId" element={<PetDetailPage />} />
        <Route path="/shelters" element={<ShelterList />} />
        <Route path="/shelters/:shelterId" element={<ShelterProfile />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/adoption-guide" element={<AdoptionGuide />} />
        <Route path="/pet-care" element={<PetCare />} />
        <Route path="/success-stories" element={<SuccessStories />} />
        <Route path="/partnerships" element={<Partnerships />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* User-only Routes - Regular users can access these */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="user">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute requiredRole="user">
              <DashboardProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/favorites"
          element={
            <ProtectedRoute requiredRole="user">
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-application/:requestId"
          element={
            <ProtectedRoute requiredRole="user">
              <EditApplicationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adoptions"
          element={
            <ProtectedRoute requiredRole="user">
              <UserAdoptionRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adoptions/:requestId"
          element={
            <ProtectedRoute requiredRole="user">
              <UserAdoptionRequestDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendations"
          element={<RecommendationsLandingPage />}
        />
        <Route path="/recommendations/ai" element={<AiRecommendationsPage />} />
        <Route
          path="/recommendations/wizard"
          element={<WizardRecommendationsPage />}
        />

        {/* Communication Route - User Dashboard */}
        <Route
          path="/communication"
          element={
            <ProtectedRoute allowedRoles={["user", "shelter", "admin"]}>
              <CommunicationPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Shelter Routes - New organized structure with sidebar navigation */}
      <Route element={<ShelterLayoutWrapper />}>
        <Route
          path="/shelter"
          element={
            <ProtectedRoute requiredRole="shelter">
              <ShelterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shelter/dashboard"
          element={
            <ProtectedRoute requiredRole="shelter">
              <ShelterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shelter/pets"
          element={
            <ProtectedRoute requiredRole="shelter">
              <ShelterPetManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shelter/pets/archived"
          element={
            <ProtectedRoute requiredRole="shelter">
              <ShelterPetManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shelter/adoption-requests"
          element={
            <ProtectedRoute requiredRole="shelter">
              <ShelterAdoptionRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shelter/adoption-requests/:requestId"
          element={
            <ProtectedRoute requiredRole="shelter">
              <AdoptionRequestDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shelter/scheduling"
          element={
            <ProtectedRoute requiredRole="shelter">
              <ShelterScheduling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shelter/reports"
          element={
            <ProtectedRoute requiredRole="shelter">
              <ShelterReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shelter/reviews"
          element={
            <ProtectedRoute requiredRole="shelter">
              <ShelterReviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shelter/settings"
          element={
            <ProtectedRoute requiredRole="shelter">
              <ShelterSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shelter/pets/create"
          element={
            <ProtectedRoute requiredRole="shelter">
              <CreatePetForm />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Dashboard Routes - Admin users get dashboard-only access */}
      <Route element={<DashboardLayoutWrapper />}>
        {/* Admin-only Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:userId"
          element={
            <ProtectedRoute requiredRole="admin">
              <UserDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:userId/edit"
          element={
            <ProtectedRoute requiredRole="admin">
              <EditUserPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Communication Route */}
      <Route path="/communication" element={<CommunicationPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
