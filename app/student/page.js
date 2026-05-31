"use client";

import { useEffect } from "react";

export default function StudentPage() {
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!savedUser) {
      window.location.href = "/login";
      return;
    }

    if (savedUser.role.toLowerCase() !== "student") {
      window.location.href = "/teacher";
      return;
    }

    window.location.href = "/student/profile";
  }, []);

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