import "./globals.css";
import AxiosConfig from "../components/AxiosConfig";

export const metadata = {
  title: "Kineo",
  description: "Impara l'inglese guardando i video che ami.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AxiosConfig />
        {children}
      </body>
    </html>
  );
}