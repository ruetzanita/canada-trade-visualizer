import { Inter, Merriweather } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://trade.ruetzanita.com'),
  title: 'Canada Macro Trade Dynamics',
  description: "Interactive visualization of Canada's global export dynamics in European (EUD) and Indo-Pacific (IPD) markets.",
  keywords: ['Canada Trade', 'Macroeconomics', 'CIMT', 'CETA', 'CPTPP', 'Global Exports', 'Interactive Trade Visualization'],
  authors: [{ name: 'Canada Trade Visualizer' }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Canada Macro Trade Dynamics',
    description: "Interactive visualization of Canada's global export dynamics in European (EUD) and Indo-Pacific (IPD) markets.",
    url: 'https://trade.ruetzanita.com',
    siteName: 'Canada Macro Trade Dynamics',
    locale: 'en_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Canada Macro Trade Dynamics',
    description: "Interactive visualization of Canada's global export dynamics in European (EUD) and Indo-Pacific (IPD) markets.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Canada Macro Trade Dynamics',
  url: 'https://trade.ruetzanita.com',
  description: "Interactive visualization of Canada's global export dynamics in European and Indo-Pacific markets.",
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
