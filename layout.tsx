import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tu Sublimación Creativa | Regalos personalizados",
  description: "Productos de sublimación personalizados: tazas, remeras, llaveros, botellas y regalos únicos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
