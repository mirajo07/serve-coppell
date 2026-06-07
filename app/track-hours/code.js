"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TrackHoursPage() {
  const [currentUser, setCurrentUser] = useState(null);

  const [activityName, setActivityName] = useState("");
  const [organization, setOrganization] = useState("");
  const [organizationContact, setOrganizationContact] = useState("");
  const [selectedPastContact, setSelectedPastContact] = useState("");
  const [category, setCategory] = useState("Community Service");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);

  const [savedHours, setSavedHours] = useState([]);
  const [message, setMessage] = useState("");
  const [showSavedPopup, setShowSavedPopup] = useState(false);

  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    async function loadHours() {
      const authenticatedUser = await getAuthenticatedAppUser();

      if (!authenticatedUser) {
        window.location.href = "/login";
        return;
      }

      if (authenticatedUser.role.toLowerCase() !== "student") {
        alert("Only students can track volunteer hours.");
        window.location.href = "/teacher";
        return;
      }

      setCurrentUser(authenticatedUser);

      const { data, error } = await supabase
        .from("volunteer_hours")
        .select("*")
        .eq("student_username", authenticatedUser.username)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading volunteer hours:", error);
        setMessage("Could not load saved hours.");
        return;
      }

      const formattedHours = data.map((entry) => ({
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
        attachmentUrl: entry.attachment_url,
        status: entry.status,
      }));

      setSavedHours(formattedHours);
    }

    loadHours();
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

  function clearForm() {
    setActivityName("");
    setOrganization("");
    setOrganizationContact("");
    setSelectedPastContact("");
    setCategory("Community Service");
    setDate("");
    setHours("");
    setNotes("");
    setAttachmentName("");
    setAttachmentFile(null);
    setMessage("");
  }

  function askToClearForm() {
    setConfirmMessage("Are you sure you want to clear this form?");
    setConfirmAction(() => clearForm);
    setShowConfirmPopup(true);
  }

  async function saveHours() {
    setMessage("");

    if (!currentUser) {
      setMessage("You must be logged in to save hours.");
      return;
    }

    const missingFields = [];

    if (!activityName.trim()) {
      missingFields.push("Activity Name");
    }

    if (!organization.trim()) {
      missingFields.push("Organization");
    }

    if (!organizationContact.trim()) {
      missingFields.push("Organization Contact Info");
    }

    if (!date) {
      missingFields.push("Date");
    }

    if (!hours || Number(hours) <= 0) {
      missingFields.push("Hours Completed");
    }

    if (missingFields.length > 0) {
      setMessage(`Please complete: ${missingFields.join(", ")}.`);
      return;
    }

    let uploadedAttachment = {
      fileName: "",
      fileUrl: "",
    };

    if (attachmentFile) {
      try {
        uploadedAttachment = await uploadAttachment(
          attachmentFile,
          currentUser.username
        );
      } catch (uploadError) {
        console.error("Error uploading attachment:", uploadError);
        setMessage(
          "The form is complete, but the attachment could not be uploaded. Try a smaller file or save without an attachment."
        );
        return;
      }
    }

    const newEntryForSupabase = {
      student_username: currentUser.username,
      student_name: currentUser.displayName,
      class_name: currentUser.className || "",
      event_name: activityName.trim(),
      organization: organization.trim(),
      organization_contact: organizationContact.trim(),
      category,
      event_date: date,
      hours: Number(hours),
      notes: notes.trim(),
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
      console.error("Error saving volunteer hours:", error);
      setMessage("Hours could not be saved.");
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
      attachmentName: data.attachment_name,
      attachmentUrl: data.attachment_url,
      status: data.status,
    };

    setSavedHours((previousHours) => [newEntryForPage, ...previousHours]);

    clearForm();
    setMessage("Hours saved successfully.");
    setShowSavedPopup(true);
  }

  function askToDeleteEntry(entryId) {
    setConfirmMessage("Are you sure you want to delete this saved hour entry?");
    setConfirmAction(() => () => deleteEntry(entryId));
    setShowConfirmPopup(true);
  }

  async function deleteEntry(entryId) {
    const { error } = await supabase
      .from("volunteer_hours")
      .delete()
      .eq("id", entryId);

    if (error) {
      console.error("Error deleting volunteer hour entry:", error);
      setMessage("Hour entry could not be deleted.");
      return;
    }

    const updatedHours = savedHours.filter((entry) => {
      return entry.id !== entryId;
    });

    setSavedHours(updatedHours);
    setMessage("Hour entry deleted.");
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

  if (!currentUser) {
    return null;
  }

  const mySavedHours = savedHours.filter((entry) => {
    return entry.studentUsername === currentUser.username;
  });

  const myTotalHours = mySavedHours.reduce((total, entry) => {
    return total + Number(entry.hours);
  }, 0);

  const pastContacts = [];

  mySavedHours.forEach((entry) => {
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
    setSelectedPastContact(value);

    if (value === "new") {
      setOrganizationContact("");
      return;
    }

    const selectedContact = pastContacts.find((contact) => {
      return contact.organizationContact === value;
    });

    if (selectedContact) {
      setOrganizationContact(selectedContact.organizationContact);

      if (!organization) {
        setOrganization(selectedContact.organization);
      }
    }
  }

  return (
    <main style={pageStyle}>
      {showSavedPopup && (
        <div style={popupOverlayStyle} onClick={() => setShowSavedPopup(false)}>
          <div style={popupCardStyle}>
            <h2 style={popupTitleStyle}>Saved!</h2>
            <p style={popupTextStyle}>
              Your volunteer hours were saved successfully.
            </p>
            <p style={popupHintStyle}>Click anywhere to close.</p>
          </div>
        </div>
      )}

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
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <section style={headerStyle}>
        <h1 style={titleStyle}>Track Volunteer Hours</h1>
        <p style={subtitleStyle}>
          Logged in as {currentUser.displayName}. Manually save your hours here.
        </p>
      </section>

      <section style={summarySectionStyle}>
        <div style={summaryCardStyle}>
          <h2 style={summaryNumberStyle}>{myTotalHours}</h2>
          <p style={summaryTextStyle}>Manually Tracked Hours</p>
        </div>

        <div style={summaryCardStyle}>
          <h2 style={summaryNumberStyle}>{mySavedHours.length}</h2>
          <p style={summaryTextStyle}>My Activities</p>
        </div>
      </section>

      <section style={formSectionStyle}>
        <div style={formCardStyle}>
          <label style={labelStyle}>Activity Name *</label>
          <input
            style={inputStyle}
            placeholder="Example: Food Drive"
            value={activityName}
            onChange={(event) => setActivityName(event.target.value)}
          />

          <label style={labelStyle}>Organization *</label>
          <input
            style={inputStyle}
            placeholder="Example: Metrocrest Services"
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
          />

          <label style={labelStyle}>Choose Past Contact Info</label>
          <select
            style={inputStyle}
            value={selectedPastContact}
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
            value={organizationContact}
            onChange={(event) => setOrganizationContact(event.target.value)}
          />

          <label style={labelStyle}>Category</label>
          <select
            style={inputStyle}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="Community Service">Community Service</option>
            <option value="Food & Hunger">Food & Hunger</option>
            <option value="Environment">Environment</option>
            <option value="Animals">Animals</option>
            <option value="Library / Education">Library / Education</option>
            <option value="Arts">Arts</option>
            <option value="Hospital / Healthcare">Hospital / Healthcare</option>
            <option value="Senior Support">Senior Support</option>
            <option value="School">School</option>
          </select>

          <label style={labelStyle}>Date *</label>
          <input
            style={inputStyle}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />

          <label style={labelStyle}>Hours Completed *</label>
          <input
            style={inputStyle}
            type="number"
            placeholder="Example: 3"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
          />

          <label style={labelStyle}>Notes</label>
          <textarea
            style={textAreaStyle}
            placeholder="Write anything important about this activity..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />

          <label style={labelStyle}>Upload Attachment</label>
          <input
            style={inputStyle}
            type="file"
            onChange={(event) => {
              if (event.target.files.length > 0) {
                setAttachmentFile(event.target.files[0]);
                setAttachmentName(event.target.files[0].name);
              } else {
                setAttachmentFile(null);
                setAttachmentName("");
              }
            }}
          />

          {attachmentName && (
            <p style={attachmentTextStyle}>Attached: {attachmentName}</p>
          )}

          <div style={formButtonRowStyle}>
            <button style={buttonStyle} onClick={saveHours}>
              Save Hours
            </button>

            <button style={clearButtonStyle} onClick={askToClearForm}>
              Clear Form
            </button>
          </div>

          {message && <p style={messageStyle}>{message}</p>}
        </div>
      </section>

      <section style={savedSectionStyle}>
        <h2 style={savedTitleStyle}>My Saved Volunteer Hours</h2>

        {mySavedHours.length === 0 ? (
          <p style={emptyTextStyle}>You have not saved any hours yet.</p>
        ) : (
          <div style={savedListStyle}>
            {mySavedHours.map((entry) => (
              <div style={savedCardStyle} key={entry.id}>
                <h3 style={savedCardTitleStyle}>{entry.activityName}</h3>

                <p>
                  <strong>Organization:</strong> {entry.organization}
                </p>

                <p>
                  <strong>Organization Contact:</strong>{" "}
                  {entry.organizationContact || "Not provided"}
                </p>

                <p>
                  <strong>Category:</strong> {entry.category}
                </p>

                <p>
                  <strong>Date:</strong> {entry.date}
                </p>

                <p>
                  <strong>Hours:</strong> {entry.hours}
                </p>

                <p>
                  <strong>Status:</strong> {entry.status}
                </p>

                <p>
                  <strong>Notes:</strong> {entry.notes || "No notes entered"}
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

                <button
                  style={deleteButtonStyle}
                  onClick={() => askToDeleteEntry(entry.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

const pageStyle = {
  fontFamily: "Roboto,Segoe UI, Arial",
  backgroundColor: "#f9fafb",
  minHeight: "100vh",
};

const headerStyle = {
  padding: "60px 40px",
  textAlign: "center",
  backgroundColor: "#c7ebfa",
};

const titleStyle = {
  fontSize: "42px",
  marginBottom: "16px",
  color: "#111827",
};

const subtitleStyle = {
  fontSize: "18px",
  color: "#374151",
};

const summarySectionStyle = {
  display: "flex",
  gap: "24px",
  justifyContent: "center",
  padding: "40px 40px 0",
};

const summaryCardStyle = {
  backgroundColor: "white",
  padding: "24px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
  width: "240px",
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

const formSectionStyle = {
  padding: "50px 40px",
  display: "flex",
  justifyContent: "center",
};

const formCardStyle = {
  width: "100%",
  maxWidth: "650px",
  backgroundColor: "white",
  padding: "32px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  marginTop: "18px",
  fontWeight: 600,
  color: "#111827",
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

const textAreaStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #9ca3af",
  borderRadius: "8px",
  fontSize: "16px",
  minHeight: "100px",
  color: "#111827",
  backgroundColor: "white",
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

const formButtonRowStyle = {
  display: "flex",
  gap: "12px",
  marginTop: "24px",
};

const buttonStyle = {
  flex: 1,
  padding: "14px",
  backgroundColor: "#047857",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "16px",
};

const clearButtonStyle = {
  flex: 1,
  padding: "14px",
  backgroundColor: "#6b7280",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "16px",
};

const messageStyle = {
  marginTop: "16px",
  color: "#047857",
  fontWeight: 700,
  textAlign: "center",
};

const savedSectionStyle = {
  padding: "20px 40px 60px",
  maxWidth: "900px",
  margin: "0 auto",
};

const savedTitleStyle = {
  textAlign: "center",
  fontSize: "30px",
  color: "#111827",
  marginBottom: "24px",
};

const emptyTextStyle = {
  textAlign: "center",
  color: "#374151",
  fontSize: "17px",
};

const savedListStyle = {
  display: "grid",
  gap: "20px",
};

const savedCardStyle = {
  backgroundColor: "white",
  color: "#111827",
  padding: "24px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const savedCardTitleStyle = {
  color: "#047857",
  marginTop: 0,
};

const deleteButtonStyle = {
  marginTop: "12px",
  padding: "10px 16px",
  backgroundColor: "#b91c1c",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
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

const popupTitleStyle = {
  color: "#047857",
  fontSize: "32px",
  marginBottom: "12px",
};

const confirmTitleStyle = {
  color: "#111827",
  fontSize: "30px",
  marginBottom: "12px",
};

const popupTextStyle = {
  color: "#374151",
  fontSize: "17px",
  lineHeight: "1.5",
};

const popupHintStyle = {
  color: "#6b7280",
  fontSize: "14px",
  marginTop: "12px",
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
};