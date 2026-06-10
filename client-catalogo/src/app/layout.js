import "./globals.css";
import AxiosConfig from "../components/AxiosConfig";

export const metadata = {
  title: "Kineo - Catalogo",
  description: "Catalogo Video Kineo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        <AxiosConfig />
        {children}
      </body>
    </html>
  );
}
