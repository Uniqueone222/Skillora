import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { errorMessage } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { Notice } from "../components/ui.jsx";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={location.state?.from || "/dashboard"} replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const currentUser = isRegister
        ? await register({ name, email, password })
        : await login({ email, password });
      navigate(currentUser.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-aside">
        <span className="eyebrow">Your learning, your direction</span>
        <h1>{isRegister ? "Make room for something new." : "Welcome back to your next skill."}</h1>
        <p>One account for learning and teaching. Your next chapter starts here.</p>
        <div className="auth-aside-mark">s<span>.</span></div>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">{isRegister ? "Create your account" : "Your Skillora account"}</span>
        <h2>{isRegister ? "Let's get you started." : "Good to see you again."}</h2>
        <p>{isRegister ? "Create one account to learn and, whenever you like, teach." : "Sign in to continue learning or open your educator studio."}</p>
        {error && <Notice tone="error">{error}</Notice>}
        {isRegister && <label>Your name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" minLength="2" maxLength="80" required /></label>}
        <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isRegister ? "new-password" : "current-password"} minLength={isRegister ? 12 : 1} maxLength="128" required />{isRegister && <small>Use at least 12 characters.</small>}</label>
        <button className="button button-full" disabled={busy}>{busy ? "Please wait…" : isRegister ? "Create account" : "Log in"} <span>↗</span></button>
        <div className="auth-switch">{isRegister ? "Already have an account?" : "New to Skillora?"} <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create an account"}</Link></div>
      </form>
    </div>
  );
}
