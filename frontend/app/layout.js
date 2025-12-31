import './globals.css';
import Providers from '../components/Providers';

export const metadata = {
  title: 'Roots & Rumors - Family Tree & Genealogy',
  description: 'Preserve your family history with an interactive family tree, stories, and media gallery. Record memories, trace your ancestry, and share your heritage.',
  keywords: ['genealogy', 'family tree', 'ancestry', 'family history', 'heritage'],
  authors: [{ name: 'Roots & Rumors' }],
  openGraph: {
    title: 'Roots & Rumors - Family Tree & Genealogy',
    description: 'Preserve your family history with an interactive family tree, stories, and media gallery.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roots & Rumors - Family Tree & Genealogy',
    description: 'Preserve your family history with an interactive family tree, stories, and media gallery.',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#111827',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body 
        className="bg-gray-900 text-white antialiased"
        style={{ backgroundColor: '#111827', color: 'white', minHeight: '100vh' }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
