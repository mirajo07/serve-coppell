"use client";

import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    window.location.replace("/auth/logout?returnTo=/login");
  }, []);

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <h1 style={titleStyle}>Signing you out...</h1>
        <p style={textStyle}>Please wait while we securely log you out.</p>
      </section>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#d2dbe4",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const cardStyle = {
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "18px",
  padding: "36px",
  maxWidth: "460px",
  width: "90%",
  textAlign: "center",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const titleStyle = {
  color: "#111827",
  fontSize: "30px",
  marginTop: 0,
};

const textStyle = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.5",
};
