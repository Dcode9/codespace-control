export const metadata = {
  title: "Codespace Control",
  description: "Start / Stop Antigravity Codespace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
