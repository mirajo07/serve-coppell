"use client";

import { useEffect } from "react";

export default function AuthCompletePage() {
  useEffect(() => {
    async function finishLogin() {
      try {
        const response = await fetch("/auth/profile", {
          cache: "no-store",
        });

        if (!response.ok) {
          window.location.replace("/login");
          return;
        }

        const auth0User = await response.json();

        if (!auth0User || !auth0User.email) {
          window.location.replace("/login");
          return;
        }

        const email = auth0User.email.toLowerCase().trim();

        if (email.endsWith("@g.coppellisd.com")) {
          window.location.replace("/student/profile");
          return;
        }

        if (email.endsWith("@coppellisd.com")) {
          window.location.replace("/teacher");
          return;
        }

        window.location.replace("/auth/logout?returnTo=/unauthorized");
      } catch (error) {
        console.error("Auth complete error:", error);
        window.location.replace("/login");
      }
    }

    finishLogin();
  }, []);

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <h1 style={titleStyle}>Signing you in...</h1>
        <p style={textStyle}>Please wait while we open your Vonnect dashboard.</p>
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