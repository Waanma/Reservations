import Link from 'next/link';

const Home = () => {
  return (
      <div>
        <h1>Home</h1>
        <nav>
          <ul>
            <li>
              <Link href="/admin">Go to Admin</Link>
            </li>
          </ul>
        </nav>
      </div>
  );
};

export default Home;
