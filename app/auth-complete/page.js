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

        const email = auth0User.email.toLowerCase();

        let role = "";
        let className = "";

        if (email.endsWith("@g.coppellisd.com")) {
          role = "student";
          className = "Not assigned yet";
        } else if (email.endsWith("@coppellisd.com")) {
          role = "teacher";
          className = "Teacher Class";
        } else {
          localStorage.removeItem("currentUser");
          localStorage.setItem("manualLogout", "true");

          window.dispatchEvent(new Event("storage"));
          window.dispatchEvent(new Event("authChanged"));

          window.location.replace("/auth/logout?returnTo=/unauthorized");
          return;
        }

        const users = JSON.parse(localStorage.getItem("users")) || [];

        const usernameFromEmail = email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

        const existingUser = users.find((user) => {
          return user.email === email || user.username === usernameFromEmail;
        });

        let appUser;

        if (existingUser) {
          appUser = {
            ...existingUser,
            role: role,
            email: email,
            className:
              existingUser.className &&
              existingUser.className !== "Google Login"
                ? existingUser.className
                : className,
          };

          const updatedUsers = users.map((user) => {
            if (user.username === existingUser.username) {
              return appUser;
            }

            return user;
          });

          localStorage.setItem("users", JSON.stringify(updatedUsers));
        } else {
          appUser = {
            displayName: auth0User.name || usernameFromEmail,
            username: usernameFromEmail,
            email: email,
            className: className,
            password: "",
            role: role,
            avatar: "🙂",
            authProvider: "google",
            createdAt: new Date().toLocaleString(),
          };

          localStorage.setItem("users", JSON.stringify([...users, appUser]));
        }

        localStorage.setItem("currentUser", JSON.stringify(appUser));

        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("authChanged"));

        if (role === "teacher") {
          window.location.replace("/teacher");
        } else {
          window.location.replace("/student/profile");
        }
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