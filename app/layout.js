import './globals.css';

export const metadata = {
  title: 'Class-Booking',
  description: 'Book your classes online with ease.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        {children}
      </body>
    </html>
  );
}
