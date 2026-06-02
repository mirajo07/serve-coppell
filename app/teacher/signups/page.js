"use client";

import { useEffect, useState } from "react";

export default function TeacherSignupsPage() {
  const [signups, setSignups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentFolder, setCurrentFolder] = useState("pending");

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!savedUser) {
      window.location.href = "/auth/logout";
      return;
    }

    if (savedUser.role.toLowerCase() !== "teacher") {
      window.location.href = "/student";
      return;
    }

    setCurrentUser(savedUser);

    const storedSignups =
      JSON.parse(localStorage.getItem("volunteerSignups")) || [];

    setSignups(storedSignups);
  }, []);

  function updateSignupStatus(signupId, newStatus) {
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
    localStorage.setItem("volunteerSignups", JSON.stringify(updatedSignups));
  }

  function completeWithTeacherSignature(signupId) {
    const updatedSignups = signups.map((signup) => {
      if (signup.id === signupId) {
        return {
          ...signup,
          status: "completed",
          teacherSigned: true,
          teacherSignedBy: currentUser.displayName,
          teacherSignedAt: new Date().toLocaleString(),
        };
      }

      return signup;
    });

    setSignups(updatedSignups);
    localStorage.setItem("volunteerSignups", JSON.stringify(updatedSignups));
  }

  function logout() {
  localStorage.removeItem("currentUser");
  localStorage.setItem("manualLogout", "true");

  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("authChanged"));

  window.location.href = "/auth/logout?returnTo=/login";
}

  if (!currentUser) {
    return null;
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
      <nav style={navStyle}>
        <h2 style={logoStyle}>Volunteer Connect</h2>

        <div style={navLinksStyle}>
          <a href="/teacher" style={linkStyle}>Teacher Dashboard</a>
          <a href="/teacher/add-opportunity" style={linkStyle}>Add Opportunity</a>
          <a href="/opportunities" style={linkStyle}>Opportunities</a>
          <a href="/leaderboard" style={linkStyle}>Leaderboard</a>

          <button style={logoutButtonStyle} onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      <section style={headerStyle}>
        <h1 style={titleStyle}>Review Student Signups</h1>
        <p style={subtitleStyle}>
          Approving a student only allows them to volunteer. Hours count only
          after you give the final teacher signature.
        </p>

        <p style={userInfoStyle}>
          Teacher: {currentUser.displayName} | Class: {currentUser.className}
        </p>
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
                  <strong>Class:</strong> {signup.className}
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
                      <strong>Teacher Signed:</strong> Yes
                    </p>
                    <p>
                      <strong>Signed By:</strong> {signup.teacherSignedBy}
                    </p>
                    <p>
                      <strong>Signed At:</strong> {signup.teacherSignedAt}
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

const navStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px 40px",
  backgroundColor: "white",
  borderBottom: "1px solid #e5e7eb",
};

const logoStyle = {
  margin: 0,
  color: "#2563eb",
};

const navLinksStyle = {
  display: "flex",
  gap: "18px",
  alignItems: "center",
};

const linkStyle = {
  color: "#374151",
  fontSize: "16px",
  cursor: "pointer",
  textDecoration: "none",
};

const logoutButtonStyle = {
  padding: "8px 14px",
  backgroundColor: "#b91c1c",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
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