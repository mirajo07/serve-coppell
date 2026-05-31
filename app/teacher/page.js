"use client";

import { useEffect, useState } from "react";

export default function TeacherPage() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!savedUser) {
      window.location.href = "/login";
      return;
    }

    if (savedUser.role.toLowerCase() !== "teacher") {
      window.location.href = "/student";
      return;
    }

    setCurrentUser(savedUser);
  }, []);

  function logout() {
    localStorage.removeItem("currentUser");
    window.dispatchEvent(new Event("storage"));
    window.location.href = "/login";
  }

  if (!currentUser) {
    return null;
  }

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <h1 style={titleStyle}>Teacher Dashboard</h1>

        <p style={subtitleStyle}>
          Welcome, {currentUser.displayName}. 
        </p>

        <p style={userInfoStyle}>
          Username: {currentUser.username} | Class: {currentUser.className}
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
  fontFamily: "Arial, sans-serif",
  backgroundColor: "#f9fafb",
  minHeight: "100vh",
   fontFamily: "Roboto,Segoe UI, Arial",

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