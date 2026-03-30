import "./globals.css";

export const metadata = {
  title: "CashGuard — Financial Discipline Coach",
  description: "Personal finance management for salaried individuals",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CashGuard",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e40af",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
