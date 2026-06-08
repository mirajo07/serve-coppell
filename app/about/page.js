export default function AboutPage() {
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

      <section style={headerStyle}>
        <h1 style={titleStyle}>About Vonnected</h1>
        <p style={subtitleStyle}>
          A school-friendly app designed to make helping the community easier to discover,
          organize, and track.
        </p>
      </section>

      <section style={contentSectionStyle}>
        <div style={contentCardStyle}>
          <h2 style={sectionHeadingStyle}>Our Purpose</h2>
          <p style={paragraphStyle}>
            Vonnected helps students discover their interests, build skills, and make a positive impact in their community through volunteering. We connect students and teachers with local organizations and opportunities to connect their passions with real-world needs.
          </p>

          <h2 style={sectionHeadingStyle}>Who It Helps</h2>
          <p style={paragraphStyle}>
            This app is designed for students and teachers to organize and track volunteering opportunities and hours.
          </p>

          <h2 style={sectionHeadingStyle}>Why It Matters</h2>
          <p style={paragraphStyle}>
            Volunteering is a powerful way for students to learn how to interact with their community and builds leadership that they will carry thoughout their lives.
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

const headerStyle = {
  padding: "60px 40px",
  textAlign: "center",
  backgroundColor: "#c7ebfa",
};

const titleStyle = {
  fontSize: "42px",
  marginBottom: "16px",
  color: "#000000",
};

const subtitleStyle = {
  fontSize: "18px",
  color: "#000000",
  maxWidth: "700px",
  margin: "0 auto",
  lineHeight: "1.6",
};

const contentSectionStyle = {
  padding: "50px 40px",
  display: "flex",
  justifyContent: "center",
};

const contentCardStyle = {
  maxWidth: "800px",
  backgroundColor: "white",
  padding: "36px",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
 boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const sectionHeadingStyle = {
  color: "#2563eb",
  marginTop: "24px",
};

const paragraphStyle = {
  color: "#374151",
  fontSize: "17px",
  lineHeight: "1.7",
};
