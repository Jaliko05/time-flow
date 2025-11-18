import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";
import Activities from "./Activities";
import Projects from "./Projects";
import Settings from "./Settings";
import Admin from "./Admin";
import Login from "./Login";
import Register from "./Register";

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
