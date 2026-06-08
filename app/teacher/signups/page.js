"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TeacherSignupsPage() {
  const [signups, setSignups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentFolder, setCurrentFolder] = useState("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeacherSignups() {
      const authenticatedUser = await getAuthenticatedAppUser();

      if (!authenticatedUser) {
        window.location.href = "/login";
        return;
      }

      if (
        !authenticatedUser.role ||
        authenticatedUser.role.toLowerCase() !== "teacher"
      ) {
        window.location.href = "/student/profile";
        return;
      }

      setCurrentUser(authenticatedUser);

      const { data, error } = await supabase
        .from("signups")
        .select("*")
        .eq("teacher_username", authenticatedUser.username)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading teacher signups:", error);
        alert("Could not load student signups from Supabase.");
        setLoading(false);
        return;
      }

      const formattedSignups = data.map((signup) => ({
        id: signup.id,
        studentUsername: signup.student_username,
        studentName: signup.student_name,
        className: signup.class_name,
        opportunityId: signup.opportunity_id,
        opportunityTitle: signup.opportunity_title,
        opportunityLocation: signup.opportunity_location,
        opportunityHours: signup.opportunity_hours,
        teacherName: signup.teacher_name,
        teacherUsername: signup.teacher_username,
        status: signup.status,
        source: signup.source,
        teacherSigned: signup.teacher_signed,
        teacherSignedBy: signup.teacher_signed_by,
        teacherSignedAt: signup.teacher_signed_at,
      }));

      setSignups(formattedSignups);
      setLoading(false);
    }

    loadTeacherSignups();
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

  async function updateSignupStatus(signupId, newStatus) {
    const { error } = await supabase
      .from("signups")
      .update({ status: newStatus })
      .eq("id", signupId);

    if (error) {
      console.error("Error updating signup status:", error);
      alert("Could not update signup status.");
      return;
    }

    const updatedSignups = signups.map((signup) => {
      if (signup.id === signupId) {
        return {
          ...signup,
          status: newStatus,
        };
      }

      return signup;
    });

    setSignups(updatedSignups);
  }

  async function completeWithTeacherSignature(signupId) {
    const signedAt = new Date().toLocaleString();

    const { error } = await supabase
      .from("signups")
      .update({
        status: "completed",
        teacher_signed: true,
        teacher_signed_by: currentUser.displayName,
        teacher_signed_at: signedAt,
      })
      .eq("id", signupId);

    if (error) {
      console.error("Error completing teacher signature:", error);
      alert("Could not complete teacher signature.");
      return;
    }

    const updatedSignups = signups.map((signup) => {
      if (signup.id === signupId) {
        return {
          ...signup,
          status: "completed",
          teacherSigned: true,
          teacherSignedBy: currentUser.displayName,
          teacherSignedAt: signedAt,
        };
      }

      return signup;
    });

    setSignups(updatedSignups);
  }

  function logout() {
    window.location.href = "/logout";
  }

  if (!currentUser || loading) {
    return (
      <main style={pageStyle}>
        <p style={{ padding: "40px" }}>Loading teacher signups...</p>
      </main>
    );
  }

  const myTeacherSignups = signups.filter((signup) => {
    return signup.teacherUsername === currentUser.username;
  });

  const pendingSignups = myTeacherSignups.filter(
    (signup) => signup.status === "pending"
  );

  const approvedSignups = myTeacherSignups.filter(
    (signup) => signup.status === "approved"
  );

  const needsSignatureSignups = myTeacherSignups.filter(
    (signup) => signup.status === "needs-signature"
  );

  const completedSignups = myTeacherSignups.filter(
    (signup) => signup.status === "completed"
  );

  const disapprovedSignups = myTeacherSignups.filter(
    (signup) => signup.status === "disapproved"
  );

  const folderSignups =
    currentFolder === "pending"
      ? pendingSignups
      : currentFolder === "approved"
      ? approvedSignups
      : currentFolder === "needs-signature"
      ? needsSignatureSignups
      : currentFolder === "completed"
      ? completedSignups
      : disapprovedSignups;

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <h1 style={titleStyle}>Review Student Signups</h1>

        <p style={subtitleStyle}>
          Approving a student only allows them to volunteer. Hours count only
          after you give the final teacher signature.
        </p>

        <p style={userInfoStyle}>
          Teacher: {currentUser.displayName} | Username: {currentUser.username}
        </p>

        <button style={logoutButtonStyle} onClick={logout}>
          Logout
        </button>
      </section>

      <section style={folderSectionStyle}>
        <button
          style={currentFolder === "pending" ? activeFolderStyle : folderStyle}
          onClick={() => setCurrentFolder("pending")}
        >
          Pending ({pendingSignups.length})
        </button>

        <button
          style={currentFolder === "approved" ? activeFolderStyle : folderStyle}
          onClick={() => setCurrentFolder("approved")}
        >
          Approved to Volunteer ({approvedSignups.length})
        </button>

        <button
          style={
            currentFolder === "needs-signature"
              ? activeFolderStyle
              : folderStyle
          }
          onClick={() => setCurrentFolder("needs-signature")}
        >
          Needs Signature ({needsSignatureSignups.length})
        </button>

        <button
          style={currentFolder === "completed" ? activeFolderStyle : folderStyle}
          onClick={() => setCurrentFolder("completed")}
        >
          Completed ({completedSignups.length})
        </button>

        <button
          style={
            currentFolder === "disapproved" ? activeFolderStyle : folderStyle
          }
          onClick={() => setCurrentFolder("disapproved")}
        >
          Disapproved ({disapprovedSignups.length})
        </button>
      </section>

      <section style={contentSectionStyle}>
        {folderSignups.length === 0 ? (
          <p style={emptyTextStyle}>No signups in this folder.</p>
        ) : (
          <div style={listStyle}>
            {folderSignups.map((signup) => (
              <div style={signupCardStyle} key={signup.id}>
                <h2 style={cardTitleStyle}>{signup.studentName}</h2>

                <p style={cardTextStyle}>
                  <strong>Student Username:</strong> {signup.studentUsername}
                </p>

                <p style={cardTextStyle}>
                  <strong>Class:</strong> {signup.className || "Not listed"}
                </p>

                <p style={cardTextStyle}>
                  <strong>Opportunity:</strong> {signup.opportunityTitle}
                </p>

                <p style={cardTextStyle}>
                  <strong>Location:</strong> {signup.opportunityLocation}
                </p>

                <p style={cardTextStyle}>
                  <strong>Hours:</strong> {signup.opportunityHours}
                </p>

                <p style={statusStyle}>
                  <strong>Status:</strong> {formatStatus(signup.status)}
                </p>

                {signup.status === "pending" && (
                  <div style={buttonRowStyle}>
                    <button
                      style={approveButtonStyle}
                      onClick={() => updateSignupStatus(signup.id, "approved")}
                    >
                      Approve to Volunteer
                    </button>

                    <button
                      style={disapproveButtonStyle}
                      onClick={() =>
                        updateSignupStatus(signup.id, "disapproved")
                      }
                    >
                      Disapprove
                    </button>
                  </div>
                )}

                {signup.status === "approved" && (
                  <button
                    style={moveButtonStyle}
                    onClick={() =>
                      updateSignupStatus(signup.id, "needs-signature")
                    }
                  >
                    Move to Needs Signature
                  </button>
                )}

                {signup.status === "needs-signature" && (
                  <button
                    style={checkmarkButtonStyle}
                    onClick={() => completeWithTeacherSignature(signup.id)}
                  >
                    ✓ Teacher Signature Complete
                  </button>
                )}

                {signup.status === "completed" && (
                  <div style={completedBoxStyle}>
                    <p>
                      <strong>Teacher Signed:</strong>{" "}
                      {signup.teacherSigned ? "Yes" : "No"}
                    </p>

                    <p>
                      <strong>Signed By:</strong>{" "}
                      {signup.teacherSignedBy || "Not listed"}
                    </p>

                    <p>
                      <strong>Signed At:</strong>{" "}
                      {signup.teacherSignedAt || "Not listed"}
                    </p>

                    <p>
                      <strong>Hours Counted:</strong> Yes
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function formatStatus(status) {
  if (status === "pending") return "Pending";
  if (status === "approved") return "Approved to Volunteer";
  if (status === "needs-signature") return "Needs Teacher Signature";
  if (status === "completed") return "Completed / Hours Counted";
  if (status === "disapproved") return "Disapproved";
  return status;
}

const pageStyle = {
  fontFamily: "Roboto,Segoe UI, Arial",
  backgroundColor: "#f9fafb",
  minHeight: "100vh",
};

const headerStyle = {
  padding: "70px 40px",
  textAlign: "center",
  backgroundColor: "#c7ebfa",
};

const titleStyle = {
  fontSize: "42px",
  color: "#111827",
  marginBottom: "16px",
};

const subtitleStyle = {
  fontSize: "18px",
  color: "#374151",
  maxWidth: "850px",
  margin: "0 auto",
  lineHeight: "1.6",
};

const userInfoStyle = {
  marginTop: "16px",
  color: "#000000",
  fontWeight: 700,
};

const logoutButtonStyle = {
  marginTop: "22px",
  padding: "10px 16px",
  backgroundColor: "#b91c1c",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
};

const folderSectionStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "12px",
  padding: "30px 40px 0",
  flexWrap: "wrap",
};

const folderStyle = {
  padding: "12px 18px",
  backgroundColor: "white",
  color: "#374151",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 700,
};

const activeFolderStyle = {
  padding: "12px 18px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "1px solid #2563eb",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 700,
};

const contentSectionStyle = {
  padding: "50px 40px",
};

const listStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "24px",
};

const signupCardStyle = {
  backgroundColor: "white",
  padding: "28px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const cardTitleStyle = {
  color: "#111827",
};

const cardTextStyle = {
  color: "#374151",
  lineHeight: "1.5",
};

const statusStyle = {
  color: "#111827",
  backgroundColor: "#f3f4f6",
  padding: "10px",
  borderRadius: "8px",
};

const buttonRowStyle = {
  display: "flex",
  gap: "12px",
  marginTop: "18px",
};

const approveButtonStyle = {
  flex: 1,
  padding: "10px",
  backgroundColor: "#047857",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
};

const disapproveButtonStyle = {
  flex: 1,
  padding: "10px",
  backgroundColor: "#b91c1c",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
};

const moveButtonStyle = {
  marginTop: "18px",
  width: "100%",
  padding: "12px",
  backgroundColor: "#f97316",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
};

const checkmarkButtonStyle = {
  marginTop: "18px",
  width: "100%",
  padding: "12px",
  backgroundColor: "#047857",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "16px",
};

const completedBoxStyle = {
  marginTop: "18px",
  backgroundColor: "#ecfdf5",
  color: "#111827",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #86efac",
};

const emptyTextStyle = {
  textAlign: "center",
  color: "#374151",
  fontSize: "18px",
};
