import Link from 'next/link';
import '../styles/globals.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <h1>Reservations</h1>
          <nav>
            <Link href="/">Home</Link>
            <Link href="/admin">Admin</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
