"use client";

import { useEffect, useState } from "react";

export default function FloatingProfileButton() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    function loadUser() {
      const savedUser = JSON.parse(localStorage.getItem("currentUser"));
      setCurrentUser(savedUser);
    }

    loadUser();

    window.addEventListener("storage", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  if (!currentUser) {
    return null;
  }

  const avatar = currentUser.avatar || "🙂";

  const profileLink =
    currentUser.role && currentUser.role.toLowerCase() === "student"
      ? "/student/profile"
      : "/teacher";

  return (
    <a href={profileLink} style={floatingButtonStyle}>
      <span style={avatarStyle}>{avatar}</span>
      <span style={nameStyle}>{currentUser.displayName}</span>
    </a>
  );
}

const floatingButtonStyle = {
  position: "fixed",
  top: "86px",
  right: "24px",
  zIndex: 9998,
  display: "flex",
  alignItems: "center",
  gap: "10px",
  backgroundColor: "white",
  color: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: "999px",
  padding: "8px 14px 8px 8px",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
  textDecoration: "none",
  fontWeight: 700,
   fontFamily: "Roboto,Segoe UI, Arial",

};

const avatarStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "999px",
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "22px",
   fontFamily: "Roboto,Segoe UI, Arial",

};

const nameStyle = {
  fontSize: "14px",
  color: "#111827",
   fontFamily: "Roboto,Segoe UI, Arial",
  
};