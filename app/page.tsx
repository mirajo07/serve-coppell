
import type { CSSProperties } from "react";export default function HomePage() {
  return (
    <main style={pageStyle}>
      <nav style={navStyle}>
        <h2 style={logoStyle}>Vonnected</h2>

        <div style={navLinksStyle}>
          <a href="/" style={linkStyle}>Home</a>
          <a href="/opportunities" style={linkStyle}>Opportunities</a>
          <a href="/track-hours" style={linkStyle}>Track Hours</a>
          <a href="/about" style={linkStyle}>About</a>
        </div>
      </nav>

      <section style={heroStyle}>
        <h1 style={heroTitleStyle}>The Future of Giving Back Starts Here</h1>

        <p style={heroTextStyle}>
          Vonnected helps students and teachers connect with local volunteer opportunities, track service hours, and support their communities. Whether you're looking to give back or manage your school's service program, Vonnected makes it easy to get involved and make an impact.
        </p>

        <a href="/opportunities">
          <button style={buttonStyle}>Browse Opportunities</button>
        </a>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>What you can do</h2>

        <div style={cardsContainerStyle}>
          <a href="/opportunities" style={cardLinkStyle}>
            <div style={cardStyle}>
              <h3>Find Opportunities</h3>
              <p>Discover local volunteer events that match your interests.</p>
            </div>
          </a>

          <a href="/track-hours" style={cardLinkStyle}>
            <div style={cardStyle}>
              <h3>Track Hours</h3>
              <p>Keep a portfolio of your completed service hours in one place.</p>
            </div>
          </a>

          <div style={cardStyle}>
            <h3>Support Your Community</h3>
            <p>Help schools, nonprofits, and community groups make an impact.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

const pageStyle = {
   fontFamily: "Roboto,Segoe UI, Arial",
  
  padding: "0",
  margin: "0",
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
  gap: "24px",
};

const linkStyle = {
  color: "#374151",
  fontSize: "16px",
  cursor: "pointer",
  textDecoration: "none",
};

const heroStyle = {
  textAlign: "center" as const,
  padding: "80px 40px",
  backgroundColor: "#eff6ff",
};

const heroTitleStyle = {
  fontSize: "48px",
  color: "#111827",
  marginBottom: "20px",
};

const heroTextStyle = {
  fontSize: "18px",
  color: "#4b5563",
  maxWidth: "700px",
  margin: "0 auto",
  lineHeight: "1.6",
};

const buttonStyle = {
  marginTop: "32px",
  padding: "14px 28px",
  fontSize: "16px",
  fontWeight: 600,
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
};

const sectionStyle = {
  padding: "60px 40px",
};

const sectionTitleStyle = {
  textAlign: "center" as const,
  fontSize: "32px",
  marginBottom: "32px",
  color: "#111827",
};

const cardsContainerStyle = {
  display: "flex",
  gap: "24px",
  maxWidth: "1000px",
  margin: "0 auto",
};

const cardLinkStyle = {
  textDecoration: "none",
  color: "inherit",
  flex: 1,
};

const cardStyle = {
  flex: 1,
  backgroundColor: "white",
  padding: "28px",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
 boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
  cursor: "pointer",
};