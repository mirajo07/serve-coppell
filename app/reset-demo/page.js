"use client";

import { useState } from "react";

export default function ResetDemoPage() {
  const [message, setMessage] = useState("");

  function goToLogin() {
    window.location.href = "/login";
  }

  function goToHome() {
    window.location.href = "/";
  }

  function goToLogout() {
    window.location.href = "/logout";
  }

  return (
    <main style={pageStyle}>
      <section style={resetSectionStyle}>
        <div style={resetCardStyle}>
          <h1 style={titleStyle}>Reset Demo Data</h1>

          <p style={textStyle}>
            Demo localStorage data is no longer used. Vonnect now uses Google
            login for identity and Supabase for stored app data.
          </p>

          <div style={infoBoxStyle}>
            <p style={infoTextStyle}>
              <strong>Authentication:</strong> Auth0 / Google login
            </p>

            <p style={infoTextStyle}>
              <strong>Database:</strong> Supabase tables
            </p>

            <p style={infoTextStyle}>
              <strong>Attachments:</strong> Supabase Storage
            </p>
          </div>

          <p style={warningTextStyle}>
            This page does not delete Supabase data. To reset real app data,
            delete rows directly in Supabase Table Editor.
          </p>

          <button style={logoutButtonStyle} onClick={goToLogout}>
            Log Out
          </button>

          <button style={loginButtonStyle} onClick={goToLogin}>
            Go to Login
          </button>

          <button style={homeButtonStyle} onClick={goToHome}>
            Go Home
          </button>

          {message && <p style={messageStyle}>{message}</p>}
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
  marginBottom: "24px",
};

const infoBoxStyle = {
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "14px",
  padding: "18px",
  marginBottom: "22px",
  textAlign: "left",
};

const infoTextStyle = {
  color: "#111827",
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "8px 0",
};

const warningTextStyle = {
  color: "#92400e",
  backgroundColor: "#fffbeb",
  border: "1px solid #f59e0b",
  borderRadius: "12px",
  padding: "14px",
  fontSize: "15px",
  lineHeight: "1.5",
  marginBottom: "24px",
};

const logoutButtonStyle = {
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

const loginButtonStyle = {
  width: "100%",
  padding: "14px 24px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "16px",
  fontWeight: 700,
  cursor: "pointer",
  marginBottom: "14px",
};

const homeButtonStyle = {
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
