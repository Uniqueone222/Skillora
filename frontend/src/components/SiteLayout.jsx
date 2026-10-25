import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function SiteLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await logout();
    navigate("/");
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <Link className="brand" to="/"><span className="brand-icon">s</span>skillora<span className="brand-dot">.</span></Link>
        <nav className="main-nav">
          <Link to="/">Explore</Link>
          {user && <Link to="/dashboard">My learning</Link>}
          {user?.capabilities.includes("educator") && <Link to="/educator">Educator studio</Link>}
          {user?.role === "admin" && <Link to="/admin">Admin</Link>}
        </nav>
        <div className="account-nav">
          {user ? (
            <>
              <Link className="user-chip" to="/dashboard"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><span>{user.name.split(" ")[0]}</span></Link>
              <button className="button button-quiet button-small" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <>
              <Link className="login-link" to="/login">Log in</Link>
              <Link className="button button-small" to="/register">Get started <span>↗</span></Link>
            </>
          )}
        </div>
      </header>
      <main className="main-content"><Outlet /></main>
      <footer className="footer"><Link className="brand brand-footer" to="/"><span className="brand-icon">s</span>skillora<span className="brand-dot">.</span></Link><span>Start with the skill you want to learn.</span><span>© {new Date().getFullYear()} Skillora</span></footer>
    </div>
  );
}
