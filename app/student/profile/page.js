"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StudentPdfExportButton from "../../components/StudentPdfExportButton";

export default function StudentProfilePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState("🙂");
  const [volunteerHours, setVolunteerHours] = useState([]);
  const [signups, setSignups] = useState([]);
  const [message, setMessage] = useState("");

  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState(null);

  const [showAddEventPopup, setShowAddEventPopup] = useState(false);
  const [newEventDate, setNewEventDate] = useState("");
  const [newActivityName, setNewActivityName] = useState("");
  const [newOrganization, setNewOrganization] = useState("");
  const [newOrganizationContact, setNewOrganizationContact] = useState("");
  const [newSelectedPastContact, setNewSelectedPastContact] = useState("");
  const [newCategory, setNewCategory] = useState("Community Service");
  const [newHours, setNewHours] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newSignature, setNewSignature] = useState("");
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [newAttachmentFile, setNewAttachmentFile] = useState(null);

  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const avatarOptions = [
    "🙂",
    "😎",
    "🤓",
    "🌟",
    "🚀",
    "🐯",
    "🦊",
    "🐼",
    "🦉",
    "🦋",
    "🌈",
    "⚡",
  ];

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    async function loadStudentData() {
      const authenticatedUser = await getAuthenticatedAppUser();

      if (!authenticatedUser) {
        window.location.href = "/login";
        return;
      }

      if (authenticatedUser.role.toLowerCase() !== "student") {
        window.location.href = "/teacher";
        return;
      }

      setCurrentUser(authenticatedUser);
      setSelectedAvatar(authenticatedUser.avatar || "🙂");

      const { data: hoursData, error: hoursError } = await supabase
        .from("volunteer_hours")
        .select("*")
        .eq("student_username", authenticatedUser.username)
        .order("created_at", { ascending: false });

      if (hoursError) {
        console.error("Error loading student hours:", hoursError);
        setMessage("Could not load volunteer hours.");
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
          signature: entry.signature,
          attachmentName: entry.attachment_name,
          attachmentUrl: entry.attachment_url,
          status: entry.status,
        }));

        setVolunteerHours(formattedHours);
      }

      const { data: signupData, error: signupError } = await supabase
        .from("signups")
        .select("*")
        .eq("student_username", authenticatedUser.username)
        .order("created_at", { ascending: false });

      if (signupError) {
        console.error("Error loading student signups:", signupError);
        setMessage("Could not load teacher event signups.");
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

    loadStudentData();
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
      } else if (email.endsWith("@coppellisd.com")) {
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

  function saveProfile() {
    setMessage("Profile display options saved for this session.");
  }

  function logout() {
    window.location.href = "/logout";
  }

  function goToPreviousMonth() {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  }

  function goToNextMonth() {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  }

  function clearNewEventForm() {
    setNewActivityName("");
    setNewOrganization("");
    setNewOrganizationContact("");
    setNewSelectedPastContact("");
    setNewCategory("Community Service");
    setNewHours("");
    setNewNotes("");
    setNewSignature("");
    setNewAttachmentName("");
    setNewAttachmentFile(null);
  }

  function openAddEventForDay(day) {
    const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

    clearNewEventForm();
    setNewEventDate(dateString);
    setShowAddEventPopup(true);
  }

  function closeAddEventPopup() {
    setShowAddEventPopup(false);
    clearNewEventForm();
    setNewEventDate("");
  }

  async function uploadAttachment(file, studentUsername) {
    if (!file) {
      return {
        fileName: "",
        fileUrl: "",
      };
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${studentUsername}/${Date.now()}-${safeFileName}`;

    const { error } = await supabase.storage
      .from("volunteer-attachments")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from("volunteer-attachments")
      .getPublicUrl(filePath);

    return {
      fileName: file.name,
      fileUrl: data.publicUrl,
    };
  }

  async function saveCalendarEvent() {
    if (
      !newActivityName ||
      !newOrganization ||
      !newOrganizationContact ||
      !newHours ||
      !newSignature
    ) {
      setMessage(
        "Please fill out activity name, organization, organization contact info, hours, and signature."
      );
      return;
    }

    let uploadedAttachment;

    try {
      uploadedAttachment = await uploadAttachment(
        newAttachmentFile,
        currentUser.username
      );
    } catch (uploadError) {
      console.error("Error uploading attachment:", uploadError);
      setMessage("Attachment could not be uploaded.");
      return;
    }

    const newEntryForSupabase = {
      student_username: currentUser.username,
      student_name: currentUser.displayName,
      class_name: currentUser.className || "",
      event_name: newActivityName,
      organization: newOrganization,
      organization_contact: newOrganizationContact,
      category: newCategory,
      event_date: newEventDate,
      hours: Number(newHours),
      notes: newNotes,
      signature: newSignature,
      attachment_name: uploadedAttachment.fileName,
      attachment_url: uploadedAttachment.fileUrl,
      status: "approved",
    };

    const { data, error } = await supabase
      .from("volunteer_hours")
      .insert([newEntryForSupabase])
      .select()
      .single();

    if (error) {
      console.error("Error saving calendar event:", error);
      setMessage("Calendar event could not be saved.");
      return;
    }

    const newEntryForPage = {
      id: data.id,
      studentUsername: data.student_username,
      studentName: data.student_name,
      className: data.class_name,
      activityName: data.event_name,
      organization: data.organization,
      organizationContact: data.organization_contact,
      category: data.category,
      date: data.event_date,
      hours: data.hours,
      notes: data.notes,
      signature: data.signature,
      attachmentName: data.attachment_name,
      attachmentUrl: data.attachment_url,
      status: data.status,
    };

    setVolunteerHours((previousHours) => [newEntryForPage, ...previousHours]);

    closeAddEventPopup();
    setMessage("Calendar event saved successfully.");
  }

  function askToDeleteCalendarEvent(entryId) {
    setConfirmMessage("Are you sure you want to delete this tracked event?");
    setConfirmAction(() => () => deleteCalendarEvent(entryId));
    setShowConfirmPopup(true);
  }

  async function deleteCalendarEvent(entryId) {
    const { error } = await supabase
      .from("volunteer_hours")
      .delete()
      .eq("id", entryId);

    if (error) {
      console.error("Error deleting calendar event:", error);
      setMessage("Tracked event could not be deleted.");
      return;
    }

    const updatedHours = volunteerHours.filter((entry) => {
      return entry.id !== entryId;
    });

    setVolunteerHours(updatedHours);
    setSelectedCalendarEvent(null);
    setMessage("Tracked event deleted.");
  }

  function runConfirmAction() {
    if (confirmAction) {
      confirmAction();
    }

    setShowConfirmPopup(false);
    setConfirmMessage("");
    setConfirmAction(null);
  }

  function cancelConfirmAction() {
    setShowConfirmPopup(false);
    setConfirmMessage("");
    setConfirmAction(null);
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

  if (!currentUser) {
    return null;
  }

  const myManualHours = volunteerHours.filter((entry) => {
    return entry.studentUsername === currentUser.username;
  });

  const myManualHourTotal = myManualHours.reduce((total, entry) => {
    return total + Number(entry.hours);
  }, 0);

  const myTeacherSignups = signups.filter((signup) => {
    return signup.studentUsername === currentUser.username;
  });

  const myCompletedTeacherEvents = myTeacherSignups.filter((signup) => {
    return (
      signup.source === "teacher-opportunity-signup" &&
      signup.status === "completed"
    );
  });

  const myCompletedTeacherHours = myCompletedTeacherEvents.reduce(
    (total, signup) => {
      return total + Number(signup.opportunityHours);
    },
    0
  );

  const myTotalHours = myManualHourTotal + myCompletedTeacherHours;

  const myTotalTrackedActivities =
    myManualHours.length + myCompletedTeacherEvents.length;

  const pendingSignups = myTeacherSignups.filter((signup) => {
    return signup.status === "pending";
  });

  const approvedSignups = myTeacherSignups.filter((signup) => {
    return signup.status === "approved";
  });

  const needsSignatureSignups = myTeacherSignups.filter((signup) => {
    return signup.status === "needs-signature";
  });

  const completedSignups = myTeacherSignups.filter((signup) => {
    return signup.status === "completed";
  });

  const disapprovedSignups = myTeacherSignups.filter((signup) => {
    return signup.status === "disapproved";
  });

  const pastContacts = [];

  myManualHours.forEach((entry) => {
    if (entry.organizationContact) {
      const alreadyExists = pastContacts.some((contact) => {
        return contact.organizationContact === entry.organizationContact;
      });

      if (!alreadyExists) {
        pastContacts.push({
          organization: entry.organization,
          organizationContact: entry.organizationContact,
        });
      }
    }
  });

  function choosePastContact(value) {
    setNewSelectedPastContact(value);

    if (value === "new") {
      setNewOrganizationContact("");
      return;
    }

    const selectedContact = pastContacts.find((contact) => {
      return contact.organizationContact === value;
    });

    if (selectedContact) {
      setNewOrganizationContact(selectedContact.organizationContact);

      if (!newOrganization) {
        setNewOrganization(selectedContact.organization);
      }
    }
  }

  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  const calendarCells = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  const datedManualHours = myManualHours.filter((entry) => {
    return entry.date;
  });

  function getEventsForDay(day) {
    const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

    return datedManualHours.filter((entry) => {
      return entry.date === dateString;
    });
  }

  return (
    <main style={pageStyle}>
      {showConfirmPopup && (
        <div style={popupOverlayStyle}>
          <div style={popupCardStyle}>
            <h2 style={confirmTitleStyle}>Are you sure?</h2>
            <p style={popupTextStyle}>{confirmMessage}</p>

            <div style={confirmButtonRowStyle}>
              <button style={cancelButtonStyle} onClick={cancelConfirmAction}>
                Cancel
              </button>

              <button style={dangerButtonStyle} onClick={runConfirmAction}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddEventPopup && (
        <div style={popupOverlayStyle}>
          <div style={addEventPopupCardStyle}>
            <h2 style={eventPopupTitleStyle}>Add Event</h2>

            <p style={popupTextStyle}>
              <strong>Date:</strong> {newEventDate}
            </p>

            <label style={labelStyle}>Activity Name *</label>
            <input
              style={inputStyle}
              placeholder="Example: Food Drive"
              value={newActivityName}
              onChange={(event) => setNewActivityName(event.target.value)}
            />

            <label style={labelStyle}>Organization *</label>
            <input
              style={inputStyle}
              placeholder="Example: Metrocrest Services"
              value={newOrganization}
              onChange={(event) => setNewOrganization(event.target.value)}
            />

            <label style={labelStyle}>Choose Past Contact Info</label>
            <select
              style={inputStyle}
              value={newSelectedPastContact}
              onChange={(event) => choosePastContact(event.target.value)}
            >
              <option value="">Select a saved contact or add new</option>
              {pastContacts.map((contact) => (
                <option
                  key={contact.organizationContact}
                  value={contact.organizationContact}
                >
                  {contact.organization} — {contact.organizationContact}
                </option>
              ))}
              <option value="new">Add new contact info</option>
            </select>

            <label style={labelStyle}>Organization Contact Info *</label>
            <input
              style={inputStyle}
              placeholder="Example: volunteer@organization.org or 972-123-4567"
              value={newOrganizationContact}
              onChange={(event) =>
                setNewOrganizationContact(event.target.value)
              }
            />

            <label style={labelStyle}>Category</label>
            <select
              style={inputStyle}
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
            >
              <option value="Community Service">Community Service</option>
              <option value="Food & Hunger">Food & Hunger</option>
              <option value="Environment">Environment</option>
              <option value="Animals">Animals</option>
              <option value="Library / Education">Library / Education</option>
              <option value="Arts">Arts</option>
              <option value="Hospital / Healthcare">
                Hospital / Healthcare
              </option>
              <option value="Senior Support">Senior Support</option>
              <option value="School">School</option>
            </select>

            <label style={labelStyle}>Hours Completed *</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="Example: 3"
              value={newHours}
              onChange={(event) => setNewHours(event.target.value)}
            />

            <label style={labelStyle}>Notes</label>
            <textarea
              style={textAreaStyle}
              placeholder="Write anything important about this activity..."
              value={newNotes}
              onChange={(event) => setNewNotes(event.target.value)}
            />

            <label style={labelStyle}>Student Signature *</label>
            <input
              style={inputStyle}
              placeholder="Type your full name"
              value={newSignature}
              onChange={(event) => setNewSignature(event.target.value)}
            />

            <label style={labelStyle}>Upload Attachment</label>
            <input
              style={inputStyle}
              type="file"
              onChange={(event) => {
                if (event.target.files.length > 0) {
                  setNewAttachmentFile(event.target.files[0]);
                  setNewAttachmentName(event.target.files[0].name);
                } else {
                  setNewAttachmentFile(null);
                  setNewAttachmentName("");
                }
              }}
            />

            {newAttachmentName && (
              <p style={attachmentTextStyle}>Attached: {newAttachmentName}</p>
            )}

            <div style={confirmButtonRowStyle}>
              <button style={cancelButtonStyle} onClick={closeAddEventPopup}>
                Cancel
              </button>

              <button style={saveEventButtonStyle} onClick={saveCalendarEvent}>
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCalendarEvent && (
        <div
          style={popupOverlayStyle}
          onClick={() => setSelectedCalendarEvent(null)}
        >
          <div
            style={eventPopupCardStyle}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 style={eventPopupTitleStyle}>
              {selectedCalendarEvent.activityName}
            </h2>

            <p style={popupTextStyle}>
              <strong>Organization:</strong>{" "}
              {selectedCalendarEvent.organization}
            </p>

            <p style={popupTextStyle}>
              <strong>Contact:</strong>{" "}
              {selectedCalendarEvent.organizationContact || "Not provided"}
            </p>

            <p style={popupTextStyle}>
              <strong>Category:</strong> {selectedCalendarEvent.category}
            </p>

            <p style={popupTextStyle}>
              <strong>Date:</strong> {selectedCalendarEvent.date}
            </p>

            <p style={popupTextStyle}>
              <strong>Hours:</strong> {selectedCalendarEvent.hours}
            </p>

            <p style={popupTextStyle}>
              <strong>Attachment:</strong>{" "}
              {selectedCalendarEvent.attachmentUrl ? (
                <a
                  href={selectedCalendarEvent.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={attachmentLinkStyle}
                >
                  {selectedCalendarEvent.attachmentName || "Open Attachment"}
                </a>
              ) : (
                "No attachment uploaded"
              )}
            </p>

            <p style={popupTextStyle}>
              <strong>Notes:</strong>{" "}
              {selectedCalendarEvent.notes || "No notes entered"}
            </p>

            <p style={popupTextStyle}>
              <strong>Signature:</strong> {selectedCalendarEvent.signature}
            </p>

            <div style={confirmButtonRowStyle}>
              <button
                style={cancelButtonStyle}
                onClick={() => setSelectedCalendarEvent(null)}
              >
                Close
              </button>

              <button
                style={dangerButtonStyle}
                onClick={() =>
                  askToDeleteCalendarEvent(selectedCalendarEvent.id)
                }
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      <section style={profileHeaderStyle}>
        <div style={profileHeaderContentStyle}>
          <div style={largeAvatarStyle}>{selectedAvatar}</div>

          <div>
            <h1 style={titleStyle}>Student Dashboard</h1>
            <p style={subtitleStyle}>
              Welcome {currentUser.displayName}! View your account, choose your
              avatar, and check your volunteer progress.
            </p>
          </div>
        </div>
      </section>

      <section style={mainGridStyle}>
        <div style={profileCardStyle}>
          <h2 style={sectionTitleStyle}>Account</h2>

          <p style={cardTextStyle}>
            <strong>Name:</strong> {currentUser.displayName}
          </p>

          <p style={cardTextStyle}>
            <strong>Username:</strong> {currentUser.username}
          </p>

          <p style={cardTextStyle}>
            <strong>Class:</strong> {currentUser.className}
          </p>

          <p style={cardTextStyle}>
            <strong>Role:</strong> {currentUser.role}
          </p>

          <h3 style={subTitleStyle}>Choose Avatar</h3>

          <div style={avatarGridStyle}>
            {avatarOptions.map((avatar) => (
              <button
                key={avatar}
                style={
                  selectedAvatar === avatar
                    ? selectedAvatarButtonStyle
                    : avatarButtonStyle
                }
                onClick={() => setSelectedAvatar(avatar)}
              >
                {avatar}
              </button>
            ))}
          </div>

          <button style={saveButtonStyle} onClick={saveProfile}>
            Save Profile
          </button>

          <button style={logoutButtonLargeStyle} onClick={logout}>
            Logout
          </button>

          <StudentPdfExportButton />

          {message && <p style={messageStyle}>{message}</p>}
        </div>

        <div style={statsCardStyle}>
          <h2 style={sectionTitleStyle}>My Stats</h2>

          <div style={statsGridStyle}>
            <div style={statBoxStyle}>
              <h3 style={statNumberStyle}>{myTotalHours}</h3>
              <p style={statTextStyle}>Total Hours</p>
            </div>

            <div style={statBoxStyle}>
              <h3 style={statNumberStyle}>{myTotalTrackedActivities}</h3>
              <p style={statTextStyle}>Total Tracked Activities</p>
            </div>
          </div>

          <h3 style={subTitleStyle}>Teacher Opportunity Status</h3>

          <div style={statusGridStyle}>
            <div style={statusBoxStyle}>
              <strong>Pending:</strong> {pendingSignups.length}
            </div>

            <div style={statusBoxStyle}>
              <strong>Approved:</strong> {approvedSignups.length}
            </div>

            <div style={statusBoxStyle}>
              <strong>Needs Signature:</strong> {needsSignatureSignups.length}
            </div>

            <div style={statusBoxStyle}>
              <strong>Completed:</strong> {completedSignups.length}
            </div>

            <div style={statusBoxStyle}>
              <strong>Disapproved:</strong> {disapprovedSignups.length}
            </div>
          </div>
        </div>
      </section>

      <section style={calendarSectionStyle}>
        <div style={calendarCardStyle}>
          <div style={calendarHeaderStyle}>
            <button style={monthButtonStyle} onClick={goToPreviousMonth}>
              ← Previous
            </button>

            <h2 style={calendarTitleStyle}>
              {monthNames[calendarMonth]} {calendarYear}
            </h2>

            <button style={monthButtonStyle} onClick={goToNextMonth}>
              Next →
            </button>
          </div>

          <p style={calendarHelperTextStyle}>
            Click a day to add a tracked event. Click an event name to view
            details or delete it.
          </p>

          <div style={dayHeaderGridStyle}>
            {dayNames.map((dayName) => (
              <div style={dayHeaderStyle} key={dayName}>
                {dayName}
              </div>
            ))}
          </div>

          <div style={calendarGridStyle}>
            {calendarCells.map((day, index) => {
              const eventsForDay = day ? getEventsForDay(day) : [];

              return (
                <div
                  style={day ? clickableDayCellStyle : dayCellStyle}
                  key={index}
                  onClick={() => {
                    if (day) {
                      openAddEventForDay(day);
                    }
                  }}
                >
                  {day && <p style={dayNumberStyle}>{day}</p>}

                  {eventsForDay.map((entry) => (
                    <button
                      key={entry.id}
                      style={calendarEventButtonStyle}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedCalendarEvent(entry);
                      }}
                    >
                      {entry.activityName}
                    </button>
                  ))}

                  {day && eventsForDay.length === 0 && (
                    <p style={addHintStyle}>+ Add</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section style={activitySectionStyle}>
        <div style={activityCardStyle}>
          <h2 style={sectionTitleStyle}>My Manual Hours</h2>

          {myManualHours.length === 0 ? (
            <p style={emptyTextStyle}>No manually tracked hours yet.</p>
          ) : (
            <div style={listStyle}>
              {myManualHours.map((entry) => (
                <div style={listItemStyle} key={entry.id}>
                  <h3 style={listTitleStyle}>{entry.activityName}</h3>

                  <p>
                    <strong>Organization:</strong> {entry.organization}
                  </p>

                  <p>
                    <strong>Contact:</strong>{" "}
                    {entry.organizationContact || "Not provided"}
                  </p>

                  <p>
                    <strong>Hours:</strong> {entry.hours}
                  </p>

                  <p>
                    <strong>Date:</strong>{" "}
                    {entry.date ? entry.date : "No date entered"}
                  </p>

                  <p>
                    <strong>Attachment:</strong>{" "}
                    {entry.attachmentUrl ? (
                      <a
                        href={entry.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={attachmentLinkStyle}
                      >
                        {entry.attachmentName || "Open Attachment"}
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

        <div style={activityCardStyle}>
          <h2 style={sectionTitleStyle}>My Teacher Opportunities</h2>

          <div style={statusGridStyle}>
            <div style={statusBoxStyle}>
              <strong>Pending:</strong> {pendingSignups.length}
            </div>

            <div style={statusBoxStyle}>
              <strong>Approved:</strong> {approvedSignups.length}
            </div>

            <div style={statusBoxStyle}>
              <strong>Needs Signature:</strong> {needsSignatureSignups.length}
            </div>

            <div style={statusBoxStyle}>
              <strong>Completed:</strong> {completedSignups.length}
            </div>

            <div style={statusBoxStyle}>
              <strong>Disapproved:</strong> {disapprovedSignups.length}
            </div>
          </div>

          {myTeacherSignups.length === 0 ? (
            <p style={emptyTextStyle}>No teacher event signups yet.</p>
          ) : (
            <div style={listStyle}>
              {myTeacherSignups.map((signup) => (
                <div style={listItemStyle} key={signup.id}>
                  <h3 style={listTitleStyle}>{signup.opportunityTitle}</h3>

                  <p>
                    <strong>Teacher:</strong> {signup.teacherName}
                  </p>

                  <p>
                    <strong>Location:</strong> {signup.opportunityLocation}
                  </p>

                  <p>
                    <strong>Hours:</strong> {signup.opportunityHours}
                  </p>

                  <p>
                    <strong>Status:</strong> {formatStatus(signup.status)}
                  </p>

                  {signup.teacherSigned && (
                    <p>
                      <strong>Teacher Signed At:</strong>{" "}
                      {signup.teacherSignedAt}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

const pageStyle = {
  backgroundColor: "#f9fafb",
  minHeight: "100vh",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const profileHeaderStyle = {
  backgroundColor: "#eff6ff",
  padding: "60px 40px",
  borderBottom: "1px solid #bfdbfe",
};

const profileHeaderContentStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  gap: "24px",
};

const largeAvatarStyle = {
  width: "100px",
  height: "100px",
  borderRadius: "999px",
  backgroundColor: "white",
  border: "3px solid #2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "56px",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const titleStyle = {
  fontSize: "42px",
  color: "#111827",
  margin: 0,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const subtitleStyle = {
  fontSize: "18px",
  color: "#374151",
  lineHeight: "1.6",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 2fr",
  gap: "24px",
  padding: "40px",
};

const profileCardStyle = {
  backgroundColor: "white",
  padding: "28px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
  height: "fit-content",
};

const statsCardStyle = {
  backgroundColor: "white",
  padding: "28px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const sectionTitleStyle = {
  color: "#111827",
  marginTop: 0,
};

const cardTextStyle = {
  color: "#374151",
  lineHeight: "1.5",
};

const subTitleStyle = {
  color: "#111827",
  marginTop: "28px",
};

const avatarGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "10px",
};

const avatarButtonStyle = {
  height: "52px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  backgroundColor: "#f9fafb",
  cursor: "pointer",
  fontSize: "26px",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const selectedAvatarButtonStyle = {
  height: "52px",
  borderRadius: "12px",
  border: "2px solid #2563eb",
  backgroundColor: "#eff6ff",
  cursor: "pointer",
  fontSize: "26px",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const saveButtonStyle = {
  marginTop: "24px",
  width: "100%",
  padding: "12px",
  backgroundColor: "#047857",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const logoutButtonLargeStyle = {
  marginTop: "12px",
  width: "100%",
  padding: "12px",
  backgroundColor: "#b91c1c",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const messageStyle = {
  marginTop: "16px",
  color: "#047857",
  fontWeight: 700,
  textAlign: "center",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "16px",
};

const statBoxStyle = {
  backgroundColor: "#c7ebfa",
  border: "1px solid #d2d6d8",
  borderRadius: "14px",
  padding: "18px",
  textAlign: "center",
};

const statNumberStyle = {
  fontSize: "34px",
  color: "black",
  margin: 0,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const statTextStyle = {
  color: "#374151",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const statusGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: "12px",
};

const statusBoxStyle = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  color: "#374151",
  borderRadius: "10px",
  padding: "14px",
  textAlign: "center",
};

const calendarSectionStyle = {
  padding: "0 40px 40px",
};

const calendarCardStyle = {
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "16px",
  padding: "28px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
};

const calendarHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
};

const calendarTitleStyle = {
  color: "#111827",
  fontSize: "28px",
  fontFamily: "Roboto,Segoe UI, Arial",
  margin: 0,
};

const monthButtonStyle = {
  padding: "10px 16px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const calendarHelperTextStyle = {
  color: "#374151",
  marginBottom: "20px",
};

const dayHeaderGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "8px",
  marginBottom: "8px",
};

const dayHeaderStyle = {
  backgroundColor: "#eff6ff",
  color: "#1d4ed8",
  padding: "12px",
  textAlign: "center",
  borderRadius: "8px",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const calendarGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "8px",
};

const dayCellStyle = {
  minHeight: "110px",
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "8px",
};

const clickableDayCellStyle = {
  minHeight: "110px",
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "8px",
  cursor: "pointer",
};

const dayNumberStyle = {
  color: "#111827",
  fontWeight: 700,
  margin: "0 0 8px",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const addHintStyle = {
  color: "#9ca3af",
  fontSize: "13px",
  marginTop: "24px",
  textAlign: "center",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const calendarEventButtonStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  marginTop: "6px",
  padding: "7px 8px",
  backgroundColor: "#c7ebfa",
  color: "#000000",
  border: "1px solid blue",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "13px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const activitySectionStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px",
  padding: "0 40px 60px",
};

const activityCardStyle = {
  backgroundColor: "white",
  padding: "28px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
};

const emptyTextStyle = {
  color: "#6b7280",
  fontSize: "16px",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const listStyle = {
  display: "grid",
  gap: "16px",
};

const listItemStyle = {
  backgroundColor: "#f9fafb",
  color: "#374151",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "18px",
};

const listTitleStyle = {
  color: "#2563eb",
  marginTop: 0,
};

const popupOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.35)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const popupCardStyle = {
  backgroundColor: "white",
  padding: "36px",
  borderRadius: "18px",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
  textAlign: "center",
  maxWidth: "420px",
  width: "90%",
  border: "1px solid #d1d5db",
};

const eventPopupCardStyle = {
  backgroundColor: "white",
  padding: "32px",
  borderRadius: "18px",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
  maxWidth: "520px",
  width: "90%",
  border: "1px solid #d1d5db",
};

const addEventPopupCardStyle = {
  backgroundColor: "white",
  padding: "32px",
  borderRadius: "18px",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
  maxWidth: "620px",
  width: "90%",
  maxHeight: "85vh",
  overflowY: "auto",
  border: "1px solid #d1d5db",
};

const eventPopupTitleStyle = {
  color: "#2563eb",
  fontSize: "30px",
  marginTop: 0,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const confirmTitleStyle = {
  color: "#111827",
  fontSize: "30px",
  marginBottom: "12px",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const popupTextStyle = {
  color: "#374151",
  fontSize: "17px",
  lineHeight: "1.5",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const confirmButtonRowStyle = {
  display: "flex",
  gap: "12px",
  marginTop: "24px",
};

const cancelButtonStyle = {
  flex: 1,
  padding: "12px",
  backgroundColor: "#6b7280",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const dangerButtonStyle = {
  flex: 1,
  padding: "12px",
  backgroundColor: "#b91c1c",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const saveEventButtonStyle = {
  flex: 1,
  padding: "12px",
  backgroundColor: "#047857",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  marginTop: "18px",
  fontWeight: 600,
  color: "#111827",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #9ca3af",
  borderRadius: "8px",
  fontSize: "16px",
  color: "#111827",
  backgroundColor: "white",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const textAreaStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #9ca3af",
  borderRadius: "8px",
  fontSize: "16px",
  minHeight: "90px",
  color: "#111827",
  backgroundColor: "white",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const attachmentTextStyle = {
  color: "#374151",
  marginTop: "10px",
};

const attachmentLinkStyle = {
  color: "#2563eb",
  fontWeight: 700,
  textDecoration: "underline",
};