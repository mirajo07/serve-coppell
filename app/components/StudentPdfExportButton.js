"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StudentPdfExportButton() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const authenticatedUser = await getAuthenticatedAppUser();
      setCurrentUser(authenticatedUser);
    }

    loadUser();
  }, []);

  async function getAuthenticatedAppUser() {
    try {
      const response = await fetch("/auth/profile", {
        cache: "no-store",
      });

      if (!response.ok) {
        return null;
      }

      const auth0User = await response.json();

      if (!auth0User || !auth0User.email) {
        return null;
      }

      const email = auth0User.email.toLowerCase().trim();

      let role = "";
      let className = "";

      if (email.endsWith("@g.coppellisd.com")) {
        role = "student";
        className = "Not assigned yet";
      } else if (
  email.endsWith("@coppellisd.com") || email === "mjatx07@gmail.com" || email === "mjatx07@gmail.com" ||
  email === "mjatx07@gmail.com"
) {
        role = "teacher";
        className = "Teacher Class";
      } else {
        return null;
      }

      const usernameFromEmail = email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      const displayName =
        auth0User.name ||
        auth0User.nickname ||
        auth0User.given_name ||
        usernameFromEmail;

      return {
        displayName,
        username: usernameFromEmail,
        email,
        className,
        role,
        avatar: "🙂",
        authProvider: "google",
      };
    } catch (error) {
      console.error("Error loading authenticated user:", error);
      return null;
    }
  }

  async function exportToPdf() {
    if (!currentUser) {
      alert("Please log in first.");
      return;
    }

    const { data: volunteerHoursData, error: volunteerHoursError } =
      await supabase
        .from("volunteer_hours")
        .select("*")
        .eq("student_username", currentUser.username)
        .order("event_date", { ascending: false });

    if (volunteerHoursError) {
      console.error("Error loading volunteer hours for PDF:", volunteerHoursError);
      alert("Could not load volunteer hours for PDF.");
      return;
    }

    const { data: signupData, error: signupError } = await supabase
      .from("signups")
      .select("*")
      .eq("student_username", currentUser.username)
      .eq("source", "teacher-opportunity-signup")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (signupError) {
      console.error("Error loading teacher events for PDF:", signupError);
      alert("Could not load teacher events for PDF.");
      return;
    }

    const myManualHours = volunteerHoursData.map((entry) => ({
      id: entry.id,
      activityName: entry.event_name,
      organization: entry.organization,
      category: entry.category,
      date: entry.event_date,
      hours: entry.hours,
      organizationContact: entry.organization_contact,
      signature: entry.signature,
      notes: entry.notes,
      attachmentName: entry.attachment_name,
      attachmentUrl: entry.attachment_url,
    }));

    const myTeacherEvents = signupData.map((signup) => ({
      id: signup.id,
      opportunityTitle: signup.opportunity_title,
      teacherName: signup.teacher_name,
      opportunityLocation: signup.opportunity_location,
      teacherSignedAt: signup.teacher_signed_at,
      opportunityHours: signup.opportunity_hours,
      status: signup.status,
    }));

    const manualHourTotal = myManualHours.reduce((total, entry) => {
      return total + Number(entry.hours || 0);
    }, 0);

    const teacherHourTotal = myTeacherEvents.reduce((total, signup) => {
      return total + Number(signup.opportunityHours || 0);
    }, 0);

    const totalHours = manualHourTotal + teacherHourTotal;
    const totalActivities = myManualHours.length + myTeacherEvents.length;

    const manualRows = myManualHours
      .map((entry) => {
        return `
          <tr>
            <td>${entry.activityName || ""}</td>
            <td>${entry.organization || ""}</td>
            <td>${entry.category || ""}</td>
            <td>${entry.date || "No date"}</td>
            <td>${entry.hours || 0}</td>
            <td>${entry.organizationContact || ""}</td>
            <td>${entry.signature || ""}</td>
            <td>${
              entry.attachmentUrl
                ? `<a href="${entry.attachmentUrl}" target="_blank">${
                    entry.attachmentName || "Open Attachment"
                  }</a>`
                : "No attachment"
            }</td>
          </tr>
        `;
      })
      .join("");

    const teacherRows = myTeacherEvents
      .map((signup) => {
        return `
          <tr>
            <td>${signup.opportunityTitle || ""}</td>
            <td>${signup.teacherName || ""}</td>
            <td>${signup.opportunityLocation || ""}</td>
            <td>${signup.teacherSignedAt || "No date listed"}</td>
            <td>${signup.opportunityHours || 0}</td>
            <td>${signup.status || ""}</td>
          </tr>
        `;
      })
      .join("");

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${currentUser.displayName} Volunteer Report</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #111827;
            }

            h1 {
              color: #2563eb;
              margin-bottom: 8px;
            }

            h2 {
              color: #111827;
              margin-top: 32px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 8px;
            }

            .summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              margin-top: 24px;
              margin-bottom: 28px;
            }

            .box {
              border: 1px solid #d1d5db;
              border-radius: 12px;
              padding: 16px;
              background: #f9fafb;
              text-align: center;
            }

            .number {
              font-size: 28px;
              font-weight: 800;
              color: #047857;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 14px;
              font-size: 13px;
            }

            th {
              background: #2563eb;
              color: white;
              text-align: left;
              padding: 10px;
            }

            td {
              border: 1px solid #d1d5db;
              padding: 9px;
              vertical-align: top;
            }

            a {
              color: #2563eb;
              font-weight: 700;
            }

            .muted {
              color: #6b7280;
              font-size: 13px;
            }

            .footer {
              margin-top: 40px;
              font-size: 12px;
              color: #6b7280;
            }

            @media print {
              button {
                display: none;
              }

              body {
                padding: 24px;
              }
            }
          </style>
        </head>

        <body>
          <h1>Volunteer Hours Report</h1>

          <p>
            <strong>Student:</strong> ${currentUser.displayName}<br />
            <strong>Username:</strong> ${currentUser.username}<br />
            <strong>Email:</strong> ${currentUser.email}<br />
            <strong>Class:</strong> ${currentUser.className || "Not listed"}<br />
            <strong>Report Created:</strong> ${new Date().toLocaleString()}
          </p>

          <div class="summary">
            <div class="box">
              <div class="number">${totalHours}</div>
              <div>Total Hours</div>
            </div>

            <div class="box">
              <div class="number">${totalActivities}</div>
              <div>Total Activities</div>
            </div>

            <div class="box">
              <div class="number">${myManualHours.length}</div>
              <div>Manually Tracked Activities</div>
            </div>
          </div>

          <h2>Manually Tracked Activities</h2>

          ${
            myManualHours.length === 0
              ? `<p class="muted">No manually tracked activities.</p>`
              : `
                <table>
                  <thead>
                    <tr>
                      <th>Activity</th>
                      <th>Organization</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Hours</th>
                      <th>Contact</th>
                      <th>Signature</th>
                      <th>Attachment</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${manualRows}
                  </tbody>
                </table>
              `
          }

          <h2>Completed Teacher Events</h2>

          ${
            myTeacherEvents.length === 0
              ? `<p class="muted">No completed teacher events.</p>`
              : `
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Teacher</th>
                      <th>Location</th>
                      <th>Signed Date</th>
                      <th>Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${teacherRows}
                  </tbody>
                </table>
              `
          }

          <p class="footer">
            Generated from Vonnect student dashboard. For official school/NJHS approval, final verification depends on teacher/advisor review.
          </p>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Popup blocked. Please allow popups and try again.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
  }

  if (!currentUser || currentUser.role.toLowerCase() !== "student") {
    return null;
  }

  return (
    <button style={exportButtonStyle} onClick={exportToPdf}>
      Export My Data to PDF
    </button>
  );
}

const exportButtonStyle = {
  marginTop: "12px",
  width: "100%",
  padding: "12px",
  backgroundColor: "#7c3aed",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};
