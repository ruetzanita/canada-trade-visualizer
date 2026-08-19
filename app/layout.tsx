import './globals.css';

export const metadata = {
  title: 'Canada Macro Trade Dynamics',
  description: 'Interactive visualization of Canada\'s global export dynamics in EUD and IPD markets.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
