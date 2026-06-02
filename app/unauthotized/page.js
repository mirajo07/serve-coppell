export default function UnauthorizedPage() {
  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <h1 style={titleStyle}>Access Not Allowed</h1>

        <p style={textStyle}>
          Please sign in with your Coppell ISD Google account.
        </p>

        <p style={emailStyle}>Allowed email format: @g.coppellisd.com</p>

        <a href="/login" style={buttonStyle}>
          Back to Login
        </a>
      </section>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  backgroundColor: "#d2dbe4",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "Roboto, Segoe UI, Arial",
  padding: "40px",
};

const cardStyle = {
  backgroundColor: "white",
  padding: "36px",
  borderRadius: "18px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
  textAlign: "center",
  maxWidth: "480px",
};

const titleStyle = {
  color: "#b91c1c",
  fontSize: "34px",
  marginTop: 0,
};

const textStyle = {
  color: "#374151",
  fontSize: "18px",
  lineHeight: "1.5",
};

const emailStyle = {
  color: "#111827",
  fontWeight: 800,
  marginTop: "18px",
};

const buttonStyle = {
  display: "inline-block",
  marginTop: "24px",
  padding: "12px 18px",
  backgroundColor: "#2563eb",
  color: "white",
  textDecoration: "none",
  borderRadius: "10px",
  fontWeight: 800,
};