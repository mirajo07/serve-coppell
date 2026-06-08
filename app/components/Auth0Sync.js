"use client";

import { useEffect } from "react";

export default function Auth0Sync() {
  useEffect(() => {
    async function checkAuth0User() {
      try {
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

        const email = auth0User.email.toLowerCase().trim();

        const isStudent = email.endsWith("@g.coppellisd.com");
        const isTeacher = email.endsWith("@coppellisd.com") || email === "mjatx07@gmail.com";

        if (!isStudent && !isTeacher) {
          return;
        }

        if (window.location.pathname === "/login") {
          if (isTeacher) {
            window.location.replace("/teacher");
          } else {
            window.location.replace("/student/profile");
          }
        }
      } catch (error) {
        console.log("Auth0 sync skipped:", error);
      }
    }

    checkAuth0User();
  }, []);

  return null;
}
