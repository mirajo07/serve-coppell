"use client";

import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    localStorage.removeItem("currentUser");
    localStorage.setItem("manualLogout", "true");

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("authChanged"));

    window.location.replace("/auth/logout?returnTo=/login");
  }, []);

  return (
    <main style={pageStyle}>
      <h1>Signing you out...</h1>
      <p>Please wait.</p>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "Roboto, Segoe UI, Arial",
};