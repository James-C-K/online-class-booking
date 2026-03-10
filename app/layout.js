import './globals.css';
import { LanguageProvider } from '@/lib/LanguageContext';
import LangToggle from '@/components/LangToggle';

export const metadata = {
  title: 'Class-Booking',
  description: 'Book your classes online with ease.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <div className="shape shape-1" />
          <div className="shape shape-2" />
          <LangToggle />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
