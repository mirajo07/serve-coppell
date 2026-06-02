"use client";

import { useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("student");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [className, setClassName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function clearForm() {
    setDisplayName("");
    setUsername("");
    setClassName("");
    setPassword("");
    setMessage("");
  }

  function createAccount() {
    setMessage("");

    if (!displayName || !username || !className || !password) {
      setMessage("Please fill out name, username, class, and password.");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const existingUser = users.find((user) => {
      return user.username === username;
    });

    if (existingUser) {
      setMessage("That username already exists. Please choose another one.");
      return;
    }

    const newUser = {
      displayName: displayName,
      username: username,
      className: className,
      password: password,
      role: role,
      avatar: "🙂",
      createdAt: new Date().toLocaleString(),
    };

    const updatedUsers = [...users, newUser];

    localStorage.setItem("users", JSON.stringify(updatedUsers));
    localStorage.setItem("currentUser", JSON.stringify(newUser));

    window.dispatchEvent(new Event("storage"));

    if (role === "teacher") {
      window.location.href = "/teacher";
    } else {
      window.location.href = "/student/profile";
    }
  }

  function login() {
    setMessage("");

    if (!username || !password) {
      setMessage("Please enter username and password.");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const foundUser = users.find((user) => {
      return user.username === username && user.password === password;
    });

    if (!foundUser) {
      setMessage("Invalid username or password.");
      return;
    }

    localStorage.setItem("currentUser", JSON.stringify(foundUser));
    window.dispatchEvent(new Event("storage"));

    if (foundUser.role.toLowerCase() === "teacher") {
      window.location.href = "/teacher";
    } else {
      window.location.href = "/student/profile";
    }
  }

  function signInWithGoogle() {
    window.location.href = "/auth/login";
  }

  return (
    <main style={pageStyle}>
      <section style={loginCardStyle}>
        <h1 style={titleStyle}>Welcome to Vonnect</h1>

        <p style={subtitleStyle}>
          Sign in to track volunteer hours, join opportunities, and manage your
          service record.
        </p>

        <button style={googleButtonStyle} onClick={signInWithGoogle}>
          Sign in with Google
        </button>

        <div style={dividerStyle}>
          <span style={dividerLineStyle}></span>
          <span style={dividerTextStyle}>or use demo login</span>
          <span style={dividerLineStyle}></span>
        </div>

        <div style={tabRowStyle}>
          <button
            style={mode === "login" ? activeTabStyle : tabStyle}
            onClick={() => {
              setMode("login");
              clearForm();
            }}
          >
            Login
          </button>

          <button
            style={mode === "register" ? activeTabStyle : tabStyle}
            onClick={() => {
              setMode("register");
              clearForm();
            }}
          >
            Create Account
          </button>
        </div>

        {mode === "register" && (
          <>
            <label style={labelStyle}>I am a...</label>
            <select
              style={inputStyle}
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>

            <label style={labelStyle}>Full Name</label>
            <input
              style={inputStyle}
              placeholder="Example: Alex Smith"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </>
        )}

        <label style={labelStyle}>Username</label>
        <input
          style={inputStyle}
          placeholder="Example: alex7"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />

        {mode === "register" && (
          <>
            <label style={labelStyle}>Class / Group</label>
            <input
              style={inputStyle}
              placeholder="Example: NJHS Period 2"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
            />
          </>
        )}

        <label style={labelStyle}>Password</label>
        <input
          style={inputStyle}
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {mode === "login" ? (
          <button style={mainButtonStyle} onClick={login}>
            Login
          </button>
        ) : (
          <button style={mainButtonStyle} onClick={createAccount}>
            Create Account
          </button>
        )}

        {message && <p style={messageStyle}>{message}</p>}

        <p style={helperTextStyle}>
          Google sign-in uses Auth0. Demo login still uses localStorage for now.
        </p>
      </section>
    </main>
  );
}

const pageStyle = {
  fontFamily: "Roboto, Segoe UI, Arial",
  backgroundColor: "#d2dbe4",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "40px",
};

const loginCardStyle = {
  width: "100%",
  maxWidth: "460px",
  backgroundColor: "white",
  padding: "34px",
  borderRadius: "18px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const titleStyle = {
  color: "#111827",
  fontSize: "34px",
  marginTop: 0,
  textAlign: "center",
};

const subtitleStyle = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.5",
  textAlign: "center",
  marginBottom: "24px",
};

const googleButtonStyle = {
  width: "100%",
  padding: "14px",
  backgroundColor: "white",
  color: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "16px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
};

const dividerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  margin: "24px 0",
};

const dividerLineStyle = {
  flex: 1,
  height: "1px",
  backgroundColor: "#e5e7eb",
};

const dividerTextStyle = {
  color: "#6b7280",
  fontSize: "13px",
  fontWeight: 700,
};

const tabRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginBottom: "18px",
};

const tabStyle = {
  padding: "11px",
  backgroundColor: "#f9fafb",
  color: "#374151",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 700,
};

const activeTabStyle = {
  padding: "11px",
  backgroundColor: "#c7ebfa",
  color: "#111827",
  border: "2px solid #2563eb",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 800,
};

const labelStyle = {
  display: "block",
  marginTop: "16px",
  marginBottom: "7px",
  color: "#111827",
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #9ca3af",
  borderRadius: "9px",
  fontSize: "16px",
  color: "#111827",
  backgroundColor: "white",
  boxSizing: "border-box",
};

const mainButtonStyle = {
  width: "100%",
  padding: "14px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "16px",
  marginTop: "24px",
};

const messageStyle = {
  color: "#b91c1c",
  fontWeight: 700,
  textAlign: "center",
  marginTop: "16px",
};

const helperTextStyle = {
  color: "#6b7280",
  fontSize: "13px",
  textAlign: "center",
  marginTop: "18px",
};