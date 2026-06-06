"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TeacherClassPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [roster, setRoster] = useState([]);
  const [studentUsernameToAdd, setStudentUsernameToAdd] = useState("");
  const [selectedStudentUsername, setSelectedStudentUsername] = useState("");
  const [volunteerHours, setVolunteerHours] = useState([]);
  const [signups, setSignups] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadTeacherClassData() {
      const savedUser = JSON.parse(localStorage.getItem("currentUser"));

      if (!savedUser) {
        window.location.href = "/login";
        return;
      }

      if (!savedUser.role || savedUser.role.toLowerCase() !== "teacher") {
        alert("Only teachers can manage a class.");
        window.location.href = "/student/profile";
        return;
      }

      setCurrentUser(savedUser);

      const { data: rosterData, error: rosterError } = await supabase
        .from("class_rosters")
        .select("*")
        .eq("teacher_username", savedUser.username)
        .order("added_at", { ascending: true });

      if (rosterError) {
        console.error("Error loading class roster:", rosterError);
        setMessage("Could not load class roster.");
      } else {
        const formattedRoster = rosterData.map((member) => ({
          username: member.student_username,
          displayName: member.student_name,
          className: member.class_name,
          addedAt: member.added_at
            ? new Date(member.added_at).toLocaleString()
            : "",
        }));

        setRoster(formattedRoster);
      }

      const { data: hoursData, error: hoursError } = await supabase
        .from("volunteer_hours")
        .select("*");

      if (hoursError) {
        console.error("Error loading volunteer hours:", hoursError);
      } else {
        const formattedHours = hoursData.map((entry) => ({
          id: entry.id,
          studentUsername: entry.student_username,
          studentName: entry.student_name,
          className: entry.class_name,
          activityName: entry.event_name,
          organization: entry.organization,
          organizationContact: entry.organization_contact,
          category: entry.category,
          date: entry.event_date,
          hours: entry.hours,
          notes: entry.notes,
          attachmentName: entry.attachment_name,
          status: entry.status,
        }));

        setVolunteerHours(formattedHours);
      }

      const { data: signupData, error: signupError } = await supabase
        .from("signups")
        .select("*");

      if (signupError) {
        console.error("Error loading signups:", signupError);
      } else {
        const formattedSignups = signupData.map((signup) => ({
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
      }
    }

    loadTeacherClassData();
  }, []);

  async function addStudentToClass() {
    setMessage("");

    const cleanedUsername = studentUsernameToAdd.trim();

    if (!cleanedUsername) {
      setMessage("Please enter a student username.");
      return;
    }

    const alreadyInClass = roster.some((member) => {
      return member.username.toLowerCase() === cleanedUsername.toLowerCase();
    });

    if (alreadyInClass) {
      setMessage("That student is already in your class.");
      return;
    }

    const studentFromHours = volunteerHours.find((entry) => {
      return (
        entry.studentUsername &&
        entry.studentUsername.toLowerCase() === cleanedUsername.toLowerCase()
      );
    });

    const studentFromSignups = signups.find((signup) => {
      return (
        signup.studentUsername &&
        signup.studentUsername.toLowerCase() === cleanedUsername.toLowerCase()
      );
    });

    const studentName =
      studentFromHours?.studentName ||
      studentFromSignups?.studentName ||
      cleanedUsername;

    const teacherClassName =
      currentUser.className && currentUser.className.trim()
        ? currentUser.className
        : `${currentUser.displayName}'s Class`;

    const newRosterRow = {
      teacher_username: currentUser.username,
      teacher_name: currentUser.displayName,
      class_name: teacherClassName,
      student_username: cleanedUsername,
      student_name: studentName,
    };

    const { data, error } = await supabase
      .from("class_rosters")
      .insert([newRosterRow])
      .select()
      .single();

    if (error) {
      console.error("Error adding student to class:", error);

      if (error.code === "23505") {
        setMessage("That student is already in your class.");
      } else {
        setMessage("Could not add student to class.");
      }

      return;
    }

    const newMember = {
      username: data.student_username,
      displayName: data.student_name,
      className: data.class_name,
      addedAt: data.added_at ? new Date(data.added_at).toLocaleString() : "",
    };

    setRoster((previousRoster) => [...previousRoster, newMember]);
    setStudentUsernameToAdd("");
    setMessage(`${studentName} was added to ${teacherClassName}.`);
  }

  async function removeStudentFromClass(studentUsername) {
    const studentToRemove = roster.find((member) => {
      return member.username === studentUsername;
    });

    if (!studentToRemove) {
      return;
    }

    const confirmRemove = window.confirm(
      `Are you sure you want to remove ${studentToRemove.displayName} from your class?`
    );

    if (!confirmRemove) {
      return;
    }

    const { error } = await supabase
      .from("class_rosters")
      .delete()
      .eq("teacher_username", currentUser.username)
      .eq("student_username", studentUsername);

    if (error) {
      console.error("Error removing student:", error);
      setMessage("Could not remove student from class.");
      return;
    }

    const updatedRoster = roster.filter((member) => {
      return member.username !== studentUsername;
    });

    setRoster(updatedRoster);

    if (selectedStudentUsername === studentUsername) {
      setSelectedStudentUsername("");
    }

    setMessage("Student removed from class.");
  }

  function logout() {
    localStorage.removeItem("currentUser");
    window.location.href = "/login";
  }

  function formatStatus(status) {
    if (status === "pending") return "Pending";
    if (status === "approved") return "Approved to Volunteer";
    if (status === "needs-signature") return "Needs Teacher Signature";
    if (status === "completed") return "Completed";
    if (status === "disapproved") return "Disapproved";
    if (status === "submitted") return "Submitted";
    return status || "Submitted";
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
    const manualRecords = getStudentManualEntries(studentUsername).map(
      (entry) => {
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
          attachmentName: entry.attachmentName || "",
        };
      }
    );

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
          Teacher: {currentUser.displayName} | Class:{" "}
          {currentUser.className || `${currentUser.displayName}'s Class`}
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
            This roster is now saved in Supabase.
          </p>

          <div style={inputRowStyle}>
            <input
              style={inputStyle}
              placeholder="Example: teststudent"
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
                    <span style={classTextStyle}>{member.className}</span>
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
                  <h3 style={miniStatNumberStyle}>
                    {selectedStudentTotalHours}
                  </h3>
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

const classTextStyle = {
  display: "block",
  color: "#2563eb",
  marginTop: "4px",
  fontWeight: 700,
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