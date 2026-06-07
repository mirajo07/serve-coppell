"use client";

import { useEffect, useState } from "react";

export default function FloatingProfileButton() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const authenticatedUser = await getAuthenticatedAppUser();
      setCurrentUser(authenticatedUser);
    }

    loadUser();
  }, []);

  async function getAuthenticatedAppUser() {
    try {
      const response = await fetch("/auth/profile", {
        cache: "no-store",
      });

      if (!response.ok) {
        return null;
      }

      const auth0User = await response.json();

      if (!auth0User || !auth0User.email) {
        return null;
      }

      const email = auth0User.email.toLowerCase().trim();

      let role = "";
      let className = "";

      if (email.endsWith("@g.coppellisd.com")) {
        role = "student";
        className = "Not assigned yet";
      } else if (email.endsWith("@coppellisd.com")) {
        role = "teacher";
        className = "Teacher Class";
      } else {
        return null;
      }

      const usernameFromEmail = email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      const displayName =
        auth0User.name ||
        auth0User.nickname ||
        auth0User.given_name ||
        usernameFromEmail;

      return {
        displayName,
        username: usernameFromEmail,
        email,
        className,
        role,
        avatar: "🙂",
        authProvider: "google",
      };
    } catch (error) {
      console.error("Error loading authenticated user:", error);
      return null;
    }
  }

  if (!currentUser) {
    return null;
  }

  const avatar = currentUser.avatar || "🙂";

  const profileLink =
    currentUser.role && currentUser.role.toLowerCase() === "student"
      ? "/student/profile"
      : "/teacher";

  return (
    <a href={profileLink} style={floatingButtonStyle}>
      <span style={avatarStyle}>{avatar}</span>
      <span style={nameStyle}>{currentUser.displayName}</span>
    </a>
  );
}

const floatingButtonStyle = {
  position: "fixed",
  top: "86px",
  right: "24px",
  zIndex: 9998,
  display: "flex",
  alignItems: "center",
  gap: "10px",
  backgroundColor: "white",
  color: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: "999px",
  padding: "8px 14px 8px 8px",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
  textDecoration: "none",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const avatarStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "999px",
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "22px",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const nameStyle = {
  fontSize: "14px",
  color: "#111827",
  fontFamily: "Roboto,Segoe UI, Arial",
};