import "./globals.css";

export const metadata = {
  title: "Kweni Prospect",
  description: "Dashboard de prospection Kweni Studio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
