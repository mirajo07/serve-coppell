"use client";

import { useEffect } from "react";

export default function AuthCompletePage() {
  useEffect(() => {
    async function finishLogin() {
      try {
        localStorage.removeItem("manualLogout");

        const response = await fetch("/auth/profile", {
          cache: "no-store",
        });

        if (!response.ok) {
          window.location.href = "/login";
          return;
        }

        const auth0User = await response.json();

        if (!auth0User || !auth0User.email) {
          window.location.href = "/login";
          return;
        }

        const users = JSON.parse(localStorage.getItem("users")) || [];

        const usernameFromEmail = auth0User.email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

        const existingUser = users.find((user) => {
          return (
            user.email === auth0User.email ||
            user.username === usernameFromEmail
          );
        });

        let appUser;

        if (existingUser) {
          appUser = existingUser;
        } else {
          appUser = {
            displayName: auth0User.name || usernameFromEmail,
            username: usernameFromEmail,
            email: auth0User.email,
            className: "Google Login",
            password: "",
            role: "student",
            avatar: "🙂",
            authProvider: "google",
            createdAt: new Date().toLocaleString(),
          };

          localStorage.setItem("users", JSON.stringify([...users, appUser]));
        }

        localStorage.setItem("currentUser", JSON.stringify(appUser));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("authChanged"));

        window.location.replace("/student/profile");
      } catch (error) {
        console.log(error);
        window.location.href = "/login";
      }
    }

    finishLogin();
  }, []);

  return (
    <main style={pageStyle}>
      <h1>Signing you in...</h1>
      <p>Please wait while we open your dashboard.</p>
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