"use client";

import { useEffect } from "react";

export default function Auth0Sync() {
  useEffect(() => {
    async function syncAuth0User() {
      try {
        const manualLogout = localStorage.getItem("manualLogout");

        if (manualLogout === "true") {
          return;
        }

        const existingUser = JSON.parse(localStorage.getItem("currentUser"));

        if (existingUser) {
          return;
        }

        const response = await fetch("/auth/profile", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const auth0User = await response.json();

        if (!auth0User || !auth0User.email) {
          return;
        }

        const users = JSON.parse(localStorage.getItem("users")) || [];

        const usernameFromEmail = auth0User.email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

        const existingMatchingUser = users.find((user) => {
          return (
            user.email === auth0User.email ||
            user.username === usernameFromEmail
          );
        });

        let appUser;

        if (existingMatchingUser) {
          appUser = existingMatchingUser;
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

          const updatedUsers = [...users, appUser];
          localStorage.setItem("users", JSON.stringify(updatedUsers));
        }

        localStorage.setItem("currentUser", JSON.stringify(appUser));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("authChanged"));

        if (
          window.location.pathname === "/" ||
          window.location.pathname === "/login"
        ) {
          window.location.replace("/student/profile");
        }
      } catch (error) {
        console.log("Auth0 sync skipped:", error);
      }
    }

    syncAuth0User();
  }, []);

  return null;
}