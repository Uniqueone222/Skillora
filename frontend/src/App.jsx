import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import SiteLayout from "./components/SiteLayout.jsx";
import { Loading } from "./components/ui.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import CommunityPage from "./pages/CommunityPage.jsx";
import CoursePage from "./pages/CoursePage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import EducatorPage from "./pages/EducatorPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LearningPage from "./pages/LearningPage.jsx";
import MessagesPage from "./pages/MessagesPage.jsx";
import SkillPage from "./pages/SkillPage.jsx";
import EducatorProfilePage from "./pages/EducatorProfilePage.jsx";

function Guard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Restoring your session…" />;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <Loading label="Opening Skillora…" />;

  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="register" element={<AuthPage mode="register" />} />
        <Route path="skills/:slug" element={<SkillPage />} />
        <Route path="courses/:courseId" element={<CoursePage />} />
        <Route path="educators/:educatorId" element={<EducatorProfilePage />} />
        <Route path="dashboard" element={<Guard><DashboardPage /></Guard>} />
        <Route path="learn/:courseId" element={<Guard><LearningPage /></Guard>} />
        <Route path="educator" element={<Guard><EducatorPage /></Guard>} />
        <Route path="admin" element={<Guard><AdminPage /></Guard>} />
        <Route path="community" element={<Guard><CommunityPage /></Guard>} />
        <Route path="messages" element={<Guard><MessagesPage /></Guard>} />
        <Route path="*" element={<div className="container section"><h1>Page not found</h1><a className="button" href="/">Back to explore</a></div>} />
      </Route>
    </Routes>
  );
}
