import "./globals.css";

export const metadata = {
  title: "Kineo",
  description: "Impara l'inglese guardando i video che ami.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}