import { redirect } from "next/navigation";

export default function RootNotFound() {
  // Redirect to the default locale's not-found page or just render a basic one
  return (
    <html>
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>404 - Page Not Found</h1>
          <p>The page you are looking for does not exist.</p>
          <a href="/" style={{ marginTop: '1rem', color: '#0070f3', textDecoration: 'none' }}>Go back home</a>
        </div>
      </body>
    </html>
  );
}
