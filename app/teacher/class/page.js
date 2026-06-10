"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TeacherClassPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudentUsername, setSelectedStudentUsername] = useState("");

  const [showClassManagement, setShowClassManagement] = useState(false);

  const [newClassName, setNewClassName] = useState("");
  const [studentUsername, setStudentUsername] = useState("");
  const [coTeacherEmailOrUsername, setCoTeacherEmailOrUsername] = useState("");

  const [classTeachers, setClassTeachers] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [volunteerHours, setVolunteerHours] = useState([]);
  const [signups, setSignups] = useState([]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPage() {
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
      await loadTeacherClasses(authenticatedUser.username);
      setLoading(false);
    }

    loadPage();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadSelectedClassData(selectedClassId);
    }
  }, [selectedClassId]);

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

  function getClassDisplayName(classItem) {
    return classItem?.class_name || classItem?.name || "Untitled Class";
  }

  function cleanUsername(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace("@g.coppellisd.com", "")
      .replace("@coppellisd.com", "")
      .replace(/[^a-z0-9]/g, "");
  }

  async function loadTeacherClasses(teacherUsername) {
    const { data, error } = await supabase
      .from("class_teachers")
      .select("class_id, classes(*)")
      .eq("teacher_username", teacherUsername)
      .order("added_at", { ascending: false });

    if (error) {
      console.error("Error loading teacher classes:", JSON.stringify(error, null, 2));
      setMessage(error.message || "Could not load your classes.");
      return;
    }

    const teacherClasses = (data || [])
      .map((item) => item.classes)
      .filter(Boolean);

    setClasses(teacherClasses);

    if (teacherClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(teacherClasses[0].id);
      setSelectedClass(teacherClasses[0]);
    }
  }

  async function loadSelectedClassData(classId) {
    setMessage("");

    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("*")
      .eq("id", classId)
      .maybeSingle();

    if (classError) {
      console.error("Error loading class:", JSON.stringify(classError, null, 2));
    }

    if (classData) {
      setSelectedClass(classData);
    }

    const { data: teachersData, error: teachersError } = await supabase
      .from("class_teachers")
      .select("*")
      .eq("class_id", classId)
      .order("added_at", { ascending: true });

    if (teachersError) {
      console.error("Error loading class teachers:", JSON.stringify(teachersError, null, 2));
      setClassTeachers([]);
    } else {
      setClassTeachers(teachersData || []);
    }

    const { data: studentsData, error: studentsError } = await supabase
      .from("class_rosters")
      .select("*")
      .eq("class_id", classId)
      .order("added_at", { ascending: false });

    if (studentsError) {
      console.error("Error loading class students:", JSON.stringify(studentsError, null, 2));
      setMessage(studentsError.message || "Could not load class students.");
      setClassStudents([]);
      setVolunteerHours([]);
      setSignups([]);
      setSelectedStudentUsername("");
      return;
    }

    const students = studentsData || [];
    setClassStudents(students);

    const studentUsernames = students
      .map((student) => student.student_username)
      .filter(Boolean);

    if (studentUsernames.length === 0) {
      setVolunteerHours([]);
      setSignups([]);
      setSelectedStudentUsername("");
      return;
    }

    const { data: hoursData, error: hoursError } = await supabase
      .from("volunteer_hours")
      .select("*")
      .in("student_username", studentUsernames)
      .order("event_date", { ascending: false });

    if (hoursError) {
      console.error("Error loading volunteer hours:", JSON.stringify(hoursError, null, 2));
      setVolunteerHours([]);
    } else {
      setVolunteerHours(hoursData || []);
    }

    const { data: signupsData, error: signupsError } = await supabase
      .from("signups")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });

    if (signupsError) {
      console.error("Error loading signups:", JSON.stringify(signupsError, null, 2));
      setSignups([]);
    } else {
      setSignups(signupsData || []);
    }
  }

  const studentActivityGroups = useMemo(() => {
    return classStudents.map((student) => {
      const username = student.student_username;

      const manualActivities = volunteerHours
        .filter((row) => row.student_username === username)
        .map((row) => ({
          id: `manual-${row.id}`,
          source: "Manual Hours",
          studentUsername: row.student_username,
          title: row.event_name || "Volunteer Activity",
          organization: row.organization || "Not provided",
          contact: row.organization_contact || "Not provided",
          category: row.category || "Not provided",
          date: row.event_date || "",
          hours: Number(row.hours || 0),
          status: row.status || "pending",
          notes: row.notes || "",
          signature: row.signature || "",
          attachmentName: row.attachment_name || "",
          attachmentUrl: row.attachment_url || "",
          createdAt: row.created_at || "",
        }));

      const teacherOpportunityActivities = signups
        .filter((row) => row.student_username === username)
        .map((row) => ({
          id: `signup-${row.id}`,
          source: "Teacher Opportunity",
          studentUsername: row.student_username,
          title: row.opportunity_title || "Teacher Opportunity",
          organization: row.opportunity_location || "Not provided",
          contact: row.teacher_name || "Teacher",
          category: row.source || "Teacher-created",
          date: row.created_at || "",
          hours: Number(row.opportunity_hours || row.hours || 0),
          status: row.status || "pending",
          notes: row.teacher_signed
            ? `Signed by ${row.teacher_signed_by || "teacher"}`
            : "",
          signature: row.teacher_signed ? "Teacher signed" : "",
          attachmentName: "",
          attachmentUrl: "",
          createdAt: row.created_at || "",
        }));

      const allActivities = [
        ...manualActivities,
        ...teacherOpportunityActivities,
      ].sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      const approvedHours = allActivities
        .filter((activity) => {
          const status = String(activity.status || "").toLowerCase();
          return status === "approved" || status === "completed";
        })
        .reduce((sum, activity) => sum + Number(activity.hours || 0), 0);

      const totalSubmittedHours = allActivities.reduce(
        (sum, activity) => sum + Number(activity.hours || 0),
        0
      );

      return {
        username,
        activities: allActivities,
        approvedHours,
        totalSubmittedHours,
        activityCount: allActivities.length,
        attachmentCount: allActivities.filter((activity) => activity.attachmentUrl).length,
      };
    });
  }, [classStudents, volunteerHours, signups]);

  useEffect(() => {
    if (studentActivityGroups.length === 0) {
      setSelectedStudentUsername("");
      return;
    }

    const selectedStillExists = studentActivityGroups.some(
      (student) => student.username === selectedStudentUsername
    );

    if (!selectedStudentUsername || !selectedStillExists) {
      setSelectedStudentUsername(studentActivityGroups[0].username);
    }
  }, [studentActivityGroups, selectedStudentUsername]);

  const selectedStudent = useMemo(() => {
    return (
      studentActivityGroups.find(
        (student) => student.username === selectedStudentUsername
      ) || null
    );
  }, [studentActivityGroups, selectedStudentUsername]);

  const classTotals = useMemo(() => {
    const totalStudents = studentActivityGroups.length;
    const approvedHours = studentActivityGroups.reduce(
      (sum, student) => sum + student.approvedHours,
      0
    );
    const submittedHours = studentActivityGroups.reduce(
      (sum, student) => sum + student.totalSubmittedHours,
      0
    );
    const totalActivities = studentActivityGroups.reduce(
      (sum, student) => sum + student.activityCount,
      0
    );
    const totalAttachments = studentActivityGroups.reduce(
      (sum, student) => sum + student.attachmentCount,
      0
    );

    return {
      totalStudents,
      approvedHours,
      submittedHours,
      totalActivities,
      totalAttachments,
    };
  }, [studentActivityGroups]);

  async function createSharedClass() {
    setMessage("");

    if (!newClassName.trim()) {
      setMessage("Please enter a class name.");
      return;
    }

    const cleanClassName = newClassName.trim();

    const { data: newClass, error: classError } = await supabase
      .from("classes")
      .insert([
        {
          name: cleanClassName,
          class_name: cleanClassName,
          created_by_teacher_username: currentUser.username,
          created_by_teacher_name: currentUser.displayName,
        },
      ])
      .select()
      .single();

    if (classError) {
      console.error("Error creating shared class:", JSON.stringify(classError, null, 2));
      alert(classError.message || JSON.stringify(classError));
      setMessage(classError.message || "Could not create class.");
      return;
    }

    const { error: teacherError } = await supabase.from("class_teachers").insert([
      {
        class_id: newClass.id,
        teacher_username: currentUser.username,
        teacher_name: currentUser.username,
        teacher_email: currentUser.email,
        role: "owner",
      },
    ]);

    if (teacherError) {
      console.error("Error adding owner teacher:", JSON.stringify(teacherError, null, 2));
      alert(teacherError.message || JSON.stringify(teacherError));
      setMessage("Class created, but teacher could not be attached.");
      return;
    }

    setClasses((previousClasses) => [newClass, ...previousClasses]);
    setSelectedClassId(newClass.id);
    setSelectedClass(newClass);
    setNewClassName("");
    setMessage("Shared class created successfully.");
    await loadSelectedClassData(newClass.id);
  }

  async function addStudentToClass() {
    setMessage("");

    if (!selectedClassId || !selectedClass) {
      setMessage("Please select or create a class first.");
      return;
    }

    if (!studentUsername.trim()) {
      setMessage("Please enter the student's username.");
      return;
    }

    const cleanStudentUsername = cleanUsername(studentUsername);
    const classDisplayName = getClassDisplayName(selectedClass);

    const { data: existingStudent, error: existingError } = await supabase
      .from("class_rosters")
      .select("*")
      .eq("class_id", selectedClassId)
      .eq("student_username", cleanStudentUsername)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing student:", JSON.stringify(existingError, null, 2));
      alert(existingError.message || JSON.stringify(existingError));
      setMessage("Could not check whether this student already exists.");
      return;
    }

    if (existingStudent) {
      setMessage("This student is already in the selected shared class.");
      setStudentUsername("");
      return;
    }

    const { error } = await supabase.from("class_rosters").insert([
      {
        class_id: selectedClassId,
        teacher_username: currentUser.username,
        teacher_name: currentUser.username,
        class_name: classDisplayName,
        student_username: cleanStudentUsername,
        student_name: cleanStudentUsername,
      },
    ]);

    if (error) {
      console.error("Error adding student:", JSON.stringify(error, null, 2));
      alert(error.message || JSON.stringify(error));
      setMessage(error.message || "Could not add student.");
      return;
    }

    setStudentUsername("");
    setMessage("Student added to shared class.");
    await loadSelectedClassData(selectedClassId);
  }

  async function addCoTeacherToClass() {
    setMessage("");

    if (!selectedClassId || !selectedClass) {
      setMessage("Please select or create a class first.");
      return;
    }

    if (!coTeacherEmailOrUsername.trim()) {
      setMessage("Please enter the co-teacher username or email.");
      return;
    }

    const rawValue = coTeacherEmailOrUsername.trim().toLowerCase();
    const teacherEmail = rawValue.includes("@") ? rawValue : "";
    const teacherUsername = cleanUsername(rawValue);

    const { data: existingTeacher, error: existingError } = await supabase
      .from("class_teachers")
      .select("*")
      .eq("class_id", selectedClassId)
      .eq("teacher_username", teacherUsername)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing co-teacher:", JSON.stringify(existingError, null, 2));
      alert(existingError.message || JSON.stringify(existingError));
      setMessage("Could not check whether this co-teacher already exists.");
      return;
    }

    if (existingTeacher) {
      setMessage("This co-teacher is already attached to the selected shared class.");
      setCoTeacherEmailOrUsername("");
      return;
    }

    const { error } = await supabase.from("class_teachers").insert([
      {
        class_id: selectedClassId,
        teacher_username: teacherUsername,
        teacher_name: teacherUsername,
        teacher_email: teacherEmail,
        role: "teacher",
      },
    ]);

    if (error) {
      console.error("Error adding co-teacher:", JSON.stringify(error, null, 2));
      alert(error.message || JSON.stringify(error));
      setMessage(error.message || "Could not add co-teacher.");
      return;
    }

    setCoTeacherEmailOrUsername("");
    setMessage("Co-teacher added.");
    await loadSelectedClassData(selectedClassId);
  }

  async function removeStudent(rosterId, studentUsernameToRemove) {
    const confirmed = window.confirm(
      `Remove ${studentUsernameToRemove} from this shared class?`
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("class_rosters")
      .delete()
      .eq("id", rosterId);

    if (error) {
      console.error("Error removing student:", JSON.stringify(error, null, 2));
      alert(error.message || JSON.stringify(error));
      setMessage("Could not remove student.");
      return;
    }

    setMessage("Student removed from class.");
    await loadSelectedClassData(selectedClassId);
  }

  async function removeCoTeacher(teacherRow) {
    if (teacherRow.teacher_username === currentUser.username) {
      setMessage("You cannot remove yourself from the class here.");
      return;
    }

    const confirmed = window.confirm(
      `Remove ${teacherRow.teacher_username} as a co-teacher?`
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("class_teachers")
      .delete()
      .eq("id", teacherRow.id);

    if (error) {
      console.error("Error removing co-teacher:", JSON.stringify(error, null, 2));
      alert(error.message || JSON.stringify(error));
      setMessage("Could not remove co-teacher.");
      return;
    }

    setMessage("Co-teacher removed.");
    await loadSelectedClassData(selectedClassId);
  }

  function logout() {
    window.location.href = "/logout";
  }

  if (!currentUser || loading) {
    return (
      <main style={pageStyle}>
        <p style={{ padding: "40px" }}>Loading class activity...</p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <nav style={navStyle}>
        <h2 style={logoStyle}>Vonnect</h2>

        <div style={navLinksStyle}>
          <a href="/teacher" style={linkStyle}>Teacher Dashboard</a>
          <a href="/teacher/add-opportunity" style={linkStyle}>Add Opportunity</a>
          <a href="/teacher/signups" style={linkStyle}>Signups</a>
          <a href="/leaderboard" style={linkStyle}>Leaderboard</a>

          <button style={logoutButtonStyle} onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      <section style={headerStyle}>
        <h1 style={titleStyle}>Student Volunteer Activity</h1>
        <p style={subtitleStyle}>
          Select a student to view their hours, activities, notes, signatures, and attachments.
        </p>

        <p style={userInfoStyle}>
          Teacher: {currentUser.displayName} | Username: {currentUser.username}
        </p>
      </section>

      <section style={topPanelStyle}>
        <div style={classSelectorCardStyle}>
          <div style={{ flex: 1 }}>
            <h2 style={sectionTitleStyle}>Selected Class</h2>

            {classes.length === 0 ? (
              <p style={emptyTextStyle}>
                No shared classes yet. Open Class Management to create one.
              </p>
            ) : (
              <select
                style={inputStyle}
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
              >
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {getClassDisplayName(classItem)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            style={secondaryButtonStyle}
            onClick={() => setShowClassManagement(!showClassManagement)}
          >
            {showClassManagement ? "Hide Class Management" : "Show Class Management"}
          </button>
        </div>

        {showClassManagement && (
          <div style={managementGridStyle}>
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>Create Shared Class</h2>

              <label style={labelStyle}>Class Name</label>
              <input
                style={inputStyle}
                placeholder="Example: NJHS 8th Grade"
                value={newClassName}
                onChange={(event) => setNewClassName(event.target.value)}
              />

              <button style={primaryButtonStyle} onClick={createSharedClass}>
                Create Shared Class
              </button>
            </div>

            {selectedClass && (
              <>
                <div style={cardStyle}>
                  <h2 style={sectionTitleStyle}>Add Student</h2>

                  <label style={labelStyle}>Student Username</label>
                  <input
                    style={inputStyle}
                    placeholder="Example: mirayajoshi"
                    value={studentUsername}
                    onChange={(event) => setStudentUsername(event.target.value)}
                  />

                  <button style={primaryButtonStyle} onClick={addStudentToClass}>
                    Add Student
                  </button>
                </div>

                <div style={cardStyle}>
                  <h2 style={sectionTitleStyle}>Add Co-Teacher</h2>

                  <label style={labelStyle}>Teacher Email or Username</label>
                  <input
                    style={inputStyle}
                    placeholder="Example: smithj@coppellisd.com or smithj"
                    value={coTeacherEmailOrUsername}
                    onChange={(event) =>
                      setCoTeacherEmailOrUsername(event.target.value)
                    }
                  />

                  <button style={primaryButtonStyle} onClick={addCoTeacherToClass}>
                    Add Co-Teacher
                  </button>
                </div>

                <div style={cardStyle}>
                  <h2 style={sectionTitleStyle}>Teachers</h2>

                  {classTeachers.length === 0 ? (
                    <p style={emptyTextStyle}>No teachers found.</p>
                  ) : (
                    <div style={miniListStyle}>
                      {classTeachers.map((teacher) => (
                        <div style={miniListItemStyle} key={teacher.id}>
                          <span>{teacher.teacher_username}</span>

                          {teacher.teacher_username !== currentUser.username && (
                            <button
                              style={smallDangerButtonStyle}
                              onClick={() => removeCoTeacher(teacher)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={cardStyle}>
                  <h2 style={sectionTitleStyle}>Students</h2>

                  {classStudents.length === 0 ? (
                    <p style={emptyTextStyle}>No students added yet.</p>
                  ) : (
                    <div style={miniListStyle}>
                      {classStudents.map((student) => (
                        <div style={miniListItemStyle} key={student.id}>
                          <span>{student.student_username}</span>

                          <button
                            style={smallDangerButtonStyle}
                            onClick={() =>
                              removeStudent(student.id, student.student_username)
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {message && <p style={messageStyle}>{message}</p>}
      </section>

      <section style={statsSectionStyle}>
        <div style={summaryGridStyle}>
          <div style={summaryCardStyle}>
            <h3 style={summaryNumberStyle}>{classTotals.totalStudents}</h3>
            <p style={summaryLabelStyle}>Students</p>
          </div>

          <div style={summaryCardStyle}>
            <h3 style={summaryNumberStyle}>{classTotals.approvedHours.toFixed(1)}</h3>
            <p style={summaryLabelStyle}>Approved / Completed Hours</p>
          </div>

          <div style={summaryCardStyle}>
            <h3 style={summaryNumberStyle}>{classTotals.submittedHours.toFixed(1)}</h3>
            <p style={summaryLabelStyle}>Submitted Hours</p>
          </div>

          <div style={summaryCardStyle}>
            <h3 style={summaryNumberStyle}>{classTotals.totalActivities}</h3>
            <p style={summaryLabelStyle}>Activities</p>
          </div>

          <div style={summaryCardStyle}>
            <h3 style={summaryNumberStyle}>{classTotals.totalAttachments}</h3>
            <p style={summaryLabelStyle}>Attachments</p>
          </div>
        </div>

        <div style={mainStatsCardStyle}>
          <h2 style={sectionTitleStyle}>Choose a Student</h2>

          {studentActivityGroups.length === 0 ? (
            <p style={emptyTextStyle}>No students in this class yet.</p>
          ) : (
            <div style={studentButtonGridStyle}>
              {studentActivityGroups.map((student) => {
                const isSelected = student.username === selectedStudentUsername;

                return (
                  <button
                    key={student.username}
                    style={{
                      ...studentSelectButtonStyle,
                      ...(isSelected ? selectedStudentSelectButtonStyle : {}),
                    }}
                    onClick={() => setSelectedStudentUsername(student.username)}
                  >
                    <strong>{student.username}</strong>
                    <span>{student.approvedHours.toFixed(1)} approved hrs</span>
                    <span>{student.activityCount} activities</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedStudent && (
          <div style={studentCardStyle}>
            <div style={studentHeaderStyle}>
              <div>
                <h2 style={studentNameStyle}>{selectedStudent.username}</h2>
                <p style={studentMetaStyle}>
                  {selectedStudent.activityCount} activities |{" "}
                  {selectedStudent.attachmentCount} attachments |{" "}
                  {selectedStudent.totalSubmittedHours.toFixed(1)} submitted hours
                </p>
              </div>

              <div style={studentHoursBoxStyle}>
                <strong>{selectedStudent.approvedHours.toFixed(1)}</strong>
                <span>approved hrs</span>
              </div>
            </div>

            {selectedStudent.activities.length === 0 ? (
              <p style={emptyTextStyle}>No activities submitted yet.</p>
            ) : (
              <div style={activityListStyle}>
                {selectedStudent.activities.map((activity) => (
                  <div style={activityCardStyle} key={activity.id}>
                    <div style={activityTopRowStyle}>
                      <div>
                        <h3 style={activityTitleStyle}>{activity.title}</h3>
                        <p style={activitySourceStyle}>{activity.source}</p>
                      </div>

                      <span style={statusBadgeStyle}>{activity.status}</span>
                    </div>

                    <div style={activityDetailsGridStyle}>
                      <p style={detailTextStyle}>
                        <strong>Date:</strong>{" "}
                        {activity.date
                          ? new Date(activity.date).toLocaleDateString()
                          : "Not provided"}
                      </p>

                      <p style={detailTextStyle}>
                        <strong>Hours:</strong> {activity.hours}
                      </p>

                      <p style={detailTextStyle}>
                        <strong>Organization / Location:</strong>{" "}
                        {activity.organization}
                      </p>

                      <p style={detailTextStyle}>
                        <strong>Contact / Teacher:</strong> {activity.contact}
                      </p>

                      <p style={detailTextStyle}>
                        <strong>Category:</strong> {activity.category}
                      </p>

                      <p style={detailTextStyle}>
                        <strong>Signature:</strong>{" "}
                        {activity.signature || "Not provided"}
                      </p>
                    </div>

                    {activity.notes && (
                      <p style={notesStyle}>
                        <strong>Notes:</strong> {activity.notes}
                      </p>
                    )}

                    {activity.attachmentUrl ? (
                      <a
                        style={attachmentLinkStyle}
                        href={activity.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Attachment
                        {activity.attachmentName
                          ? `: ${activity.attachmentName}`
                          : ""}
                      </a>
                    ) : (
                      <p style={noAttachmentStyle}>No attachment uploaded.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

const pageStyle = {
  fontFamily: "Roboto, Segoe UI, Arial",
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
  padding: "60px 40px",
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

const topPanelStyle = {
  padding: "30px 40px 10px",
};

const classSelectorCardStyle = {
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "16px",
  padding: "24px",
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  alignItems: "end",
};

const managementGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "20px",
  marginTop: "20px",
};

const cardStyle = {
  backgroundColor: "white",
  padding: "24px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
};

const sectionTitleStyle = {
  color: "#111827",
  marginTop: 0,
};

const labelStyle = {
  display: "block",
  marginTop: "16px",
  marginBottom: "8px",
  color: "#111827",
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #9ca3af",
  borderRadius: "8px",
  fontSize: "16px",
  color: "#111827",
  backgroundColor: "white",
};

const primaryButtonStyle = {
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

const secondaryButtonStyle = {
  padding: "12px 18px",
  backgroundColor: "#111827",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const emptyTextStyle = {
  color: "#6b7280",
  fontSize: "16px",
};

const messageStyle = {
  backgroundColor: "#ecfdf5",
  color: "#047857",
  border: "1px solid #86efac",
  padding: "14px",
  borderRadius: "10px",
  textAlign: "center",
  fontWeight: 700,
  marginTop: "20px",
};

const miniListStyle = {
  display: "grid",
  gap: "10px",
};

const miniListItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  backgroundColor: "#f9fafb",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  color: "#111827",
};

const smallDangerButtonStyle = {
  padding: "7px 10px",
  backgroundColor: "#b91c1c",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
};

const statsSectionStyle = {
  padding: "30px 40px 50px",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "18px",
  marginBottom: "24px",
};

const summaryCardStyle = {
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "16px",
  padding: "22px",
  textAlign: "center",
};

const summaryNumberStyle = {
  fontSize: "34px",
  color: "#2563eb",
  margin: 0,
};

const summaryLabelStyle = {
  color: "#374151",
  margin: "8px 0 0",
  fontWeight: 700,
};

const mainStatsCardStyle = {
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "16px",
  padding: "24px",
  marginBottom: "24px",
};

const studentButtonGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
};

const studentSelectButtonStyle = {
  border: "1px solid #d1d5db",
  backgroundColor: "#f9fafb",
  color: "#111827",
  borderRadius: "14px",
  padding: "16px",
  cursor: "pointer",
  display: "grid",
  gap: "6px",
  textAlign: "left",
  fontSize: "15px",
};

const selectedStudentSelectButtonStyle = {
  border: "2px solid #2563eb",
  backgroundColor: "#dbeafe",
};

const studentCardStyle = {
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "18px",
  padding: "24px",
};

const studentHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  alignItems: "center",
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: "16px",
  marginBottom: "18px",
};

const studentNameStyle = {
  color: "#111827",
  margin: 0,
  fontSize: "26px",
};

const studentMetaStyle = {
  color: "#6b7280",
  margin: "6px 0 0",
};

const studentHoursBoxStyle = {
  display: "grid",
  gap: "4px",
  textAlign: "center",
  color: "#2563eb",
  fontSize: "20px",
};

const activityListStyle = {
  display: "grid",
  gap: "16px",
};

const activityCardStyle = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "18px",
};

const activityTopRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "start",
};

const activityTitleStyle = {
  color: "#111827",
  margin: 0,
  fontSize: "20px",
};

const activitySourceStyle = {
  color: "#6b7280",
  margin: "6px 0 0",
};

const statusBadgeStyle = {
  backgroundColor: "#dbeafe",
  color: "#1d4ed8",
  padding: "7px 10px",
  borderRadius: "999px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const activityDetailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "10px",
  marginTop: "16px",
};

const detailTextStyle = {
  color: "#374151",
  margin: 0,
  lineHeight: "1.5",
};

const notesStyle = {
  color: "#374151",
  backgroundColor: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "12px",
  marginTop: "14px",
  lineHeight: "1.5",
};

const attachmentLinkStyle = {
  display: "inline-block",
  marginTop: "14px",
  color: "#2563eb",
  fontWeight: 700,
  textDecoration: "none",
};

const noAttachmentStyle = {
  marginTop: "14px",
  color: "#9ca3af",
  fontStyle: "italic",
};