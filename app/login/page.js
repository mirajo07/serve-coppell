"use client";

import { useState } from "react";

export default function LoginPage() {
  const [message, setMessage] = useState("");

  function signInWithGoogle() {
    setMessage("");

    window.location.href =
      "/auth/login?returnTo=%2Fauth-complete&connection=google-oauth2&prompt=login&max_age=0";
  }

  return (
    <main style={pageStyle}>
      <section style={loginCardStyle}>
        <h1 style={titleStyle}>Welcome to Vonnect</h1>

        <p style={subtitleStyle}>
          Sign in with your Coppell ISD Google account to track volunteer hours,
          join opportunities, and manage your service record.
        </p>

        <button style={googleButtonStyle} onClick={signInWithGoogle}>
          Sign in with Google
        </button>

        {message && <p style={messageStyle}>{message}</p>}

        <div style={infoBoxStyle}>
          <p style={infoTextStyle}>
            <strong>Students:</strong> Use your @g.coppellisd.com account.
          </p>

          <p style={infoTextStyle}>
            <strong>Teachers:</strong> Use your @coppellisd.com account.
          </p>

          <p style={helperTextStyle}>
            Other email domains will not be allowed to access Vonnect.
          </p>
        </div>
      </section>
    </main>
  );
}

const pageStyle = {
  fontFamily: "Roboto, Segoe UI, Arial",
  backgroundColor: "#d2dbe4",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "40px",
};

const loginCardStyle = {
  width: "100%",
  maxWidth: "460px",
  backgroundColor: "white",
  padding: "34px",
  borderRadius: "18px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const titleStyle = {
  color: "#111827",
  fontSize: "34px",
  marginTop: 0,
  textAlign: "center",
};

const subtitleStyle = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.5",
  textAlign: "center",
  marginBottom: "24px",
};

const googleButtonStyle = {
  width: "100%",
  padding: "14px",
  backgroundColor: "white",
  color: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "16px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
};

const infoBoxStyle = {
  marginTop: "24px",
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "12px",
  padding: "16px",
};

const infoTextStyle = {
  color: "#111827",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 8px",
};

const messageStyle = {
  color: "#b91c1c",
  fontWeight: 700,
  textAlign: "center",
  marginTop: "16px",
};

const helperTextStyle = {
  color: "#6b7280",
  fontSize: "13px",
  textAlign: "center",
  marginTop: "12px",
  marginBottom: 0,
};