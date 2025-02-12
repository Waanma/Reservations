import Link from 'next/link';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Reservations</h1>
          <nav className="space-x-4">
            <Link href="/" className="text-lg hover:text-gray-400">
              Home
            </Link>
            <Link href="/admin" className="text-lg hover:text-gray-400">
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4">{children}</main>
    </div>
  );
};

export default Layout;
