"use client";

import { useState } from "react";

export default function ResetDemoPage() {
  const [message, setMessage] = useState("");

  function resetDemoData() {
    localStorage.removeItem("teacherOpportunities");
    localStorage.removeItem("volunteerSignups");
    localStorage.removeItem("volunteerHours");
    localStorage.removeItem("users");
    localStorage.removeItem("currentUser");

    setMessage("All demo data and mock accounts have been reset.");
  }

  function resetEverything() {
    localStorage.clear();
    setMessage("Everything in localStorage has been cleared.");
  }

  return (
    <main style={pageStyle}>
      <section style={resetSectionStyle}>
        <div style={resetCardStyle}>
          <h1 style={titleStyle}>Reset Demo Data</h1>

          <p style={textStyle}>
            Use this page while testing. It can clear volunteer data, signups,
            teacher opportunities, and mock accounts.
          </p>

          <button style={resetButtonStyle} onClick={resetDemoData}>
            Reset Demo Data and Accounts
          </button>

          <button style={clearAllButtonStyle} onClick={resetEverything}>
            Clear Everything
          </button>

          {message && <p style={messageStyle}>{message}</p>}

          <a href="/login" style={linkStyle}>
            Go back to Login
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

const resetSectionStyle = {
  display: "flex",
  justifyContent: "center",
  padding: "80px 40px",
};

const resetCardStyle = {
  width: "100%",
  maxWidth: "600px",
  backgroundColor: "white",
  padding: "40px",
  borderRadius: "18px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
  textAlign: "center",
};

const titleStyle = {
  fontSize: "36px",
  color: "#111827",
  marginBottom: "16px",
};

const textStyle = {
  color: "#374151",
  fontSize: "17px",
  lineHeight: "1.6",
  marginBottom: "28px",
};

const resetButtonStyle = {
  width: "100%",
  padding: "14px 24px",
  backgroundColor: "#b91c1c",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "16px",
  fontWeight: 700,
  cursor: "pointer",
  marginBottom: "14px",
};

const clearAllButtonStyle = {
  width: "100%",
  padding: "14px 24px",
  backgroundColor: "#111827",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "16px",
  fontWeight: 700,
  cursor: "pointer",
};

const messageStyle = {
  marginTop: "24px",
  color: "#047857",
  fontWeight: 700,
};

const linkStyle = {
  display: "inline-block",
  marginTop: "24px",
  color: "#2563eb",
  fontWeight: 700,
  textDecoration: "none",
};