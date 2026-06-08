"use client";

import { useEffect } from "react";

export default function StudentPage() {
  useEffect(() => {
    async function openStudentDashboard() {
      const authenticatedUser = await getAuthenticatedAppUser();

      if (!authenticatedUser) {
        window.location.href = "/login";
        return;
      }

      if (
        !authenticatedUser.role ||
        authenticatedUser.role.toLowerCase() !== "student"
      ) {
        window.location.href = "/teacher";
        return;
      }

      window.location.href = "/student/profile";
    }

    openStudentDashboard();
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
      } else if (
  email.endsWith("@coppellisd.com") || email === "mjatx07@gmail.com" || email === "mjatx07@gmail.com" ||
  email === "mjatx07@gmail.com"
) {
        role = "teacher";
        className = "Teacher Class";
      } else {
        window.location.replace("/auth/logout?returnTo=/unauthorized");
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

  return (
    <main style={pageStyle}>
      <p style={loadingTextStyle}>Opening your dashboard...</p>
    </main>
  );
}

const pageStyle = {
  fontFamily: "Roboto,Segoe UI, Arial",
  backgroundColor: "#f9fafb",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const loadingTextStyle = {
  color: "#374151",
  fontSize: "18px",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};
