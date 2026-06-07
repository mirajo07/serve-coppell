"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AIFaqHelper() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "helper",
      text:
        "Hi! I can help with NJHS volunteer-hour questions and event details. Try asking: “What counts as NJHS hours?” or “Tell me about food drive.”",
    },
  ]);

  const [teacherOpportunities, setTeacherOpportunities] = useState([]);
  const [volunteerSignups, setVolunteerSignups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function loadData() {
      const authenticatedUser = await getAuthenticatedAppUser();
      setCurrentUser(authenticatedUser);

      let opportunityQuery = supabase
        .from("opportunities")
        .select("*")
        .order("event_date", { ascending: true });

      if (
        authenticatedUser &&
        authenticatedUser.role &&
        authenticatedUser.role.toLowerCase() === "student"
      ) {
        const { data: rosterData, error: rosterError } = await supabase
          .from("class_rosters")
          .select("class_name")
          .eq("student_username", authenticatedUser.username);

        if (rosterError) {
          console.error("Error loading AI helper roster:", rosterError);
          setTeacherOpportunities([]);
        } else {
          const studentClassNames = rosterData
            .map((row) => row.class_name)
            .filter(Boolean);

          if (studentClassNames.length > 0) {
            opportunityQuery = opportunityQuery.in(
              "class_name",
              studentClassNames
            );

            const { data: opportunityData, error: opportunityError } =
              await opportunityQuery;

            if (opportunityError) {
              console.error(
                "Error loading AI helper opportunities:",
                opportunityError
              );
              setTeacherOpportunities([]);
            } else {
              setTeacherOpportunities(formatOpportunities(opportunityData));
            }
          } else {
            setTeacherOpportunities([]);
          }
        }
      } else if (
        authenticatedUser &&
        authenticatedUser.role &&
        authenticatedUser.role.toLowerCase() === "teacher"
      ) {
        opportunityQuery = opportunityQuery.eq(
          "teacher_username",
          authenticatedUser.username
        );

        const { data: opportunityData, error: opportunityError } =
          await opportunityQuery;

        if (opportunityError) {
          console.error(
            "Error loading AI helper teacher opportunities:",
            opportunityError
          );
          setTeacherOpportunities([]);
        } else {
          setTeacherOpportunities(formatOpportunities(opportunityData));
        }
      } else {
        setTeacherOpportunities([]);
      }

      const { data: signupData, error: signupError } = await supabase
        .from("signups")
        .select("*");

      if (signupError) {
        console.error("Error loading AI helper signups:", signupError);
        setVolunteerSignups([]);
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

        setVolunteerSignups(formattedSignups);
      }
    }

    loadData();
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

  function formatOpportunities(opportunityData) {
    return opportunityData.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      location: item.location,
      eventDate: item.event_date,
      startTime: item.start_time || "",
      endTime: item.end_time || "",
      hours: item.hours || 1,
      category: item.category || "Teacher Uploaded",
      maxSpots: item.max_spots || "",
      teacherName: item.teacher_name || "Unknown Teacher",
      teacherUsername: item.teacher_username || "unknown",
      className: item.class_name || "",
    }));
  }

  function submitQuestion() {
    if (!question.trim()) {
      return;
    }

    const userQuestion = question.trim();

    const userMessage = {
      role: "user",
      text: userQuestion,
    };

    const helperMessage = {
      role: "helper",
      text: getAnswer(userQuestion),
    };

    setMessages([...messages, userMessage, helperMessage]);
    setQuestion("");
  }

  function addQuickQuestion(text) {
    setMessages([
      ...messages,
      {
        role: "user",
        text,
      },
      {
        role: "helper",
        text: getAnswer(text),
      },
    ]);
  }

  function getAnswer(userQuestion) {
    const lowerQuestion = userQuestion.toLowerCase();

    const matchingEvent = teacherOpportunities.find((opportunity) => {
      const title = opportunity.title ? opportunity.title.toLowerCase() : "";
      const location = opportunity.location
        ? opportunity.location.toLowerCase()
        : "";
      const category = opportunity.category
        ? opportunity.category.toLowerCase()
        : "";

      return (
        lowerQuestion.includes(title) ||
        title.includes(lowerQuestion) ||
        lowerQuestion.includes(location) ||
        lowerQuestion.includes(category)
      );
    });

    if (
      lowerQuestion.includes("event") ||
      lowerQuestion.includes("opportunity") ||
      lowerQuestion.includes("food drive") ||
      lowerQuestion.includes("cleanup") ||
      lowerQuestion.includes("details") ||
      matchingEvent
    ) {
      if (matchingEvent) {
        return buildEventAnswer(matchingEvent);
      }

      return buildEventSearchAnswer(lowerQuestion);
    }

    if (
      lowerQuestion.includes("what counts") ||
      lowerQuestion.includes("counts as") ||
      lowerQuestion.includes("njhs hours") ||
      lowerQuestion.includes("volunteer hours")
    ) {
      return (
        "In general, NJHS hours usually count when the activity is unpaid, helps the community or school, is not mainly for your own benefit, and can be verified by an adult or organization contact. Examples: food drives, tutoring, library help, cleanups, school service events, animal shelters, and nonprofit support. Always check your school/NJHS chapter rules because final approval depends on your advisor."
      );
    }

    if (
      lowerQuestion.includes("does not count") ||
      lowerQuestion.includes("not count") ||
      lowerQuestion.includes("can't count") ||
      lowerQuestion.includes("cannot count")
    ) {
      return (
        "Activities usually do not count if you are paid, if it is a required chore at home, if it mainly benefits you or your family, if there is no adult/organization verification, or if it is already required for another class without a service purpose. When unsure, ask your NJHS advisor before logging it."
      );
    }

    if (
      lowerQuestion.includes("signature") ||
      lowerQuestion.includes("proof") ||
      lowerQuestion.includes("verify") ||
      lowerQuestion.includes("verification")
    ) {
      return (
        "For proof, you should save the organization contact info, type your student signature, and upload an attachment if you have one. For teacher-listed events, the teacher approval only means you can attend. The hours count only after the teacher gives the final completion signature."
      );
    }

    if (
      lowerQuestion.includes("teacher event") ||
      lowerQuestion.includes("teacher-listed") ||
      lowerQuestion.includes("teacher listed") ||
      lowerQuestion.includes("approved")
    ) {
      return (
        "For teacher-listed events, the workflow is: student signs up → teacher approves the student to volunteer → after the event, the teacher moves it to Needs Signature → teacher clicks the checkmark/signature → then the hours count on the leaderboard."
      );
    }

    if (
      lowerQuestion.includes("leaderboard") ||
      lowerQuestion.includes("rank") ||
      lowerQuestion.includes("counted")
    ) {
      return (
        "The leaderboard counts teacher-listed event hours only after the teacher gives the final signature. Manual tracked hours are stored in your profile and calendar, but teacher-listed events need teacher completion approval before they count as teacher-signed hours."
      );
    }

    if (
      lowerQuestion.includes("calendar") ||
      lowerQuestion.includes("add event") ||
      lowerQuestion.includes("date")
    ) {
      return (
        "On your student dashboard calendar, click a day to add a tracked event for that date. The calendar only shows the event name. Click the event name to see details or delete it."
      );
    }

    if (
      lowerQuestion.includes("contact") ||
      lowerQuestion.includes("organization contact")
    ) {
      return (
        "Organization contact info is required when logging hours so your activity can be verified. You can enter an email, phone number, teacher name, sponsor name, or organization contact."
      );
    }

    if (
      lowerQuestion.includes("examples") ||
      lowerQuestion.includes("example")
    ) {
      return (
        "Examples of activities that may count: helping at a food pantry, volunteering at a library, assisting at a school event, park cleanup, animal shelter support, donation sorting, tutoring younger students, or helping with a nonprofit event. Final approval still depends on your NJHS advisor."
      );
    }

    if (
      lowerQuestion.includes("my signups") ||
      lowerQuestion.includes("my events") ||
      lowerQuestion.includes("status")
    ) {
      return buildStudentStatusAnswer();
    }

    return (
      "I can help with NJHS hour rules, proof/signatures, teacher-listed events, leaderboard rules, calendar tracking, and event details. Try asking: “What counts as NJHS hours?”, “What does not count?”, “How do teacher signatures work?”, or “Tell me about [event name].”"
    );
  }

  function buildEventAnswer(event) {
    const activeSignups = volunteerSignups.filter((signup) => {
      return (
        signup.opportunityId === event.id &&
        signup.status !== "disapproved"
      );
    });

    const approvedStudents = volunteerSignups.filter((signup) => {
      return (
        signup.opportunityId === event.id &&
        ["approved", "needs-signature", "completed"].includes(signup.status)
      );
    });

    return (
      `Event: ${event.title}\n\n` +
      `Description: ${event.description || "No description listed."}\n\n` +
      `Location: ${event.location || "No location listed."}\n\n` +
      `Date: ${event.eventDate || "No date listed."}\n\n` +
      `Time: ${
        event.startTime && event.endTime
          ? `${event.startTime} - ${event.endTime}`
          : "No time listed."
      }\n\n` +
      `Hours: ${event.hours || "Not listed"}\n\n` +
      `Category: ${event.category || "Not listed"}\n\n` +
      `Uploaded by: ${event.teacherName || "Unknown Teacher"}\n\n` +
      `Class: ${event.className || "Not listed"}\n\n` +
      `Spots filled: ${activeSignups.length}/${event.maxSpots || "No limit"}\n\n` +
      `Approved students: ${approvedStudents.length}`
    );
  }

  function buildEventSearchAnswer(lowerQuestion) {
    if (teacherOpportunities.length === 0) {
      return (
        "I do not see any teacher-uploaded opportunities available to your account yet. A student only sees opportunities for classes they are in. A teacher only sees opportunities they posted."
      );
    }

    const possibleMatches = teacherOpportunities.filter((opportunity) => {
      const combinedText = `${opportunity.title} ${opportunity.description} ${opportunity.location} ${opportunity.category}`.toLowerCase();

      const words = lowerQuestion.split(" ").filter((word) => word.length > 3);

      return words.some((word) => combinedText.includes(word));
    });

    if (possibleMatches.length === 0) {
      const eventTitles = teacherOpportunities
        .map((event) => `• ${event.title}`)
        .join("\n");

      return (
        "I could not find a matching event from your question. Teacher-uploaded events I can see are:\n\n" +
        eventTitles +
        "\n\nTry asking with the exact event name."
      );
    }

    const eventSummaries = possibleMatches
      .slice(0, 3)
      .map((event) => {
        return (
          `• ${event.title} — ${event.location || "No location"} — ${
            event.eventDate || "No date"
          }`
        );
      })
      .join("\n");

    return (
      "I found these possible matching events:\n\n" +
      eventSummaries +
      "\n\nAsk me the exact event name for full details."
    );
  }

  function buildStudentStatusAnswer() {
    if (!currentUser || currentUser.role.toLowerCase() !== "student") {
      return "Student signup status is only available when you are logged in as a student.";
    }

    const mySignups = volunteerSignups.filter((signup) => {
      return signup.studentUsername === currentUser.username;
    });

    if (mySignups.length === 0) {
      return "You do not have any teacher-event signups yet.";
    }

    const pending = mySignups.filter(
      (signup) => signup.status === "pending"
    ).length;

    const approved = mySignups.filter(
      (signup) => signup.status === "approved"
    ).length;

    const needsSignature = mySignups.filter(
      (signup) => signup.status === "needs-signature"
    ).length;

    const completed = mySignups.filter(
      (signup) => signup.status === "completed"
    ).length;

    const disapproved = mySignups.filter(
      (signup) => signup.status === "disapproved"
    ).length;

    return (
      `Your teacher-event signup status:\n\n` +
      `Pending: ${pending}\n` +
      `Approved to Volunteer: ${approved}\n` +
      `Needs Teacher Signature: ${needsSignature}\n` +
      `Completed / Hours Counted: ${completed}\n` +
      `Disapproved: ${disapproved}`
    );
  }

  return (
    <>
      {!isOpen && (
        <button style={floatingButtonStyle} onClick={() => setIsOpen(true)}>
          AI
        </button>
      )}

      {isOpen && (
        <div style={helperPanelStyle}>
          <div style={helperHeaderStyle}>
            <div>
              <h3 style={helperTitleStyle}>AI FAQ Helper</h3>
              <p style={helperSubtitleStyle}>NJHS hours + event help</p>
            </div>

            <button style={closeButtonStyle} onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          <div style={quickQuestionSectionStyle}>
            <button
              style={quickButtonStyle}
              onClick={() => addQuickQuestion("What counts as NJHS hours?")}
            >
              What counts?
            </button>

            <button
              style={quickButtonStyle}
              onClick={() => addQuickQuestion("What does not count?")}
            >
              What does not count?
            </button>

            <button
              style={quickButtonStyle}
              onClick={() =>
                addQuickQuestion("How do teacher signatures work?")
              }
            >
              Signatures
            </button>

            <button
              style={quickButtonStyle}
              onClick={() => addQuickQuestion("My signup status")}
            >
              My status
            </button>
          </div>

          <div style={messagesStyle}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={
                  message.role === "user"
                    ? userMessageStyle
                    : helperMessageStyle
                }
              >
                {message.text.split("\n").map((line, lineIndex) => (
                  <p key={lineIndex} style={messageLineStyle}>
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div style={inputRowStyle}>
            <input
              style={inputStyle}
              placeholder="Ask about hours or events..."
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitQuestion();
                }
              }}
            />

            <button style={sendButtonStyle} onClick={submitQuestion}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const floatingButtonStyle = {
  position: "fixed",
  right: "22px",
  bottom: "28px",
  width: "62px",
  height: "62px",
  borderRadius: "999px",
  border: "none",
  backgroundColor: "#7c3aed",
  color: "white",
  fontWeight: 900,
  fontSize: "18px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
  zIndex: 10000,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const helperPanelStyle = {
  position: "fixed",
  right: "22px",
  bottom: "28px",
  width: "390px",
  height: "560px",
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "18px",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
  zIndex: 10000,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const helperHeaderStyle = {
  padding: "16px",
  backgroundColor: "#7c3aed",
  color: "white",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const helperTitleStyle = {
  margin: 0,
  fontSize: "20px",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const helperSubtitleStyle = {
  margin: "4px 0 0",
  fontSize: "13px",
  opacity: 0.9,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const closeButtonStyle = {
  backgroundColor: "transparent",
  color: "white",
  border: "none",
  fontSize: "28px",
  cursor: "pointer",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const quickQuestionSectionStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  padding: "12px",
  backgroundColor: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
};

const quickButtonStyle = {
  padding: "7px 9px",
  borderRadius: "999px",
  border: "1px solid #c4b5fd",
  backgroundColor: "#f5f3ff",
  color: "#5b21b6",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "12px",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const messagesStyle = {
  flex: 1,
  padding: "14px",
  overflowY: "auto",
  backgroundColor: "#ffffff",
};

const userMessageStyle = {
  marginLeft: "50px",
  marginBottom: "12px",
  backgroundColor: "#2563eb",
  color: "white",
  padding: "10px 12px",
  borderRadius: "14px",
};

const helperMessageStyle = {
  marginRight: "38px",
  marginBottom: "12px",
  backgroundColor: "#f3f4f6",
  color: "#111827",
  padding: "10px 12px",
  borderRadius: "14px",
  border: "1px solid #e5e7eb",
};

const messageLineStyle = {
  margin: "0 0 6px",
  lineHeight: "1.4",
  whiteSpace: "pre-wrap",
};

const inputRowStyle = {
  display: "flex",
  gap: "8px",
  padding: "12px",
  borderTop: "1px solid #e5e7eb",
  backgroundColor: "#f9fafb",
};

const inputStyle = {
  flex: 1,
  padding: "10px",
  border: "1px solid #9ca3af",
  borderRadius: "8px",
  fontSize: "14px",
  color: "#111827",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const sendButtonStyle = {
  padding: "10px 14px",
  backgroundColor: "#7c3aed",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};