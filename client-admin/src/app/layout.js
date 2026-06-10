import "./globals.css";

export const metadata = {
  title: "Kineo Admin",
  description: "Area Amministrazione Kineo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        {children}
      </body>
    </html>
  );
}
