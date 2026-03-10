import './globals.css';
import { LanguageProvider } from '@/lib/LanguageContext';

export const metadata = {
  title: 'Class-Booking',
  description: 'Book your classes online with ease.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
