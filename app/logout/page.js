"use client";

import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      const loginUrl = `${window.location.origin}/login`;
      const encodedLoginUrl = encodeURIComponent(loginUrl);

      window.location.replace(`/auth/logout?returnTo=${encodedLoginUrl}`);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <div style={iconStyle}>👋</div>

        <h1 style={titleStyle}>Signing you out...</h1>

        <p style={textStyle}>
          Please wait while Vonnect securely signs you out.
        </p>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  backgroundColor: "#f9fafb",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const cardStyle = {
  backgroundColor: "white",
  padding: "42px",
  borderRadius: "18px",
  border: "1px solid #d1d5db",
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  textAlign: "center",
  maxWidth: "420px",
  width: "90%",
};

const iconStyle = {
  fontSize: "52px",
  marginBottom: "18px",
};

const titleStyle = {
  color: "#111827",
  fontSize: "30px",
  marginBottom: "12px",
};

const textStyle = {
  color: "#374151",
  fontSize: "17px",
  lineHeight: "1.5",
};