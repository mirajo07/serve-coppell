"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StudentDashboardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [signups, setSignups] = useState([]);
  const [manualHours, setManualHours] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadStudentDashboard() {
      const authenticatedUser = await getAuthenticatedAppUser();

      if (!authenticatedUser) {
        window.location.href = "/login";
        return;
      }

      if (authenticatedUser.role !== "student") {
        window.location.href = "/teacher";
        return;
      }

      setCurrentUser(authenticatedUser);

      const { data: signupData, error: signupError } = await supabase
        .from("signups")
        .select("*")
        .eq("student_username", authenticatedUser.username)
        .order("created_at", { ascending: false });

      if (signupError) {
        console.error("Error loading student signups:", signupError);
        setMessage("Could not load your opportunity signups.");
      } else {
        setSignups(signupData || []);
      }

      const { data: hoursData, error: hoursError } = await supabase
        .from("volunteer_hours")
        .select("*")
        .eq("student_username", authenticatedUser.username)
        .order("created_at", { ascending: false });

      if (hoursError) {
        console.error("Error loading manual hours:", hoursError);
        setMessage("Could not load your volunteer hours.");
      } else {
        setManualHours(hoursData || []);
      }
    }

    loadStudentDashboard();
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
        email.endsWith("@coppellisd.com") ||
        email === "mjatx07@gmail.com"
      ) {
        role = "teacher";
        className = "Teacher Class";
      } else {
        window.location.replace("/auth/logout?returnTo=/unauthorized");
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

  if (!currentUser) {
    return null;
  }

  const completedSignups = signups.filter((signup) => {
    return isCompletedSignup(signup);
  });

  const needsSignatureSignups = signups.filter((signup) => {
    return isNeedsSignatureSignup(signup);
  });

  const approvedSignups = signups.filter((signup) => {
    return isApprovedSignup(signup);
  });

  const pendingSignups = signups.filter((signup) => {
    return isPendingSignup(signup);
  });

  const rejectedSignups = signups.filter((signup) => {
    return isRejectedSignup(signup);
  });

  const approvedManualHours = manualHours.filter((entry) => {
    return normalizeStatus(entry.status) === "approved";
  });

  const pendingManualHours = manualHours.filter((entry) => {
    return normalizeStatus(entry.status) === "pending";
  });

  const totalCompletedSignupHours = completedSignups.reduce((total, signup) => {
    return total + Number(signup.opportunity_hours || 0);
  }, 0);

  const totalManualApprovedHours = approvedManualHours.reduce((total, entry) => {
    return total + Number(entry.hours || 0);
  }, 0);

  const totalConfirmedHours =
    totalCompletedSignupHours + totalManualApprovedHours;

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <h1 style={titleStyle}>Student Dashboard</h1>
        <p style={subtitleStyle}>
          Welcome, {currentUser.displayName}. Track your opportunities, approval
          status, signatures, and completed hours.
        </p>
      </section>

      <section style={summaryGridStyle}>
        <SummaryCard label="Total Confirmed Hours" value={totalConfirmedHours} />
        <SummaryCard
          label="Pending"
          value={pendingSignups.length + pendingManualHours.length}
        />
        <SummaryCard
          label="Approved"
          value={approvedSignups.length + approvedManualHours.length}
        />
        <SummaryCard
          label="Needs Signature"
          value={needsSignatureSignups.length}
        />
        <SummaryCard label="Completed" value={completedSignups.length} />
        <SummaryCard label="Rejected" value={rejectedSignups.length} />
      </section>

      {message && <p style={messageStyle}>{message}</p>}

      <section style={dashboardSectionStyle}>
        <StatusSection
          title="Pending Opportunities"
          description="These are signups waiting for teacher approval."
          items={pendingSignups}
          emptyText="You do not have any pending signups."
          statusColor="#92400e"
        />

        <StatusSection
          title="Approved Opportunities"
          description="These opportunities have been approved but are not completed yet."
          items={approvedSignups}
          emptyText="You do not have any approved opportunities yet."
          statusColor="#047857"
        />

        <StatusSection
          title="Needs Signature"
          description="These are waiting for a teacher signature or completion confirmation."
          items={needsSignatureSignups}
          emptyText="Nothing currently needs a signature."
          statusColor="#1d4ed8"
        />

        <StatusSection
          title="Completed Opportunities"
          description="These opportunities are complete and count toward your confirmed progress."
          items={completedSignups}
          emptyText="You do not have any completed opportunities yet."
          statusColor="#4f46e5"
        />

        <StatusSection
          title="Rejected / Disapproved"
          description="These signups were not approved."
          items={rejectedSignups}
          emptyText="You do not have any rejected signups."
          statusColor="#b91c1c"
        />

        <ManualHoursSection
          title="Manual Volunteer Hours"
          items={manualHours}
          emptyText="You have not manually tracked any hours yet."
        />
      </section>
    </main>
  );
}

function normalizeStatus(status) {
  return String(status || "").toLowerCase().trim();
}

function isCompletedSignup(signup) {
  const status = normalizeStatus(signup.status);

  return status === "completed" || signup.teacher_signed === true;
}

function isNeedsSignatureSignup(signup) {
  const status = normalizeStatus(signup.status);

  if (isCompletedSignup(signup)) {
    return false;
  }

  return (
    status === "needs-signature" ||
    status === "needs signature" ||
    status === "signature needed"
  );
}

function isApprovedSignup(signup) {
  const status = normalizeStatus(signup.status);

  if (isCompletedSignup(signup)) {
    return false;
  }

  if (isNeedsSignatureSignup(signup)) {
    return false;
  }

  return status === "approved";
}

function isPendingSignup(signup) {
  const status = normalizeStatus(signup.status);

  if (isCompletedSignup(signup)) {
    return false;
  }

  return status === "pending";
}

function isRejectedSignup(signup) {
  const status = normalizeStatus(signup.status);

  return (
    status === "rejected" ||
    status === "disapproved" ||
    status === "declined"
  );
}

function SummaryCard({ label, value }) {
  return (
    <div style={summaryCardStyle}>
      <h2 style={summaryNumberStyle}>{value}</h2>
      <p style={summaryLabelStyle}>{label}</p>
    </div>
  );
}

function StatusSection({
  title,
  description,
  items,
  emptyText,
  statusColor,
}) {
  return (
    <div style={sectionCardStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <p style={sectionDescriptionStyle}>{description}</p>

      {items.length === 0 ? (
        <p style={emptyTextStyle}>{emptyText}</p>
      ) : (
        <div style={listStyle}>
          {items.map((signup) => (
            <div style={itemCardStyle} key={signup.id}>
              <div style={itemHeaderStyle}>
                <h3 style={itemTitleStyle}>
                  {signup.opportunity_title || "Untitled Opportunity"}
                </h3>

                <span
                  style={{
                    ...statusBadgeStyle,
                    backgroundColor: statusColor,
                  }}
                >
                  {signup.status || "Unknown"}
                </span>
              </div>

              <p style={itemTextStyle}>
                <strong>Location:</strong>{" "}
                {signup.opportunity_location || "Not listed"}
              </p>

              <p style={itemTextStyle}>
                <strong>Hours:</strong>{" "}
                {signup.opportunity_hours || "Not listed"}
              </p>

              <p style={itemTextStyle}>
                <strong>Teacher:</strong>{" "}
                {signup.teacher_name || signup.teacher_username || "Not listed"}
              </p>

              <p style={itemTextStyle}>
                <strong>Class:</strong> {signup.class_name || "Not listed"}
              </p>

              <p style={itemTextStyle}>
                <strong>Teacher Signed:</strong>{" "}
                {signup.teacher_signed ? "Yes" : "No"}
              </p>

              {signup.teacher_signed_by && (
                <p style={itemTextStyle}>
                  <strong>Signed By:</strong> {signup.teacher_signed_by}
                </p>
              )}

              {signup.teacher_signed_at && (
                <p style={itemTextStyle}>
                  <strong>Signed At:</strong>{" "}
                  {new Date(signup.teacher_signed_at).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ManualHoursSection({ title, items, emptyText }) {
  return (
    <div style={sectionCardStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <p style={sectionDescriptionStyle}>
        These are hours you manually entered from the Track Hours page.
      </p>

      {items.length === 0 ? (
        <p style={emptyTextStyle}>{emptyText}</p>
      ) : (
        <div style={listStyle}>
          {items.map((entry) => (
            <div style={itemCardStyle} key={entry.id}>
              <div style={itemHeaderStyle}>
                <h3 style={itemTitleStyle}>
                  {entry.event_name || "Volunteer Activity"}
                </h3>

                <span
                  style={{
                    ...statusBadgeStyle,
                    backgroundColor:
                      normalizeStatus(entry.status) === "approved"
                        ? "#047857"
                        : "#92400e",
                  }}
                >
                  {entry.status || "Unknown"}
                </span>
              </div>

              <p style={itemTextStyle}>
                <strong>Organization:</strong>{" "}
                {entry.organization || "Not listed"}
              </p>

              <p style={itemTextStyle}>
                <strong>Contact:</strong>{" "}
                {entry.organization_contact || "Not listed"}
              </p>

              <p style={itemTextStyle}>
                <strong>Date:</strong> {entry.event_date || "Not listed"}
              </p>

              <p style={itemTextStyle}>
                <strong>Hours:</strong> {entry.hours || "Not listed"}
              </p>

              <p style={itemTextStyle}>
                <strong>Category:</strong> {entry.category || "Not listed"}
              </p>

              <p style={itemTextStyle}>
                <strong>Notes:</strong> {entry.notes || "No notes entered"}
              </p>

              <p style={itemTextStyle}>
                <strong>Attachment:</strong>{" "}
                {entry.attachment_url ? (
                  <a
                    href={entry.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={attachmentLinkStyle}
                  >
                    {entry.attachment_name || "Open Attachment"}
                  </a>
                ) : (
                  "No attachment uploaded"
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const pageStyle = {
  fontFamily: "Roboto, Segoe UI, Arial",
  backgroundColor: "#f9fafb",
  minHeight: "100vh",
};

const heroStyle = {
  padding: "60px 40px",
  textAlign: "center",
  backgroundColor: "#c7ebfa",
};

const titleStyle = {
  fontSize: "42px",
  color: "#111827",
  marginBottom: "14px",
};

const subtitleStyle = {
  fontSize: "18px",
  color: "#374151",
  maxWidth: "780px",
  margin: "0 auto",
  lineHeight: "1.6",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "20px",
  padding: "36px 40px 10px",
  maxWidth: "1200px",
  margin: "0 auto",
};

const summaryCardStyle = {
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "16px",
  padding: "22px",
  textAlign: "center",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const summaryNumberStyle = {
  fontSize: "36px",
  color: "#047857",
  margin: 0,
};

const summaryLabelStyle = {
  color: "#111827",
  fontWeight: 700,
  marginTop: "8px",
};

const messageStyle = {
  maxWidth: "900px",
  margin: "20px auto",
  padding: "14px",
  borderRadius: "10px",
  backgroundColor: "#fffbeb",
  color: "#92400e",
  fontWeight: 700,
  textAlign: "center",
};

const dashboardSectionStyle = {
  padding: "30px 40px 70px",
  maxWidth: "1100px",
  margin: "0 auto",
  display: "grid",
  gap: "28px",
};

const sectionCardStyle = {
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "18px",
  padding: "28px",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const sectionTitleStyle = {
  color: "#111827",
  fontSize: "28px",
  marginTop: 0,
  marginBottom: "8px",
};

const sectionDescriptionStyle = {
  color: "#374151",
  fontSize: "16px",
  marginTop: 0,
  marginBottom: "20px",
};

const emptyTextStyle = {
  color: "#6b7280",
  backgroundColor: "#f9fafb",
  border: "1px dashed #d1d5db",
  padding: "16px",
  borderRadius: "12px",
  textAlign: "center",
};

const listStyle = {
  display: "grid",
  gap: "16px",
};

const itemCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "20px",
  backgroundColor: "#f9fafb",
};

const itemHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: "10px",
};

const itemTitleStyle = {
  color: "#111827",
  fontSize: "21px",
  margin: 0,
};

const statusBadgeStyle = {
  color: "white",
  borderRadius: "999px",
  padding: "7px 12px",
  fontWeight: 800,
  fontSize: "13px",
  textTransform: "capitalize",
};

const itemTextStyle = {
  color: "#374151",
  margin: "8px 0",
  lineHeight: "1.5",
};

const attachmentLinkStyle = {
  color: "#2563eb",
  fontWeight: 700,
  textDecoration: "underline",
};