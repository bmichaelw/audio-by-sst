import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { AudioPlayerProvider } from '@/components/audio/AudioPlayerContext.jsx';
import PersistentPlayer from '@/components/audio/PersistentPlayer.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import Header from '@/components/layout/Header.jsx';
import { Toaster } from 'sonner';

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, [currentPageName, navigate]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <ErrorBoundary>
      <AudioPlayerProvider>
        <div className="min-h-screen bg-[#f5f0e8]">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:wght@300;400;500;600&display=swap');

          :root {
            /* Core Colors */
            --background: 32 30% 95%;
            --foreground: 280 50% 20%;
            --surface: 30 25% 98%;
            --surface-elevated: 30 30% 99%;

            /* Card Colors */
            --card: 30 25% 98%;
            --card-foreground: 280 50% 20%;
            --card-hover: 30 30% 96%;

            /* Primary (Deep Purple) */
            --primary: 280 50% 30%;
            --primary-foreground: 32 30% 95%;
            --primary-hover: 280 50% 25%;
            --primary-muted: 280 30% 45%;

            /* Secondary (Gold) */
            --secondary: 40 50% 60%;
            --secondary-foreground: 280 50% 20%;
            --secondary-hover: 40 50% 55%;

            /* Accent (Gold for highlights) */
            --accent: 40 50% 60%;
            --accent-foreground: 280 50% 20%;
            --accent-muted: 40 30% 75%;

            /* Text Colors */
            --text-heading: 280 50% 20%;
            --text-body: 280 30% 35%;
            --text-muted: 280 15% 50%;
            --text-subtle: 280 10% 60%;

            /* Border & Divider */
            --border: 32 20% 85%;
            --border-muted: 32 15% 90%;
            --divider: 32 20% 88%;

            /* Input & Form */
            --input: 32 20% 92%;
            --input-border: 32 20% 85%;
            --ring: 280 50% 30%;

            /* States */
            --muted: 32 20% 92%;
            --muted-foreground: 280 20% 45%;
            --popover: 30 25% 99%;
            --popover-foreground: 280 50% 20%;
            --destructive: 0 62% 45%;
            --destructive-foreground: 32 30% 95%;
            --success: 140 50% 40%;
            --success-foreground: 32 30% 95%;

            /* Shadows */
            --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
            --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

            /* Radius */
            --radius-sm: 0.375rem;
            --radius: 0.5rem;
            --radius-md: 0.75rem;
            --radius-lg: 1rem;
            --radius-xl: 1.5rem;

            /* Typography Scale */
            --font-heading: 'Cinzel', serif;
            --font-body: 'Cormorant Garamond', serif;
            --letter-spacing-heading: 0.025em;
            --letter-spacing-wide: 0.05em;
          }

          * {
            border-color: hsl(var(--border));
          }

          body {
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
            font-family: var(--font-body);
            font-size: 1.0625rem;
            line-height: 1.7;
          }

          h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-heading);
            letter-spacing: var(--letter-spacing-heading);
            color: hsl(var(--text-heading));
          }

          /* Utility Classes */
          .bg-surface {
            background-color: hsl(var(--surface));
          }

          .bg-surface-elevated {
            background-color: hsl(var(--surface-elevated));
          }

          .text-heading {
            color: hsl(var(--text-heading));
          }

          .text-body {
            color: hsl(var(--text-body));
          }

          .text-muted {
            color: hsl(var(--text-muted));
          }

          .text-subtle {
            color: hsl(var(--text-subtle));
          }

          .border-divider {
            border-color: hsl(var(--divider));
          }

          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: hsl(32, 20%, 90%);
          }
          ::-webkit-scrollbar-thumb {
            background: hsl(280, 25%, 55%);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: hsl(280, 35%, 45%);
          }

          /* Safe area for mobile */
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom, 0);
          }
          
          /* Sacred aesthetic touches */
          .gold-divider {
            height: 1px;
            background: linear-gradient(to right, transparent, hsl(var(--accent)), transparent);
            opacity: 0.4;
          }
          
          /* Heading letter spacing - ceremonial feel */
          h1 {
            letter-spacing: 0.03em;
            font-weight: 400;
          }
          
          h2 {
            letter-spacing: 0.025em;
            font-weight: 400;
          }
          
          h3 {
            letter-spacing: 0.02em;
          }
          
          /* Smooth transitions */
          * {
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          /* Softer shadows for cards */
          .shadow-sm {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          }
          
          .shadow {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          }
          
          .shadow-md {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          }
          
          .shadow-lg {
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          
          /* Softer borders */
          .border {
            border-color: hsl(var(--border) / 0.5);
          }
          
          /* More organic spacing */
          .space-organic > * + * {
            margin-top: 2rem;
          }
        `}</style>

        {/* Navigation */}
        <Header
          user={user}
          currentPageName={currentPageName}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main className="pt-16">
          {children}
        </main>

        {/* Persistent Audio Player */}
        <PersistentPlayer />

        {/* Toast Notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'hsl(30, 25%, 98%)',
              border: '1px solid hsl(280, 25%, 75%)',
              color: 'hsl(280, 45%, 25%)',
            },
          }}
        />
        </div>
      </AudioPlayerProvider>
    </ErrorBoundary>
  );
}