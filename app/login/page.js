"use client";

import { useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("student");
  const [className, setClassName] = useState("");

  const [message, setMessage] = useState("");

  function registerAccount() {
    const existingUsers = JSON.parse(localStorage.getItem("users")) || [];

    const usernameAlreadyExists = existingUsers.some((user) => {
      return user.username === username;
    });

    if (usernameAlreadyExists) {
      setMessage("That username already exists. Try logging in.");
      return;
    }

    const newUser = {
      id: Date.now(),
      username: username,
      password: password,
      displayName: displayName,
      role: role,
      className: className,
    };

    const updatedUsers = [...existingUsers, newUser];

    localStorage.setItem("users", JSON.stringify(updatedUsers));
    localStorage.setItem("currentUser", JSON.stringify(newUser));

    if (role === "teacher") {
      window.location.href = "/teacher";
    } else {
      window.location.href = "/student";
    }
  }

  function loginAccount() {
    const existingUsers = JSON.parse(localStorage.getItem("users")) || [];

    const matchingUser = existingUsers.find((user) => {
      return user.username === username && user.password === password;
    });

    if (!matchingUser) {
      setMessage("Username or password is incorrect.");
      return;
    }

    localStorage.setItem("currentUser", JSON.stringify(matchingUser));

    if (matchingUser.role === "teacher") {
      window.location.href = "/teacher";
    } else {
      window.location.href = "/student";
    }
  }

  return (
    <main style={pageStyle}>
      <section style={loginSectionStyle}>
        <div style={loginCardStyle}>
          <h1 style={titleStyle}>Volunteer Connect</h1>

          <p style={subtitleStyle}>
            Create a mock student or teacher account for testing.
          </p>

          <div style={tabRowStyle}>
            <button
              style={mode === "login" ? activeTabStyle : tabStyle}
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              Login
            </button>

            <button
              style={mode === "register" ? activeTabStyle : tabStyle}
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
            >
              Register
            </button>
          </div>

          {mode === "register" && (
            <>
              <label style={labelStyle}>Full Name</label>
              <input
                style={inputStyle}
                placeholder="Example: Miraya Joshi"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />

              <label style={labelStyle}>Role</label>
              <select
                style={inputStyle}
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>

              <label style={labelStyle}>Class Name</label>
              <input
                style={inputStyle}
                placeholder="Example: 7th Grade NJHS"
                value={className}
                onChange={(event) => setClassName(event.target.value)}
              />
            </>
          )}

          <label style={labelStyle}>Username</label>
          <input
            style={inputStyle}
            placeholder="Example: miraya7"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />

          <label style={labelStyle}>Password</label>
          <input
            style={inputStyle}
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {mode === "login" ? (
            <button style={buttonStyle} onClick={loginAccount}>
              Login
            </button>
          ) : (
            <button style={buttonStyle} onClick={registerAccount}>
              Create Account
            </button>
          )}

          {message && <p style={messageStyle}>{message}</p>}

          <p style={noteStyle}>
            This is only for MVP testing. Final version will use RapidIdentity.
          </p>
        </div>
      </section>
    </main>
  );
}

const pageStyle = {
   fontFamily: "Roboto,Segoe UI, Arial",
  
  backgroundColor: "#f9fafb",
  minHeight: "100vh",
};

const loginSectionStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "70px 40px",
};

const loginCardStyle = {
  width: "100%",
  maxWidth: "520px",
  backgroundColor: "white",
  padding: "40px",
  borderRadius: "18px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const titleStyle = {
  textAlign: "center",
  fontSize: "36px",
  color: "#2563eb",
  marginBottom: "12px",
};

const subtitleStyle = {
  textAlign: "center",
  fontSize: "17px",
  color: "#374151",
  lineHeight: "1.5",
  marginBottom: "24px",
};

const tabRowStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "24px",
};

const tabStyle = {
  flex: 1,
  padding: "12px",
  backgroundColor: "#f3f4f6",
  color: "#374151",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
};

const activeTabStyle = {
  flex: 1,
  padding: "12px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "1px solid #2563eb",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  marginTop: "16px",
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

const buttonStyle = {
  marginTop: "24px",
  width: "100%",
  padding: "14px",
  backgroundColor: "#047857",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "16px",
  fontWeight: 700,
  cursor: "pointer",
};

const messageStyle = {
  marginTop: "18px",
  color: "#b91c1c",
  fontWeight: 700,
  textAlign: "center",
};

const noteStyle = {
  marginTop: "24px",
  color: "#6b7280",
  fontSize: "14px",
  textAlign: "center",
};