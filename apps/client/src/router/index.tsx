import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flex, Spinner } from "@chakra-ui/react";
import { fetchCurrentUser } from "../api/auth";
import { useAuth } from "../store/auth";
import { AppLayout } from "../layouts/AppLayout";
import { LoginPage } from "../pages/auth/LoginPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { CampaignListPage } from "../pages/campaigns/CampaignListPage";
import { CampaignDetailPage } from "../pages/campaigns/CampaignDetailPage";
import { ContactListsPage } from "../pages/contact-lists/ContactListsPage";
import { TemplatesPage } from "../pages/templates/TemplatesPage";
import { SettingsPage } from "../pages/settings/SettingsPage";

function LoadingScreen() {
  return (
    <Flex align="center" justify="center" h="100vh">
      <Spinner size="lg" />
    </Flex>
  );
}

function RequireAuth() {
  const { user, setUser } = useAuth();
  const location = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    enabled: !user
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser]);

  const currentUser = user ?? data;

  if (isLoading && !currentUser) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export function AppRouter() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route element={<RequireAuth />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/campaigns" element={<CampaignListPage />} />
        <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="/contact-lists" element={<ContactListsPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
