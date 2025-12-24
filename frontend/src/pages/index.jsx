import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";
import Activities from "./Activities";
import Projects from "./Projects";
import ProjectDetail from "./ProjectDetail";
import ProcessDetail from "./ProcessDetail";
import ProcessActivityDetail from "./ProcessActivityDetail";
import RequirementDetail from "./RequirementDetail";
import IncidentDetail from "./IncidentDetail";
import TaskDetail from "./TaskDetail";
import Requirements from "./Requirements";
import Incidents from "./Incidents";
import Settings from "./Settings";
import Admin from "./Admin";
import Login from "./Login";
import Register from "./Register";
import Calendar from "./Calendar";
import SuperAdminDashboard from "./SuperAdminDashboard";
import AdminDashboard from "./AdminDashboard";

import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const PAGES = {
  Dashboard: Dashboard,
  Activities: Activities,
  Projects: Projects,
  Settings: Settings,
  Admin: Admin,
  Calendar: Calendar,
};

function _getCurrentPage(url) {
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  let urlLastPart = url.split("/").pop();
  if (urlLastPart.includes("?")) {
    urlLastPart = urlLastPart.split("?")[0];
  }

  const pageName = Object.keys(PAGES).find(
    (page) => page.toLowerCase() === urlLastPart.toLowerCase()
  );
  return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout currentPageName={currentPage}>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/Dashboard"
        element={
          <ProtectedRoute>
            <Layout currentPageName={currentPage}>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/Activities"
        element={
          <ProtectedRoute>
            <Layout currentPageName={currentPage}>
              <Activities />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/Projects"
        element={
          <ProtectedRoute>
            <Layout currentPageName={currentPage}>
              <Projects />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/Projects/:id"
        element={
          <ProtectedRoute>
            <Layout currentPageName="Projects">
              <ProjectDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/Projects/:projectId/requirements"
        element={
          <ProtectedRoute>
            <Layout currentPageName="Projects">
              <Requirements />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/Projects/:projectId/incidents"
        element={
          <ProtectedRoute>
            <Layout currentPageName="Projects">
              <Incidents />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/process/:processId"
        element={
          <ProtectedRoute>
            <Layout currentPageName="Projects">
              <ProcessDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/process-activity/:activityId"
        element={
          <ProtectedRoute>
            <Layout currentPageName="Projects">
              <ProcessActivityDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/requirement/:requirementId"
        element={
          <ProtectedRoute>
            <Layout currentPageName="Projects">
              <RequirementDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/incident/:incidentId"
        element={
          <ProtectedRoute>
            <Layout currentPageName="Projects">
              <IncidentDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/task/:taskId"
        element={
          <ProtectedRoute>
            <Layout currentPageName="Projects">
              <TaskDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/Settings"
        element={
          <ProtectedRoute>
            <Layout currentPageName={currentPage}>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/Admin"
        element={
          <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
            <Layout currentPageName={currentPage}>
              <Admin />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/Calendar"
        element={
          <ProtectedRoute>
            <Layout currentPageName={currentPage}>
              <Calendar />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/auth/callback"
        element={<Navigate to="/Dashboard" replace />}
      />
    </Routes>
  );
}

export default function Pages() {
  return (
    <Router>
      <AuthProvider>
        <PagesContent />
      </AuthProvider>
    </Router>
  );
}
