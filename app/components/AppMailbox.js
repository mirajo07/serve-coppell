"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AppMailbox() {
  const [currentUser, setCurrentUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [signups, setSignups] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [feedbackMessages, setFeedbackMessages] = useState([]);
  const [lastOpenedAt, setLastOpenedAt] = useState("");

  const [feedbackType, setFeedbackType] = useState("Bug");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [sendAnonymous, setSendAnonymous] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadMailbox() {
      const user = await getAuthenticatedAppUser();

      if (!user) {
        return;
      }

      setCurrentUser(user);

      const storageKey = getMailboxStorageKey(user);
      const savedLastOpenedAt = localStorage.getItem(storageKey) || "";
      setLastOpenedAt(savedLastOpenedAt);

      await loadNotifications(user);
    }

    loadMailbox();
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

      if (email.endsWith("@g.coppellisd.com")) {
        role = "student";
      } else if (
        email.endsWith("@coppellisd.com") ||
        email === "mjatx07@gmail.com"
      ) {
        role = "teacher";
      } else {
        return null;
      }

      const username = email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      const displayName =
        auth0User.name ||
        auth0User.nickname ||
        auth0User.given_name ||
        username;

      return {
        displayName,
        username,
        email,
        role,
      };
    } catch (error) {
      console.error("Mailbox auth error:", error);
      return null;
    }
  }

  function getMailboxStorageKey(user) {
    return `vonnect-mailbox-last-opened-${user.role}-${user.username}`;
  }

  function getNotificationDateValue(item) {
    if (!item || !item.date) {
      return 0;
    }

    const dateValue = new Date(item.date).getTime();

    if (Number.isNaN(dateValue)) {
      return 0;
    }

    return dateValue;
  }

  async function loadNotifications(user) {
    if (user.role === "student") {
      const { data: studentSignups } = await supabase
        .from("signups")
        .select("*")
        .eq("student_username", user.username)
        .order("created_at", { ascending: false });

      setSignups(studentSignups || []);

      const { data: studentClasses } = await supabase
        .from("class_rosters")
        .select("class_id")
        .eq("student_username", user.username);

      const classIds = (studentClasses || [])
        .map((item) => item.class_id)
        .filter(Boolean);

      if (classIds.length > 0) {
        const { data: classOpportunities } = await supabase
          .from("opportunities")
          .select("*")
          .in("class_id", classIds)
          .order("created_at", { ascending: false })
          .limit(10);

        setOpportunities(classOpportunities || []);
      } else {
        setOpportunities([]);
      }
    }

    if (user.role === "teacher") {
      const { data: teacherClasses } = await supabase
        .from("class_teachers")
        .select("class_id")
        .eq("teacher_username", user.username);

      const classIds = (teacherClasses || [])
        .map((item) => item.class_id)
        .filter(Boolean);

      if (classIds.length > 0) {
        const { data: classSignups } = await supabase
          .from("signups")
          .select("*")
          .in("class_id", classIds)
          .order("created_at", { ascending: false })
          .limit(25);

        setSignups(classSignups || []);
      } else {
        setSignups([]);
      }

      const { data: feedbackData } = await supabase
        .from("feedback_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25);

      setFeedbackMessages(feedbackData || []);
    }
  }

  const notifications = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    const items = [];

    if (currentUser.role === "student") {
      signups.forEach((signup) => {
        const status = String(signup.status || "").toLowerCase();

        if (status === "approved") {
          items.push({
            id: `approved-${signup.id}`,
            title: "Opportunity Approved",
            text: `${signup.opportunity_title || "Your opportunity"} was approved.`,
            date: signup.updated_at || signup.created_at,
          });
        }

        if (status === "completed") {
          items.push({
            id: `completed-${signup.id}`,
            title: "Opportunity Completed",
            text: `${signup.opportunity_title || "Your opportunity"} was signed/completed.`,
            date: signup.teacher_signed_at || signup.updated_at || signup.created_at,
          });
        }

        if (status === "needs-signature") {
          items.push({
            id: `signature-${signup.id}`,
            title: "Signature Needed",
            text: `${signup.opportunity_title || "An opportunity"} needs a teacher signature.`,
            date: signup.updated_at || signup.created_at,
          });
        }

        if (status === "disapproved") {
          items.push({
            id: `disapproved-${signup.id}`,
            title: "Opportunity Rejected",
            text: `${signup.opportunity_title || "Your opportunity"} was rejected.`,
            date: signup.updated_at || signup.created_at,
          });
        }
      });

      opportunities.forEach((opportunity) => {
        items.push({
          id: `opportunity-${opportunity.id}`,
          title: "New Opportunity",
          text: `${opportunity.title || "A new opportunity"} was added.`,
          date: opportunity.created_at,
        });
      });
    }

    if (currentUser.role === "teacher") {
      signups.forEach((signup) => {
        const status = String(signup.status || "").toLowerCase();

        if (status === "pending") {
          items.push({
            id: `pending-${signup.id}`,
            title: "New Student Signup",
            text: `${signup.student_username} signed up for ${
              signup.opportunity_title || "an opportunity"
            }.`,
            date: signup.created_at,
          });
        }

        if (status === "needs-signature") {
          items.push({
            id: `teacher-signature-${signup.id}`,
            title: "Signature Needed",
            text: `${signup.student_username} needs a signature for ${
              signup.opportunity_title || "an opportunity"
            }.`,
            date: signup.updated_at || signup.created_at,
          });
        }
      });

      feedbackMessages.forEach((feedback) => {
        items.push({
          id: `feedback-${feedback.id}`,
          title: `Feedback: ${feedback.feedback_type}`,
          text: feedback.is_anonymous
            ? feedback.message
            : `${feedback.sender_username || "Someone"}: ${feedback.message}`,
          date: feedback.created_at,
        });
      });
    }

    return items
      .sort((a, b) => getNotificationDateValue(b) - getNotificationDateValue(a))
      .slice(0, 30);
  }, [currentUser, signups, opportunities, feedbackMessages]);

  const unreadNotifications = useMemo(() => {
    if (!lastOpenedAt) {
      return notifications;
    }

    const lastOpenedTime = new Date(lastOpenedAt).getTime();

    if (Number.isNaN(lastOpenedTime)) {
      return notifications;
    }

    return notifications.filter((item) => {
      return getNotificationDateValue(item) > lastOpenedTime;
    });
  }, [notifications, lastOpenedAt]);

  function toggleMailbox() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen && currentUser) {
      const openedAt = new Date().toISOString();
      const storageKey = getMailboxStorageKey(currentUser);

      localStorage.setItem(storageKey, openedAt);
      setLastOpenedAt(openedAt);
    }
  }

  async function submitFeedback() {
    setMessage("");

    if (!feedbackMessage.trim()) {
      setMessage("Please write your feedback first.");
      return;
    }

    const payload = {
      sender_username: sendAnonymous ? null : currentUser?.username || null,
      sender_email: sendAnonymous ? null : currentUser?.email || null,
      sender_role: currentUser?.role || null,
      sender_name: sendAnonymous ? null : currentUser?.displayName || null,
      is_anonymous: sendAnonymous,
      feedback_type: feedbackType,
      message: feedbackMessage.trim(),
      status: "new",
    };

    const { error } = await supabase.from("feedback_messages").insert([payload]);

    if (error) {
      console.error("Feedback error:", JSON.stringify(error, null, 2));
      setMessage(error.message || "Could not send feedback.");
      return;
    }

    setFeedbackMessage("");
    setFeedbackType("Bug");
    setSendAnonymous(true);
    setMessage("Feedback sent. Thank you!");

    if (currentUser) {
      await loadNotifications(currentUser);
    }
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div style={wrapperStyle}>
      <button style={mailButtonStyle} onClick={toggleMailbox}>
        📬
        {unreadNotifications.length > 0 && (
          <span style={badgeStyle}>{unreadNotifications.length}</span>
        )}
      </button>

      {open && (
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h3 style={panelTitleStyle}>Mailbox</h3>
            <button style={closeButtonStyle} onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div style={sectionStyle}>
            <h4 style={sectionHeadingStyle}>Notifications</h4>

            {notifications.length === 0 ? (
              <p style={emptyTextStyle}>No notifications yet.</p>
            ) : (
              <div style={notificationListStyle}>
                {notifications.map((item) => (
                  <div style={notificationItemStyle} key={item.id}>
                    <strong style={notificationTitleStyle}>{item.title}</strong>
                    <p style={notificationTextStyle}>{item.text}</p>
                    <span style={dateStyle}>
                      {item.date
                        ? new Date(item.date).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={sectionStyle}>
            <h4 style={sectionHeadingStyle}>Send Feedback</h4>

            <select
              style={inputStyle}
              value={feedbackType}
              onChange={(event) => setFeedbackType(event.target.value)}
            >
              <option value="Bug">Bug</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Problem">Problem</option>
              <option value="General">General</option>
            </select>

            <textarea
              style={textareaStyle}
              placeholder="Write a bug, feature idea, problem, or suggestion..."
              value={feedbackMessage}
              onChange={(event) => setFeedbackMessage(event.target.value)}
            />

            <label style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={sendAnonymous}
                onChange={(event) => setSendAnonymous(event.target.checked)}
              />
              Send anonymously
            </label>

            <button style={sendButtonStyle} onClick={submitFeedback}>
              Send Feedback
            </button>

            {message && <p style={messageStyle}>{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

const wrapperStyle = {
  position: "relative",
  display: "inline-block",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const mailButtonStyle = {
  position: "relative",
  width: "42px",
  height: "42px",
  borderRadius: "999px",
  border: "1px solid #d1d5db",
  backgroundColor: "white",
  cursor: "pointer",
  fontSize: "22px",
};

const badgeStyle = {
  position: "absolute",
  top: "-6px",
  right: "-6px",
  backgroundColor: "#dc2626",
  color: "white",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
  minWidth: "20px",
  height: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const panelStyle = {
  position: "absolute",
  top: "50px",
  right: 0,
  width: "380px",
  maxHeight: "80vh",
  overflowY: "auto",
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "16px",
  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
  zIndex: 9999,
  padding: "18px",
};

const panelHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
};

const panelTitleStyle = {
  margin: 0,
  color: "#111827",
};

const closeButtonStyle = {
  border: "none",
  backgroundColor: "#f3f4f6",
  color: "#111827",
  borderRadius: "8px",
  width: "32px",
  height: "32px",
  cursor: "pointer",
  fontSize: "20px",
};

const sectionStyle = {
  borderTop: "1px solid #e5e7eb",
  paddingTop: "14px",
  marginTop: "14px",
};

const sectionHeadingStyle = {
  margin: "0 0 10px",
  color: "#111827",
};

const notificationListStyle = {
  display: "grid",
  gap: "10px",
};

const notificationItemStyle = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "12px",
};

const notificationTitleStyle = {
  color: "#111827",
};

const notificationTextStyle = {
  margin: "6px 0",
  color: "#374151",
  lineHeight: "1.4",
};

const dateStyle = {
  color: "#6b7280",
  fontSize: "12px",
};

const emptyTextStyle = {
  color: "#6b7280",
  margin: 0,
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  marginBottom: "10px",
  color: "#111827",
  backgroundColor: "white",
};

const textareaStyle = {
  width: "100%",
  minHeight: "90px",
  padding: "10px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  resize: "vertical",
  color: "#111827",
  backgroundColor: "white",
};

const checkboxRowStyle = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
  marginTop: "10px",
  color: "#374151",
};

const sendButtonStyle = {
  width: "100%",
  marginTop: "12px",
  padding: "11px",
  border: "none",
  borderRadius: "8px",
  backgroundColor: "#2563eb",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const messageStyle = {
  marginTop: "10px",
  color: "#047857",
  fontWeight: 700,
};