"use client";

import { useEffect, useState } from "react";
import AppMailbox from "@/app/components/AppMailbox";

export default function AppNav() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const response = await fetch("/auth/profile", {
          cache: "no-store",
        });

        if (!response.ok) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        const auth0User = await response.json();

        if (!auth0User || !auth0User.email) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        const email = auth0User.email.toLowerCase().trim();

        let role = "";

        if (email.endsWith("@g.coppellisd.com")) {
          role = "student";
        } else if (
          email.endsWith("@coppellisd.com") ||
          email === "mjatx07@gmail.com"
        ) {
          role = "teacher";
        } else {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        const username = email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

        const displayName =
          auth0User.name ||
          auth0User.nickname ||
          auth0User.given_name ||
          username;

        setCurrentUser({
          displayName,
          username,
          email,
          role,
          avatar: "🙂",
        });

        setLoading(false);
      } catch (error) {
        console.error("Error loading AppNav user:", error);
        setCurrentUser(null);
        setLoading(false);
      }
    }

    loadCurrentUser();
  }, []);

  function logout() {
    window.location.href = "/logout";
  }

  const logo = (
    <a href="/" style={logoLinkStyle}>
      <img src="/logo.png" alt="Vonnected" style={logoImageStyle} />
    </a>
  );

  if (loading) {
    return (
      <nav className="global-app-nav" style={navStyle}>
        {logo}
      </nav>
    );
  }

  if (!currentUser) {
    return (
      <nav className="global-app-nav" style={navStyle}>
        {logo}

        <div style={navLinksStyle}>
          <a href="/" style={linkStyle}>
            Home
          </a>

          <a href="/about" style={linkStyle}>
            About
          </a>

          <a href="/login" style={buttonLinkStyle}>
            Login
          </a>
        </div>
      </nav>
    );
  }

  if (currentUser.role && currentUser.role.toLowerCase() === "student") {
    const avatar = currentUser.avatar || "🙂";

    return (
      <nav className="global-app-nav" style={navStyle}>
        {logo}

        <div style={navLinksStyle}>
          <a href="/" style={linkStyle}>
            Home
          </a>

          <a href="/opportunities" style={linkStyle}>
            Opportunities
          </a>

          <a href="/track-hours" style={linkStyle}>
            Track Hours
          </a>

          <a href="/leaderboard" style={linkStyle}>
            Leaderboard
          </a>

          <a href="/about" style={linkStyle}>
            About
          </a>

          <a href="/student/profile" style={profileLinkStyle}>
            <span style={avatarStyle}>{avatar}</span>
            Dashboard
          </a>

          <AppMailbox />

          <button style={logoutButtonStyle} onClick={logout}>
            Logout
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="global-app-nav" style={navStyle}>
      {logo}

      <div style={navLinksStyle}>
        <a href="/" style={linkStyle}>
          Home
        </a>

        <a href="/teacher" style={linkStyle}>
          Teacher Dashboard
        </a>

        <a href="/teacher/add-opportunity" style={linkStyle}>
          Add Opportunity
        </a>

        <a href="/teacher/signups" style={linkStyle}>
          Review Signups
        </a>

        <a href="/teacher/class" style={linkStyle}>
          Class
        </a>

        <a href="/opportunities" style={linkStyle}>
          Opportunities
        </a>

        <a href="/leaderboard" style={linkStyle}>
          Leaderboard
        </a>

        <a href="/about" style={linkStyle}>
          About
        </a>

        <AppMailbox />

        <button style={logoutButtonStyle} onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

const navStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 32px",
  backgroundColor: "white",
  borderBottom: "1px solid #e5e7eb",
  position: "sticky",
  top: 0,
  zIndex: 9999,
  minHeight: "74px",
};

const logoLinkStyle = {
  display: "flex",
  alignItems: "center",
  textDecoration: "none",
};

const logoImageStyle = {
  height: "54px",
  width: "auto",
  display: "block",
  objectFit: "contain",
};

const navLinksStyle = {
  display: "flex",
  gap: "20px",
  alignItems: "center",
  flexWrap: "wrap",
};

const linkStyle = {
  color: "#374151",
  fontSize: "16px",
  cursor: "pointer",
  textDecoration: "none",
  fontWeight: 700,
  fontFamily: "Arial, sans-serif",
};

const buttonLinkStyle = {
  color: "white",
  backgroundColor: "#2563eb",
  padding: "9px 14px",
  borderRadius: "8px",
  fontSize: "16px",
  cursor: "pointer",
  textDecoration: "none",
  fontWeight: 700,
  fontFamily: "Arial, sans-serif",
};

const profileLinkStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#2563eb",
  fontSize: "16px",
  cursor: "pointer",
  textDecoration: "none",
  fontWeight: 800,
  fontFamily: "Arial, sans-serif",
};

const avatarStyle = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "20px",
};

const logoutButtonStyle = {
  color: "white",
  backgroundColor: "#b91c1c",
  padding: "9px 14px",
  borderRadius: "8px",
  fontSize: "16px",
  cursor: "pointer",
  border: "none",
  fontWeight: 700,
  fontFamily: "Arial, sans-serif",
};