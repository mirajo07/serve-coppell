import AppNav from "./components/AppNav";
import NavCleaner from "./components/NavCleaner";
import AIFaqHelper from "./components/AIFaqHelper";

export const metadata = {
  title: "Vonnect",
  description: "Student volunteer tracking platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <AppNav />
        <NavCleaner />
        <AIFaqHelper />
        {children}
      </body>
    </html>
  );
}