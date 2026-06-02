"use client";

import { useEffect, useState } from "react";

export default function TeacherClassPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [roster, setRoster] = useState([]);
  const [studentUsernameToAdd, setStudentUsernameToAdd] = useState("");
  const [selectedStudentUsername, setSelectedStudentUsername] = useState("");
  const [volunteerHours, setVolunteerHours] = useState([]);
  const [signups, setSignups] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!savedUser) {
      window.location.href = "/login";
      return;
    }

    if (savedUser.role.toLowerCase() !== "teacher") {
      window.location.href = "/student";
      return;
    }

    setCurrentUser(savedUser);

    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    const storedHours = JSON.parse(localStorage.getItem("volunteerHours")) || [];
    const storedSignups =
      JSON.parse(localStorage.getItem("volunteerSignups")) || [];

    const allRosters = JSON.parse(localStorage.getItem("classRosters")) || {};
    const teacherRoster = allRosters[savedUser.username] || [];

    setUsers(storedUsers);
    setVolunteerHours(storedHours);
    setSignups(storedSignups);
    setRoster(teacherRoster);
  }, []);

  function saveRoster(updatedRoster) {
    const allRosters = JSON.parse(localStorage.getItem("classRosters")) || {};

    allRosters[currentUser.username] = updatedRoster;

    localStorage.setItem("classRosters", JSON.stringify(allRosters));
    setRoster(updatedRoster);
  }

  function addStudentToClass() {
    setMessage("");

    if (!studentUsernameToAdd) {
      setMessage("Please enter a student username.");
      return;
    }

    const student = users.find((user) => {
      return (
        user.username === studentUsernameToAdd &&
        user.role.toLowerCase() === "student"
      );
    });

    if (!student) {
      setMessage("No student found with that username.");
      return;
    }

    const alreadyInClass = roster.some((member) => {
      return member.username === student.username;
    });

    if (alreadyInClass) {
      setMessage("That student is already in your class.");
      return;
    }

    const newMember = {
      username: student.username,
      displayName: student.displayName,
      className: student.className,
      addedAt: new Date().toLocaleString(),
    };

    const updatedRoster = [...roster, newMember];

    saveRoster(updatedRoster);
    setStudentUsernameToAdd("");
    setMessage("Student added to class.");
  }

  function removeStudentFromClass(studentUsername) {
    const updatedRoster = roster.filter((member) => {
      return member.username !== studentUsername;
    });

    saveRoster(updatedRoster);

    if (selectedStudentUsername === studentUsername) {
      setSelectedStudentUsername("");
    }

    setMessage("Student removed from class.");
  }

  function logout() {
  localStorage.removeItem("currentUser");
  window.dispatchEvent(new Event("storage"));
  window.location.href = "/login";
}

  function formatStatus(status) {
    if (status === "pending") return "Pending";
    if (status === "approved") return "Approved to Volunteer";
    if (status === "needs-signature") return "Needs Teacher Signature";
    if (status === "completed") return "Completed / Hours Counted";
    if (status === "disapproved") return "Disapproved";
    if (status === "submitted") return "Submitted";
    return status;
  }

  function getStudentManualEntries(studentUsername) {
    return volunteerHours.filter((entry) => {
      return entry.studentUsername === studentUsername;
    });
  }

  function getStudentCompletedTeacherEntries(studentUsername) {
    return signups.filter((signup) => {
      return (
        signup.studentUsername === studentUsername &&
        signup.source === "teacher-opportunity-signup" &&
        signup.status === "completed"
      );
    });
  }

  function getStudentAllActivityRecords(studentUsername) {
    const manualRecords = getStudentManualEntries(studentUsername).map((entry) => {
      return {
        id: `manual-${entry.id}`,
        type: "Tracked Activity",
        title: entry.activityName,
        organization: entry.organization,
        contact: entry.organizationContact || "Not provided",
        category: entry.category || "Not listed",
        date: entry.date || "No date entered",
        hours: Number(entry.hours) || 0,
        status: entry.status || "submitted",
        notes: entry.notes || "No notes entered",
        signature: entry.signature || "Not provided",
        attachmentName: entry.attachmentName || "",
      };
    });

    const teacherRecords = getStudentCompletedTeacherEntries(
      studentUsername
    ).map((signup) => {
      return {
        id: `teacher-${signup.id}`,
        type: "Teacher Event",
        title: signup.opportunityTitle,
        organization: signup.teacherName || "Teacher-created event",
        contact: signup.teacherName || "Teacher",
        category: "Teacher Event",
        date: signup.teacherSignedAt || "No completion date listed",
        hours: Number(signup.opportunityHours) || 0,
        status: signup.status,
        notes: `Location: ${signup.opportunityLocation || "No location listed"}`,
        signature: signup.teacherSignedBy || signup.teacherName || "Teacher signed",
        attachmentName: "",
      };
    });

    return [...manualRecords, ...teacherRecords];
  }

  function getStudentTotalHours(studentUsername) {
    const allRecords = getStudentAllActivityRecords(studentUsername);

    return allRecords.reduce((total, record) => {
      return total + Number(record.hours);
    }, 0);
  }

  function getStudentTotalEvents(studentUsername) {
    return getStudentAllActivityRecords(studentUsername).length;
  }

  if (!currentUser) {
    return null;
  }

  const selectedStudent = roster.find((member) => {
    return member.username === selectedStudentUsername;
  });

  const selectedStudentRecords = selectedStudent
    ? getStudentAllActivityRecords(selectedStudent.username)
    : [];

  const selectedStudentTotalHours = selectedStudent
    ? getStudentTotalHours(selectedStudent.username)
    : 0;

  const classTotalHours = roster.reduce((total, member) => {
    return total + getStudentTotalHours(member.username);
  }, 0);

  const classTotalEvents = roster.reduce((total, member) => {
    return total + getStudentTotalEvents(member.username);
  }, 0);

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <h1 style={titleStyle}>Class Management</h1>

        <p style={subtitleStyle}>
          Add students by username, remove class members, and view each
          student’s total volunteer hours and activity records.
        </p>

        <p style={userInfoStyle}>
          Teacher: {currentUser.displayName} | Class: {currentUser.className}
        </p>

        <button style={logoutButtonStyle} onClick={logout}>
          Logout
        </button>
      </section>

      <section style={summarySectionStyle}>
        <div style={summaryCardStyle}>
          <h2 style={summaryNumberStyle}>{roster.length}</h2>
          <p style={summaryTextStyle}>Students in Class</p>
        </div>

        <div style={summaryCardStyle}>
          <h2 style={summaryNumberStyle}>{classTotalHours}</h2>
          <p style={summaryTextStyle}>Class Total Hours</p>
        </div>

        <div style={summaryCardStyle}>
          <h2 style={summaryNumberStyle}>{classTotalEvents}</h2>
          <p style={summaryTextStyle}>Total Activity Records</p>
        </div>
      </section>

      <section style={addStudentSectionStyle}>
        <div style={addStudentCardStyle}>
          <h2 style={sectionTitleStyle}>Add Student to Class</h2>

          <p style={helperTextStyle}>
            Enter the student’s username exactly as they used it during signup.
          </p>

          <div style={inputRowStyle}>
            <input
              style={inputStyle}
              placeholder="Example: miraya7"
              value={studentUsernameToAdd}
              onChange={(event) => setStudentUsernameToAdd(event.target.value)}
            />

            <button style={buttonStyle} onClick={addStudentToClass}>
              Add Student
            </button>
          </div>

          {message && <p style={messageStyle}>{message}</p>}
        </div>
      </section>

      <section style={mainGridStyle}>
        <div style={rosterCardStyle}>
          <h2 style={sectionTitleStyle}>Class Members</h2>

          {roster.length === 0 ? (
            <p style={emptyTextStyle}>No students added yet.</p>
          ) : (
            <div style={studentListStyle}>
              {roster.map((member) => (
                <div style={studentRowStyle} key={member.username}>
                  <button
                    style={
                      selectedStudentUsername === member.username
                        ? selectedStudentButtonActiveStyle
                        : selectedStudentButtonStyle
                    }
                    onClick={() => setSelectedStudentUsername(member.username)}
                  >
                    <strong>{member.displayName}</strong>
                    <span style={usernameTextStyle}>@{member.username}</span>
                    <span style={hoursPreviewStyle}>
                      {getStudentTotalHours(member.username)} total hours
                    </span>
                  </button>

                  <button
                    style={removeButtonStyle}
                    onClick={() => removeStudentFromClass(member.username)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={detailsCardStyle}>
          <h2 style={sectionTitleStyle}>Student Details</h2>

          {!selectedStudent ? (
            <p style={emptyTextStyle}>
              Select a student from the class list to view their total hours and
              activity records.
            </p>
          ) : (
            <>
              <div style={studentHeaderBoxStyle}>
                <h3 style={studentNameStyle}>{selectedStudent.displayName}</h3>

                <p style={cardTextStyle}>
                  <strong>Username:</strong> {selectedStudent.username}
                </p>

                <p style={cardTextStyle}>
                  <strong>Class:</strong> {selectedStudent.className}
                </p>
              </div>

              <div style={statsGridStyle}>
                <div style={miniStatStyle}>
                  <h3 style={miniStatNumberStyle}>{selectedStudentTotalHours}</h3>
                  <p style={miniStatTextStyle}>Total Hours</p>
                </div>

                <div style={miniStatStyle}>
                  <h3 style={miniStatNumberStyle}>
                    {selectedStudentRecords.length}
                  </h3>
                  <p style={miniStatTextStyle}>Activity Records</p>
                </div>
              </div>

              <h3 style={subSectionTitleStyle}>All Activity Records</h3>

              {selectedStudentRecords.length === 0 ? (
                <p style={emptyTextStyle}>
                  This student does not have any recorded hours yet.
                </p>
              ) : (
                <div style={detailListStyle}>
                  {selectedStudentRecords.map((record) => (
                    <div style={detailItemStyle} key={record.id}>
                      <p style={detailTitleStyle}>{record.title}</p>

                      <p>
                        <strong>Type:</strong> {record.type}
                      </p>

                      <p>
                        <strong>Organization / Source:</strong>{" "}
                        {record.organization}
                      </p>

                      <p>
                        <strong>Contact:</strong> {record.contact}
                      </p>

                      <p>
                        <strong>Category:</strong> {record.category}
                      </p>

                      <p>
                        <strong>Date:</strong> {record.date}
                      </p>

                      <p>
                        <strong>Hours:</strong> {record.hours}
                      </p>

                      <p>
                        <strong>Status:</strong> {formatStatus(record.status)}
                      </p>

                      <p>
                        <strong>Notes:</strong> {record.notes}
                      </p>

                      <p>
                        <strong>Signature:</strong> {record.signature}
                      </p>

                      {record.attachmentName && (
                        <p>
                          <strong>Attachment:</strong> {record.attachmentName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

const pageStyle = {
  fontFamily: "Roboto, Segoe UI, Arial",
  backgroundColor: "#f9fafb",
  minHeight: "100vh",
};

const headerStyle = {
  padding: "70px 40px",
  textAlign: "center",
  backgroundColor: "#ecfdf5",
};

const titleStyle = {
  fontSize: "42px",
  color: "#111827",
  marginBottom: "16px",
};

const subtitleStyle = {
  fontSize: "18px",
  color: "#374151",
  maxWidth: "900px",
  margin: "0 auto",
  lineHeight: "1.6",
};

const userInfoStyle = {
  marginTop: "16px",
  color: "#047857",
  fontWeight: 700,
};

const logoutButtonStyle = {
  marginTop: "22px",
  padding: "12px 22px",
  backgroundColor: "#b91c1c",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "16px",
};

const summarySectionStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "24px",
  padding: "40px 40px 0",
};

const summaryCardStyle = {
  backgroundColor: "white",
  padding: "24px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  textAlign: "center",
};

const summaryNumberStyle = {
  fontSize: "40px",
  color: "#047857",
  margin: 0,
};

const summaryTextStyle = {
  color: "#111827",
  fontWeight: 600,
};

const addStudentSectionStyle = {
  padding: "40px 40px 0",
};

const addStudentCardStyle = {
  backgroundColor: "white",
  padding: "28px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
};

const sectionTitleStyle = {
  color: "#111827",
  marginTop: 0,
};

const helperTextStyle = {
  color: "#374151",
  lineHeight: "1.5",
};

const inputRowStyle = {
  display: "flex",
  gap: "14px",
  marginTop: "16px",
};

const inputStyle = {
  flex: 1,
  padding: "12px",
  border: "1px solid #9ca3af",
  borderRadius: "8px",
  fontSize: "16px",
  color: "#111827",
  backgroundColor: "white",
};

const buttonStyle = {
  padding: "12px 18px",
  backgroundColor: "#047857",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
};

const messageStyle = {
  marginTop: "16px",
  color: "#047857",
  fontWeight: 700,
};

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 2fr",
  gap: "24px",
  padding: "40px",
};

const rosterCardStyle = {
  backgroundColor: "white",
  padding: "28px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  height: "fit-content",
};

const detailsCardStyle = {
  backgroundColor: "white",
  padding: "28px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
};

const emptyTextStyle = {
  color: "#6b7280",
  fontSize: "16px",
};

const studentListStyle = {
  display: "grid",
  gap: "12px",
};

const studentRowStyle = {
  display: "flex",
  gap: "10px",
  alignItems: "stretch",
};

const selectedStudentButtonStyle = {
  flex: 1,
  textAlign: "left",
  padding: "12px",
  backgroundColor: "#f9fafb",
  color: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  cursor: "pointer",
};

const selectedStudentButtonActiveStyle = {
  flex: 1,
  textAlign: "left",
  padding: "12px",
  backgroundColor: "#eff6ff",
  color: "#111827",
  border: "2px solid #2563eb",
  borderRadius: "10px",
  cursor: "pointer",
};

const usernameTextStyle = {
  display: "block",
  color: "#6b7280",
  marginTop: "4px",
};

const hoursPreviewStyle = {
  display: "block",
  color: "#047857",
  marginTop: "6px",
  fontWeight: 700,
};

const removeButtonStyle = {
  padding: "10px 12px",
  backgroundColor: "#b91c1c",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 700,
};

const studentHeaderBoxStyle = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "18px",
  marginBottom: "24px",
};

const studentNameStyle = {
  color: "#111827",
  marginTop: 0,
};

const cardTextStyle = {
  color: "#374151",
  lineHeight: "1.5",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "16px",
  marginBottom: "30px",
};

const miniStatStyle = {
  backgroundColor: "#ecfdf5",
  border: "1px solid #86efac",
  borderRadius: "12px",
  padding: "16px",
  textAlign: "center",
};

const miniStatNumberStyle = {
  margin: 0,
  fontSize: "30px",
  color: "#047857",
};

const miniStatTextStyle = {
  color: "#374151",
  fontWeight: 700,
};

const subSectionTitleStyle = {
  color: "#111827",
  marginTop: "30px",
  borderTop: "1px solid #e5e7eb",
  paddingTop: "24px",
};

const detailListStyle = {
  display: "grid",
  gap: "16px",
};

const detailItemStyle = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "18px",
  color: "#374151",
};

const detailTitleStyle = {
  color: "#047857",
  fontWeight: 700,
  fontSize: "18px",
  marginTop: 0,
};