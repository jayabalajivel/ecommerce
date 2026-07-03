import React from 'react';
import { useNavigate } from 'react-router';
import { Home } from 'lucide-react';
import { SEO } from '../components/SEO';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SEO title="Page Not Found" description="The page you are looking for does not exist." />
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-8xl font-bold text-primary mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>404</h1>
        <h2 className="text-2xl font-bold text-foreground mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          Oops! The page you are looking for seems to have gone missing. It might have been moved or doesn't exist anymore.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>
      </div>
    </div>
  );
}
