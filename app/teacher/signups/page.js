"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TeacherSignupsPage() {
  const [signups, setSignups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentFolder, setCurrentFolder] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [teacherClassIds, setTeacherClassIds] = useState([]);

  useEffect(() => {
    async function loadTeacherSignups() {
      const authenticatedUser = await getAuthenticatedAppUser();

      if (!authenticatedUser) {
        window.location.href = "/login";
        return;
      }

      if (authenticatedUser.role.toLowerCase() !== "teacher") {
        window.location.href = "/student/profile";
        return;
      }

      setCurrentUser(authenticatedUser);

      const { data: classTeacherData, error: classTeacherError } =
        await supabase
          .from("class_teachers")
          .select("class_id")
          .eq("teacher_username", authenticatedUser.username);

      if (classTeacherError) {
        console.error(
          "Error loading shared classes:",
          JSON.stringify(classTeacherError, null, 2)
        );
        alert("Could not load your shared classes.");
        setLoading(false);
        return;
      }

      const classIds = (classTeacherData || [])
        .map((row) => row.class_id)
        .filter(Boolean);

      setTeacherClassIds(classIds);

      if (classIds.length === 0) {
        setSignups([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("signups")
        .select("*")
        .in("class_id", classIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "Error loading shared class signups:",
          JSON.stringify(error, null, 2)
        );
        alert("Could not load student signups from Supabase.");
        setLoading(false);
        return;
      }

      const formattedSignups = (data || []).map(formatSignupFromSupabase);

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

  function formatSignupFromSupabase(signup) {
    return {
      id: signup.id,
      classId: signup.class_id,
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
    };
  }

  async function updateSignupStatus(signupId, newStatus) {
    setOpenMenuId(null);

    const updates = {
      status: newStatus,
    };

    if (
      newStatus === "pending" ||
      newStatus === "approved" ||
      newStatus === "needs-signature" ||
      newStatus === "disapproved"
    ) {
      updates.teacher_signed = false;
      updates.teacher_signed_by = null;
      updates.teacher_signed_at = null;
    }

    const { data, error } = await supabase
      .from("signups")
      .update(updates)
      .eq("id", signupId)
      .select()
      .single();

    if (error) {
      console.error(
        "Error updating signup status:",
        JSON.stringify(error, null, 2)
      );
      alert(error.message || "Could not update signup status.");
      return;
    }

    setSignups((previousSignups) =>
      previousSignups.map((signup) => {
        if (signup.id === signupId) {
          return formatSignupFromSupabase(data);
        }

        return signup;
      })
    );
  }

  async function completeWithTeacherSignature(signupId) {
    setOpenMenuId(null);

    const signedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from("signups")
      .update({
        status: "completed",
        teacher_signed: true,
        teacher_signed_by: currentUser.displayName,
        teacher_signed_at: signedAt,
      })
      .eq("id", signupId)
      .select()
      .single();

    if (error) {
      console.error(
        "Error completing teacher signature:",
        JSON.stringify(error, null, 2)
      );
      alert(error.message || "Could not complete teacher signature.");
      return;
    }

    setSignups((previousSignups) =>
      previousSignups.map((signup) => {
        if (signup.id === signupId) {
          return formatSignupFromSupabase(data);
        }

        return signup;
      })
    );
  }

  async function deleteSignup(signup) {
    setOpenMenuId(null);

    const confirmed = window.confirm(
      `Delete this signup for ${signup.studentName || signup.studentUsername}? This removes it from the student's teacher-opportunity status.`
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase.from("signups").delete().eq("id", signup.id);

    if (error) {
      console.error("Error deleting signup:", JSON.stringify(error, null, 2));
      alert(error.message || "Could not delete this signup.");
      return;
    }

    setSignups((previousSignups) =>
      previousSignups.filter((item) => item.id !== signup.id)
    );
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

  const sharedClassSignups = signups.filter((signup) => {
    return teacherClassIds.includes(signup.classId);
  });

  const pendingSignups = sharedClassSignups.filter(
    (signup) => signup.status === "pending"
  );

  const approvedSignups = sharedClassSignups.filter(
    (signup) => signup.status === "approved"
  );

  const needsSignatureSignups = sharedClassSignups.filter(
    (signup) => signup.status === "needs-signature"
  );

  const completedSignups = sharedClassSignups.filter(
    (signup) => signup.status === "completed"
  );

  const disapprovedSignups = sharedClassSignups.filter(
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
        <h2 style={logoStyle}>Vonnect</h2>

        <div style={navLinksStyle}>
          <a href="/teacher" style={linkStyle}>
            Teacher Dashboard
          </a>
          <a href="/teacher/add-opportunity" style={linkStyle}>
            Add Opportunity
          </a>
          <a href="/teacher/class" style={linkStyle}>
            Class
          </a>
          <a href="/opportunities" style={linkStyle}>
            Opportunities
          </a>
          <a href="/leaderboard" style={linkStyle}>
            Leaderboard
          </a>

          <button style={logoutButtonStyle} onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      <section style={headerStyle}>
        <h1 style={titleStyle}>Review Student Signups</h1>
        <p style={subtitleStyle}>
          Review signups for all shared classes where you are a teacher or
          co-teacher. Both teachers attached to the class can approve, sign,
          revive, disapprove, or delete the same signups.
        </p>

        <p style={userInfoStyle}>
          Teacher: {currentUser.displayName} | Username: {currentUser.username}
        </p>
      </section>

      {teacherClassIds.length === 0 ? (
        <section style={contentSectionStyle}>
          <p style={emptyTextStyle}>
            You are not attached to any shared classes yet. Go to the Class page
            and create or join a shared class first.
          </p>
        </section>
      ) : (
        <>
          <section style={folderSectionStyle}>
            <button
              style={
                currentFolder === "pending" ? activeFolderStyle : folderStyle
              }
              onClick={() => setCurrentFolder("pending")}
            >
              Pending ({pendingSignups.length})
            </button>

            <button
              style={
                currentFolder === "approved" ? activeFolderStyle : folderStyle
              }
              onClick={() => setCurrentFolder("approved")}
            >
              Approved ({approvedSignups.length})
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
              style={
                currentFolder === "completed" ? activeFolderStyle : folderStyle
              }
              onClick={() => setCurrentFolder("completed")}
            >
              Completed ({completedSignups.length})
            </button>

            <button
              style={
                currentFolder === "disapproved"
                  ? activeFolderStyle
                  : folderStyle
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
                    <div style={cardTopRowStyle}>
                      <h2 style={cardTitleStyle}>
                        {signup.studentName || signup.studentUsername}
                      </h2>

                      <div style={menuWrapperStyle}>
                        <button
                          style={threeDotButtonStyle}
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === signup.id ? null : signup.id
                            )
                          }
                          title="More actions"
                        >
                          ⋮
                        </button>

                        {openMenuId === signup.id && (
                          <div style={menuStyle}>
                            <button
                              style={menuItemStyle}
                              onClick={() =>
                                updateSignupStatus(signup.id, "pending")
                              }
                            >
                              Revive to Pending
                            </button>

                            <button
                              style={menuItemStyle}
                              onClick={() =>
                                updateSignupStatus(signup.id, "approved")
                              }
                            >
                              Move to Approved
                            </button>

                            <button
                              style={menuItemStyle}
                              onClick={() =>
                                updateSignupStatus(
                                  signup.id,
                                  "needs-signature"
                                )
                              }
                            >
                              Move to Needs Signature
                            </button>

                            <button
                              style={menuItemStyle}
                              onClick={() =>
                                completeWithTeacherSignature(signup.id)
                              }
                            >
                              Mark Completed
                            </button>

                            <button
                              style={menuItemStyle}
                              onClick={() =>
                                updateSignupStatus(signup.id, "disapproved")
                              }
                            >
                              Disapprove
                            </button>

                            <button
                              style={dangerMenuItemStyle}
                              onClick={() => deleteSignup(signup)}
                            >
                              Delete Signup
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p style={cardTextStyle}>
                      <strong>Student Username:</strong>{" "}
                      {signup.studentUsername}
                    </p>

                    <p style={cardTextStyle}>
                      <strong>Class:</strong> {signup.className || "Not listed"}
                    </p>

                    <p style={cardTextStyle}>
                      <strong>Opportunity:</strong> {signup.opportunityTitle}
                    </p>

                    <p style={cardTextStyle}>
                      <strong>Location:</strong>{" "}
                      {signup.opportunityLocation || "Not listed"}
                    </p>

                    <p style={cardTextStyle}>
                      <strong>Hours:</strong> {signup.opportunityHours}
                    </p>

                    <p style={cardTextStyle}>
                      <strong>Uploaded By:</strong>{" "}
                      {signup.teacherName || signup.teacherUsername}
                    </p>

                    <p style={statusStyle}>
                      <strong>Status:</strong> {formatStatus(signup.status)}
                    </p>

                    {signup.status === "pending" && (
                      <div style={buttonRowStyle}>
                        <button
                          style={approveButtonStyle}
                          onClick={() =>
                            updateSignupStatus(signup.id, "approved")
                          }
                        >
                          Approve
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

                    {signup.status === "disapproved" && (
                      <button
                        style={reviveButtonStyle}
                        onClick={() =>
                          updateSignupStatus(signup.id, "pending")
                        }
                      >
                        Revive to Pending
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
                          {signup.teacherSignedAt
                            ? new Date(signup.teacherSignedAt).toLocaleString()
                            : "Not listed"}
                        </p>
                        <p>
                          <strong>Hours Counted:</strong> Yes
                        </p>

                        <button
                          style={resetButtonStyle}
                          onClick={() =>
                            updateSignupStatus(signup.id, "needs-signature")
                          }
                        >
                          Undo Completion / Back to Needs Signature
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function formatStatus(status) {
  if (status === "pending") return "Pending";
  if (status === "approved") return "Approved to Volunteer";
  if (status === "needs-signature") return "Needs Teacher Signature";
  if (status === "completed") return "Completed / Hours Counted";
  if (status === "disapproved") return "Disapproved";
  return status || "Unknown";
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
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "24px",
};

const signupCardStyle = {
  position: "relative",
  backgroundColor: "white",
  padding: "28px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const cardTopRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const cardTitleStyle = {
  color: "#111827",
  marginTop: 0,
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

const menuWrapperStyle = {
  position: "relative",
};

const threeDotButtonStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  border: "1px solid #d1d5db",
  backgroundColor: "#f9fafb",
  color: "#111827",
  cursor: "pointer",
  fontSize: "22px",
  fontWeight: 900,
  lineHeight: "1",
};

const menuStyle = {
  position: "absolute",
  top: "42px",
  right: 0,
  width: "230px",
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
  padding: "8px",
  zIndex: 20,
};

const menuItemStyle = {
  width: "100%",
  display: "block",
  padding: "10px 12px",
  backgroundColor: "white",
  color: "#111827",
  border: "none",
  borderRadius: "8px",
  textAlign: "left",
  cursor: "pointer",
  fontWeight: 700,
};

const dangerMenuItemStyle = {
  width: "100%",
  display: "block",
  padding: "10px 12px",
  backgroundColor: "#fff1f2",
  color: "#b91c1c",
  border: "none",
  borderRadius: "8px",
  textAlign: "left",
  cursor: "pointer",
  fontWeight: 800,
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

const reviveButtonStyle = {
  marginTop: "18px",
  width: "100%",
  padding: "12px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
};

const completedBoxStyle = {
  marginTop: "18px",
  backgroundColor: "#ecfdf5",
  color: "#111827",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #86efac",
};

const resetButtonStyle = {
  marginTop: "12px",
  width: "100%",
  padding: "10px",
  backgroundColor: "#f97316",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
};

const emptyTextStyle = {
  textAlign: "center",
  color: "#374151",
  fontSize: "18px",
};