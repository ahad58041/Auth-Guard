import "./globals.css";

export const metadata = {
  title: "AuthGuard",
  description: "Enterprise-grade authentication & access control",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
