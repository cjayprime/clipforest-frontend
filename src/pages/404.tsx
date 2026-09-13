import Link from 'next/link';
import type { ClipRoverPage } from './_app';

const NotFound: ClipRoverPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
    <p className="font-mono text-sm text-primary">404</p>
    <h1 className="text-2xl font-semibold text-fg">This page doesn’t exist</h1>
    <Link href="/" className="text-sm text-primary hover:underline">
      Go home
    </Link>
  </div>
);
NotFound.public = true;

export default NotFound;
