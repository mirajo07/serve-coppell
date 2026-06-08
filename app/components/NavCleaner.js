"use client";

import { useEffect } from "react";

export default function NavCleaner() {
  useEffect(() => {
    function hideDuplicateNavbars() {
      const globalNav = document.querySelector(".global-app-nav");

      if (!globalNav) {
        return;
      }

      const allNavs = document.querySelectorAll("nav");

      allNavs.forEach((nav) => {
        if (!nav.classList.contains("global-app-nav")) {
          nav.style.display = "none";
        }
      });

      const possibleDuplicateTitles = document.querySelectorAll(
        "h1, h2, h3, div, header, section"
      );

      possibleDuplicateTitles.forEach((element) => {
        const text = element.innerText || "";

        const looksLikeOldNavbar =
          text.includes("Vonnect") &&
          text.includes("Home") &&
          text.includes("Opportunities") &&
          !element.closest(".global-app-nav");

        if (looksLikeOldNavbar) {
          element.style.display = "none";
        }
      });
    }

    hideDuplicateNavbars();

    const observer = new MutationObserver(() => {
      hideDuplicateNavbars();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
