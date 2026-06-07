"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AddOpportunityPage() {
  const [currentUser, setCurrentUser] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [hours, setHours] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [category, setCategory] = useState("Community Service");
  const [maxSpots, setMaxSpots] = useState("");
  const [targetClassName, setTargetClassName] = useState("");
  const [teacherClassNames, setTeacherClassNames] = useState([]);

  const [message, setMessage] = useState("");
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [teacherOpportunities, setTeacherOpportunities] = useState([]);

  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    async function loadOpportunities() {
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

      const { data: rosterData, error: rosterError } = await supabase
        .from("class_rosters")
        .select("class_name")
        .eq("teacher_username", authenticatedUser.username);

      if (rosterError) {
        console.error("Error loading teacher classes:", rosterError);
      } else {
        const uniqueClassNames = [
          ...new Set(
            rosterData
              .map((row) => row.class_name)
              .filter((className) => className && className.trim())
          ),
        ];

        setTeacherClassNames(uniqueClassNames);

        if (uniqueClassNames.length > 0) {
          setTargetClassName(uniqueClassNames[0]);
        } else {
          setTargetClassName(authenticatedUser.className || "Teacher Class");
        }
      }

      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("teacher_username", authenticatedUser.username)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading opportunities:", error);
        setMessage("Could not load your posted opportunities.");
        return;
      }

      const formattedOpportunities = data.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        location: item.location,
        hours: item.hours,
        eventDate: item.event_date,
        startTime: item.start_time,
        endTime: item.end_time,
        category: item.category,
        maxSpots: item.max_spots,
        teacherName: item.teacher_name,
        teacherUsername: item.teacher_username,
        className: item.class_name,
        createdAt: item.created_at
          ? new Date(item.created_at).toLocaleString()
          : "",
      }));

      setTeacherOpportunities(formattedOpportunities);
    }

    loadOpportunities();
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

  function clearForm() {
    setTitle("");
    setDescription("");
    setLocation("");
    setHours("");
    setEventDate("");
    setStartTime("");
    setEndTime("");
    setCategory("Community Service");
    setMaxSpots("");
    setMessage("");
  }

  function askToClearForm() {
    setConfirmMessage("Are you sure you want to clear this opportunity form?");
    setConfirmAction(() => clearForm);
    setShowConfirmPopup(true);
  }

  async function saveOpportunity() {
    setMessage("");

    if (!currentUser) {
      setMessage("You must be logged in as a teacher.");
      return;
    }

    if (
      !title.trim() ||
      !description.trim() ||
      !location.trim() ||
      !hours ||
      !eventDate ||
      !startTime ||
      !endTime ||
      !maxSpots ||
      !targetClassName.trim()
    ) {
      setMessage("Please fill out all required fields, including class name.");
      return;
    }

    const newOpportunityForSupabase = {
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      hours: Number(hours),
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime,
      category,
      max_spots: Number(maxSpots),
      teacher_name: currentUser.displayName,
      teacher_username: currentUser.username,
      class_name: targetClassName.trim(),
    };

    const { data, error } = await supabase
      .from("opportunities")
      .insert([newOpportunityForSupabase])
      .select()
      .single();

    if (error) {
      console.error("Error saving opportunity:", error);
      setMessage("Opportunity could not be saved.");
      return;
    }

    const newOpportunityForPage = {
      id: data.id,
      title: data.title,
      description: data.description,
      location: data.location,
      hours: data.hours,
      eventDate: data.event_date,
      startTime: data.start_time,
      endTime: data.end_time,
      category: data.category,
      maxSpots: data.max_spots,
      teacherName: data.teacher_name,
      teacherUsername: data.teacher_username,
      className: data.class_name,
      createdAt: data.created_at
        ? new Date(data.created_at).toLocaleString()
        : new Date().toLocaleString(),
    };

    setTeacherOpportunities((previous) => [
      newOpportunityForPage,
      ...previous,
    ]);

    clearForm();
    setMessage("Opportunity saved successfully!");
    setShowSavedPopup(true);
  }

  function askToDeleteOpportunity(opportunityId) {
    setConfirmMessage(
      "Are you sure you want to delete this opportunity? This will also remove student signups for this opportunity."
    );

    setConfirmAction(() => () => deleteOpportunity(opportunityId));
    setShowConfirmPopup(true);
  }

  async function deleteOpportunity(opportunityId) {
    const { error: signupDeleteError } = await supabase
      .from("signups")
      .delete()
      .eq("opportunity_id", opportunityId);

    if (signupDeleteError) {
      console.error("Error deleting related signups:", signupDeleteError);
      setMessage("Could not delete related student signups.");
      return;
    }

    const { error } = await supabase
      .from("opportunities")
      .delete()
      .eq("id", opportunityId);

    if (error) {
      console.error("Error deleting opportunity:", error);
      setMessage("Opportunity could not be deleted.");
      return;
    }

    const updatedOpportunities = teacherOpportunities.filter((opportunity) => {
      return opportunity.id !== opportunityId;
    });

    setTeacherOpportunities(updatedOpportunities);
    setMessage("Opportunity deleted.");
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

  const myOpportunities = teacherOpportunities.filter((opportunity) => {
    return opportunity.teacherUsername === currentUser.username;
  });

  return (
    <main style={pageStyle}>
      {showSavedPopup && (
        <div style={popupOverlayStyle} onClick={() => setShowSavedPopup(false)}>
          <div style={popupCardStyle}>
            <h2 style={popupTitleStyle}>Saved!</h2>
            <p style={popupTextStyle}>
              Your volunteer opportunity was saved successfully.
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
        <h1 style={titleStyle}>Add Volunteer Opportunity</h1>

        <p style={subtitleStyle}>
          Logged in as {currentUser.displayName}. Opportunities you create will
          show your teacher name and only appear to students in the selected
          class.
        </p>

        <p style={userInfoStyle}>
          Teacher: {currentUser.displayName} | Username: {currentUser.username}
        </p>
      </section>

      <section style={formSectionStyle}>
        <div style={formCardStyle}>
          <label style={labelStyle}>Class for This Opportunity *</label>

          {teacherClassNames.length > 0 ? (
            <select
              style={inputStyle}
              value={targetClassName}
              onChange={(event) => setTargetClassName(event.target.value)}
            >
              {teacherClassNames.map((className) => (
                <option value={className} key={className}>
                  {className}
                </option>
              ))}
            </select>
          ) : (
            <input
              style={inputStyle}
              placeholder="Example: NJHS Period 3"
              value={targetClassName}
              onChange={(event) => setTargetClassName(event.target.value)}
            />
          )}

          <p style={helperTextStyle}>
            Students must be in this class roster to see this teacher
            opportunity.
          </p>

          <label style={labelStyle}>Opportunity Title *</label>
          <input
            style={inputStyle}
            placeholder="Example: School Food Drive"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <label style={labelStyle}>Description *</label>
          <textarea
            style={textAreaStyle}
            placeholder="Describe what students will do..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <label style={labelStyle}>Location *</label>
          <input
            style={inputStyle}
            placeholder="Example: School Cafeteria"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />

          <label style={labelStyle}>Volunteer Hours *</label>
          <input
            style={inputStyle}
            type="number"
            placeholder="Example: 2"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
          />

          <label style={labelStyle}>Event Date *</label>
          <input
            style={inputStyle}
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
          />

          <label style={labelStyle}>Start Time *</label>
          <input
            style={inputStyle}
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />

          <label style={labelStyle}>End Time *</label>
          <input
            style={inputStyle}
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
          />

          <label style={labelStyle}>Maximum Student Spots *</label>
          <input
            style={inputStyle}
            type="number"
            placeholder="Example: 10"
            value={maxSpots}
            onChange={(event) => setMaxSpots(event.target.value)}
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
            <option value="Special Needs / Sports">
              Special Needs / Sports
            </option>
            <option value="Civic / Government">Civic / Government</option>
            <option value="Leadership / Recreation">
              Leadership / Recreation
            </option>
          </select>

          <div style={formButtonRowStyle}>
            <button style={buttonStyle} onClick={saveOpportunity}>
              Save Opportunity
            </button>

            <button style={clearButtonStyle} onClick={askToClearForm}>
              Clear Form
            </button>
          </div>

          {message && <p style={messageStyle}>{message}</p>}
        </div>
      </section>

      <section style={opportunityListSectionStyle}>
        <h2 style={sectionTitleStyle}>My Posted Opportunities</h2>

        {myOpportunities.length === 0 ? (
          <p style={emptyTextStyle}>
            You have not posted any opportunities yet.
          </p>
        ) : (
          <div style={opportunityGridStyle}>
            {myOpportunities.map((opportunity) => (
              <div style={opportunityCardStyle} key={opportunity.id}>
                <h3 style={opportunityTitleStyle}>{opportunity.title}</h3>

                <p>
                  <strong>Class:</strong> {opportunity.className || "Not set"}
                </p>

                <p>
                  <strong>Description:</strong> {opportunity.description}
                </p>

                <p>
                  <strong>Location:</strong> {opportunity.location}
                </p>

                <p>
                  <strong>Date:</strong> {opportunity.eventDate}
                </p>

                <p>
                  <strong>Time:</strong> {opportunity.startTime} -{" "}
                  {opportunity.endTime}
                </p>

                <p>
                  <strong>Hours:</strong> {opportunity.hours}
                </p>

                <p>
                  <strong>Spots:</strong> {opportunity.maxSpots}
                </p>

                <p>
                  <strong>Category:</strong> {opportunity.category}
                </p>

                <p>
                  <strong>Posted:</strong> {opportunity.createdAt}
                </p>

                <button
                  style={deleteButtonStyle}
                  onClick={() => askToDeleteOpportunity(opportunity.id)}
                >
                  Delete Opportunity
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
  backgroundColor: "#f9fafb",
  fontFamily: "Roboto, Segoe UI, Arial",
  minHeight: "100vh",
};

const headerStyle = {
  padding: "70px 40px",
  fontFamily: "Roboto, Segoe UI, Arial",
  textAlign: "center",
  backgroundColor: "#c7ebfa",
};

const titleStyle = {
  fontSize: "42px",
  fontFamily: "Roboto, Segoe UI, Arial",
  color: "#111827",
  marginBottom: "16px",
};

const subtitleStyle = {
  fontSize: "18px",
  color: "#374151",
  maxWidth: "760px",
  margin: "0 auto",
  lineHeight: "1.6",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const userInfoStyle = {
  marginTop: "16px",
  color: "#000000",
  fontWeight: 700,
  fontFamily: "Roboto, Segoe UI, Arial",
};

const helperTextStyle = {
  color: "#374151",
  fontSize: "14px",
  marginTop: "8px",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const formSectionStyle = {
  padding: "50px 40px",
  display: "flex",
  justifyContent: "center",
};

const formCardStyle = {
  width: "100%",
  maxWidth: "700px",
  backgroundColor: "white",
  padding: "32px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  marginTop: "18px",
  fontWeight: 600,
  fontFamily: "Roboto, Segoe UI, Arial",
  color: "#111827",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #9ca3af",
  borderRadius: "8px",
  fontSize: "16px",
  color: "#111827",
  fontFamily: "Roboto, Segoe UI, Arial",
  backgroundColor: "white",
};

const textAreaStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #9ca3af",
  borderRadius: "8px",
  fontSize: "16px",
  fontFamily: "Roboto, Segoe UI, Arial",
  minHeight: "120px",
  color: "#111827",
  backgroundColor: "white",
};

const formButtonRowStyle = {
  display: "flex",
  gap: "12px",
  marginTop: "24px",
};

const buttonStyle = {
  flex: 1,
  padding: "14px",
  backgroundColor: "blue",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "16px",
  fontFamily: "Roboto, Segoe UI, Arial",
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
  fontFamily: "Roboto, Segoe UI, Arial",
};

const messageStyle = {
  marginTop: "18px",
  color: "#047857",
  fontWeight: 700,
  textAlign: "center",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const opportunityListSectionStyle = {
  padding: "20px 40px 70px",
};

const sectionTitleStyle = {
  color: "#111827",
  fontSize: "30px",
  textAlign: "center",
  marginBottom: "24px",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const emptyTextStyle = {
  textAlign: "center",
  color: "#6b7280",
  fontSize: "17px",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const opportunityGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "24px",
};

const opportunityCardStyle = {
  backgroundColor: "white",
  padding: "24px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  color: "#374151",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const opportunityTitleStyle = {
  color: "black",
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
  fontWeight: 700,
  fontFamily: "Roboto, Segoe UI, Arial",
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
  color: "blue",
  fontSize: "32px",
  marginBottom: "12px",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const confirmTitleStyle = {
  color: "#111827",
  fontSize: "30px",
  marginBottom: "12px",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const popupTextStyle = {
  color: "#374151",
  fontSize: "17px",
  lineHeight: "1.5",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const popupHintStyle = {
  color: "#6b7280",
  fontSize: "14px",
  marginTop: "12px",
  fontFamily: "Roboto, Segoe UI, Arial",
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
  fontFamily: "Roboto, Segoe UI, Arial",
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
  fontFamily: "Roboto, Segoe UI, Arial",
};