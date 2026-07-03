import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { SEO } from '../../components/SEO';

export default function UPIRedirectPage() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Reconstruct the full upi://pay URI
    const upiUri = `upi://pay?${searchParams.toString()}`;
    
    // Redirect instantly
    window.location.href = upiUri;
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <SEO title="Opening Payment App..." description="Redirecting to your preferred UPI app." />
      <div className="text-center max-w-sm mx-auto">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl animate-bounce">💸</span>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Opening UPI App...</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Please wait while we redirect you to GPay, PhonePe, or Paytm.
        </p>
        <div className="p-4 bg-muted/50 rounded-xl border border-border text-xs text-muted-foreground text-left">
          <p className="mb-2 font-semibold text-foreground">If nothing happened:</p>
          <p className="mb-2">1. Your phone might not have a UPI app installed.</p>
          <p>2. You can manually tap the button below to try again.</p>
        </div>
        
        <a
          href={`upi://pay?${searchParams.toString()}`}
          className="mt-6 w-full inline-block py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all"
        >
          Open UPI App Now
        </a>
      </div>
    </div>
  );
}
