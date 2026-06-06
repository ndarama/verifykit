import dynamic from 'next/dynamic';

// Dynamically load the client application to avoid server-side execution
// of code that depends on browser globals like localStorage.
const ClientApp = dynamic(() => import('../src/App'), { ssr: false, loading: () => <div>Loading...</div> });

export default function HomePage() {
  return <ClientApp />;
}
