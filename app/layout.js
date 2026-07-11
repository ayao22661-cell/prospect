import "./globals.css";
import { IBM_Plex_Mono, Inter } from "next/font/google";

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});
const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Kweni Prospect",
  description: "Dashboard de prospection Kweni Studio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${mono.variable} ${sans.variable}`}>
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand">
              <span className="brand-mark">K→</span>
              <div className="brand-text">
                <span className="brand-name">Kweni</span>
                <span className="brand-sub">Prospect OS</span>
              </div>
            </div>
            <nav className="side-nav">
              <a href="/">
                <span className="nav-dot" />
                Dashboard
              </a>
              <a href="/chat">
                <span className="nav-dot" />
                Chat
              </a>
            </nav>
            <div className="side-footer">Kweni Studio · Abidjan</div>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
