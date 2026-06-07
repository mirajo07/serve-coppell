"use client";

import { useEffect, useState } from "react";

export default function TeacherPage() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function loadTeacher() {
      const authenticatedUser = await getAuthenticatedAppUser();

      if (!authenticatedUser) {
        window.location.href = "/login";
        return;
      }

      if (
        !authenticatedUser.role ||
        authenticatedUser.role.toLowerCase() !== "teacher"
      ) {
        window.location.href = "/student/profile";
        return;
      }

      setCurrentUser(authenticatedUser);
    }

    loadTeacher();
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

  function logout() {
    window.location.href = "/logout";
  }

  if (!currentUser) {
    return null;
  }

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <h1 style={titleStyle}>Teacher Dashboard</h1>

        <p style={subtitleStyle}>Welcome, {currentUser.displayName}.</p>

        <p style={userInfoStyle}>
          Username: {currentUser.username} | Role: {currentUser.role}
        </p>

        <button style={logoutButtonStyle} onClick={logout}>
          Logout
        </button>
      </section>

      <section style={cardsSectionStyle}>
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Upload Opportunities</h2>

          <p style={cardTextStyle}>
            Add new volunteer activities for your students.
          </p>

          <a href="/teacher/add-opportunity">
            <button style={buttonStyle}>Add Opportunity</button>
          </a>
        </div>

        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Review Signups</h2>

          <p style={cardTextStyle}>
            Approve students to volunteer, move events to needs signature, and
            sign off after completion.
          </p>

          <a href="/teacher/signups">
            <button style={buttonStyle}>Review Signups</button>
          </a>
        </div>

        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Manage Class</h2>

          <p style={cardTextStyle}>
            Add or remove students from your class and view student hours,
            signups, and tracked activities.
          </p>

          <a href="/teacher/class">
            <button style={buttonStyle}>View Class</button>
          </a>
        </div>

        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Class Leaderboard</h2>

          <p style={cardTextStyle}>
            View rankings based on completed volunteer hours.
          </p>

          <a href="/leaderboard">
            <button style={buttonStyle}>Open Leaderboard</button>
          </a>
        </div>
      </section>
    </main>
  );
}

const pageStyle = {
  fontFamily: "Roboto,Segoe UI, Arial",
  backgroundColor: "#f9fafb",
  minHeight: "100vh",
};

const headerStyle = {
  padding: "70px 40px",
  textAlign: "center",
  backgroundColor: "#c7ebfa",
};

const titleStyle = {
  fontSize: "42px",
  color: "#111827",
  marginBottom: "16px",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const subtitleStyle = {
  fontSize: "18px",
  color: "#374151",
  maxWidth: "820px",
  margin: "0 auto",
  lineHeight: "1.6",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const userInfoStyle = {
  marginTop: "16px",
  color: "#000000",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const logoutButtonStyle = {
  marginTop: "22px",
  padding: "12px 22px",
  backgroundColor: "#b91c1c",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "16px",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const cardsSectionStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "24px",
  padding: "50px 40px",
};

const cardStyle = {
  backgroundColor: "white",
  padding: "30px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
  minHeight: "210px",
};

const cardTitleStyle = {
  color: "#000000",
};

const cardTextStyle = {
  color: "#374151",
  lineHeight: "1.5",
};

const buttonStyle = {
  marginTop: "16px",
  padding: "10px 18px",
  backgroundColor: "blue",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  fontFamily: "Roboto,Segoe UI, Arial",
};