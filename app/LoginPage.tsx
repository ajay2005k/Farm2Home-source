"use client";

import { useEffect, useState } from "react";
import {
  HARDCODED_CREDENTIALS,
  clearStoredUser,
  getStoredUser,
  storeUser,
  validateCredentials,
} from "../services/authService";
import type { AuthUser } from "../types";

type LoginPageProps = {
  onLoginSuccess?: (user: AuthUser) => void;
  onExit?: () => void;
  notify?: (msg: string) => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onSelectRoleView?: (role: "admin" | "farmer" | "customer") => void;
};

export default function LoginPage({
  onLoginSuccess,
  onExit,
  notify,
  currentUser,
  onLogout,
  onSelectRoleView,
}: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeUser, setActiveUser] = useState<AuthUser | null>(
    () => currentUser ?? getStoredUser()
  );

  useEffect(() => {
    if (currentUser !== undefined) {
      queueMicrotask(() => {
        setActiveUser(currentUser ?? null);
      });
    }
  }, [currentUser]);


  const handleFillDemo = () => {
    setUsername(HARDCODED_CREDENTIALS.username);
    setPassword(HARDCODED_CREDENTIALS.password);
    setError("");
  };

  const handleBack = () => {
    if (onExit) {
      onExit();
    } else if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validate using the hardcoded credentials
    const result = validateCredentials(username, password);

    setTimeout(() => {
      setIsLoading(false);
      if (!result.success) {
        setError(result.error);
        return;
      }

      if (rememberMe) {
        storeUser(result.user);
      }
      setActiveUser(result.user);
      setSuccess(`Login successful! Welcome back, ${result.user.name}.`);

      if (notify) {
        notify(`Welcome back, ${result.user.name}!`);
      }

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        } else if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      }, 500);
    }, 350);
  };

  const handleSignOut = () => {
    clearStoredUser();
    setActiveUser(null);
    setUsername("");
    setPassword("");
    setSuccess("");
    setError("");
    if (onLogout) {
      onLogout();
    }
    if (notify) {
      notify("Signed out successfully.");
    }
  };

  return (
    <div className="login-page">
      <header className="login-topbar">
        <button
          type="button"
          className="brand"
          onClick={handleBack}
          aria-label="Farm2Home home"
        >
          <span className="brand-mark">
            <span>⌂</span>
          </span>
          <span>
            Farm<span>2</span>Home
          </span>
        </button>

        <div className="login-topbar-right">
          <button
            type="button"
            className="login-back-btn"
            onClick={handleBack}
            aria-label="Back to marketplace"
          >
            ← Back to Marketplace
          </button>
        </div>
      </header>

      <main className="login-main">
        {activeUser ? (
          <section className="already-logged-card">
            <div className="logged-user-avatar">
              {activeUser.avatarInitials}
            </div>
            <h2>Logged in as {activeUser.name}</h2>
            <p>{activeUser.email}</p>
            <span className="logged-role-badge">
              ● Verified {activeUser.role.toUpperCase()}
            </span>

            <div className="logged-actions">
              <button
                type="button"
                className="primary"
                onClick={handleBack}
              >
                Go to Marketplace ↗
              </button>

              {onSelectRoleView && (
                <>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => onSelectRoleView("admin")}
                  >
                    ◇ Open Admin Command Center
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => onSelectRoleView("farmer")}
                  >
                    ♧ Open Farmer Portal
                  </button>
                </>
              )}

              <button
                type="button"
                className="logout-alt"
                onClick={handleSignOut}
              >
                Log Out of Account
              </button>
            </div>
          </section>
        ) : (
          <div className="login-layout">
            <section className="login-card">
              <span className="login-badge">
                🌱 Direct Farm-to-Consumer Network
              </span>
              <h1 className="login-title">Sign in to Farm2Home</h1>
              <p className="login-desc">
                Access regional farm cluster management, multi-source orders,
                and transparent grower payouts.
              </p>

              {/* Hardcoded Demo Credentials Box */}
              <div className="demo-cred-banner">
                <div className="demo-cred-header">
                  <div className="demo-cred-title">
                    <span>⚡</span> Hardcoded Credentials
                  </div>
                  <button
                    type="button"
                    className="autofill-btn"
                    onClick={handleFillDemo}
                    title="Click to fill credentials into the form"
                  >
                    Autofill Demo Login ⚡
                  </button>
                </div>
                <div className="demo-cred-grid">
                  <div className="demo-cred-item">
                    <span>Username</span>
                    <code>{HARDCODED_CREDENTIALS.username}</code>
                  </div>
                  <div className="demo-cred-item">
                    <span>Password</span>
                    <code>{HARDCODED_CREDENTIALS.password}</code>
                  </div>
                </div>
              </div>

              {error && (
                <div className="login-alert error" role="alert">
                  <span>⚠️</span>
                  <div>{error}</div>
                </div>
              )}

              {success && (
                <div className="login-alert success" role="status">
                  <span>✓</span>
                  <div>{success}</div>
                </div>
              )}

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="login-username">
                    Username or Email <span style={{ color: "#d14b4b" }}>*</span>
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>
                    <input
                      id="login-username"
                      type="text"
                      autoComplete="username"
                      placeholder="e.g. admin or admin@farm2home.com"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (error) setError("");
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="login-password">
                    Password <span style={{ color: "#d14b4b" }}>*</span>
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter password (farm2home123)"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-pw-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="login-options">
                  <label className="remember-me">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember this session</span>
                  </label>
                  <button
                    type="button"
                    style={{
                      border: 0,
                      background: "none",
                      color: "#35774a",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                    onClick={handleFillDemo}
                  >
                    Need credentials?
                  </button>
                </div>

                <button
                  type="submit"
                  className="login-btn"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In to Account →"}
                </button>
              </form>
            </section>

            <aside className="login-side-panel">
              <div className="side-panel-header">
                <span className="side-panel-badge">
                  ● 100% Financial Provenance
                </span>
                <h2 className="side-panel-title">
                  Direct connection between farm clusters and community tables.
                </h2>
                <p className="side-panel-desc">
                  Farm2Home removes exploitative brokerage chains. Every rupee
                  is tracked from the harvest lot to the final doorstep.
                </p>

                <div className="side-metrics">
                  <div className="side-metric-item">
                    <div>
                      <span>Direct Farmer Share</span>
                      <b>71.2% Payout</b>
                    </div>
                    <small>vs 29% mandi</small>
                  </div>
                  <div className="side-metric-item">
                    <div>
                      <span>Regional Hubs</span>
                      <b>6 Active Clusters</b>
                    </div>
                    <small>Solar cold chain</small>
                  </div>
                  <div className="side-metric-item">
                    <div>
                      <span>Payment Speed</span>
                      <b>Same-Day Payout</b>
                    </div>
                    <small>Zero credit delay</small>
                  </div>
                </div>
              </div>

              <div className="side-quote">
                <p>
                  “On Farm2Home our cluster pools solar cold storage and trucks.
                  Consumers pay less, and our family earns almost double.”
                </p>
                <span>— Rajesh Kumar · Chengalpattu Hub #4</span>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
