"use client";

import { useEffect, useState } from "react";

export default function StudentPdfExportButton() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("currentUser"));
    setCurrentUser(savedUser);
  }, []);

  function exportToPdf() {
    if (!currentUser) {
      alert("Please log in first.");
      return;
    }

    const volunteerHours =
      JSON.parse(localStorage.getItem("volunteerHours")) || [];

    const volunteerSignups =
      JSON.parse(localStorage.getItem("volunteerSignups")) || [];

    const myManualHours = volunteerHours.filter((entry) => {
      return entry.studentUsername === currentUser.username;
    });

    const myTeacherEvents = volunteerSignups.filter((signup) => {
      return (
        signup.studentUsername === currentUser.username &&
        signup.source === "teacher-opportunity-signup" &&
        signup.status === "completed"
      );
    });

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