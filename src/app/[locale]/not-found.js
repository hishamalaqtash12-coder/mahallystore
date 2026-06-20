import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h2 className="text-3xl font-black mb-4">Page Not Found</h2>
      <p className="text-zinc-600 mb-8 max-w-md">
        We couldn't find the page you were looking for. It might have been removed, renamed, or didn't exist in the first place.
      </p>
      <Link 
        href="/"
        className="bg-[#febd69] hover:bg-[#f3a847] text-zinc-900 font-bold py-3 px-8 rounded-md transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
}
