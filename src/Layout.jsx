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
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');

          :root {
            /* Backgrounds - Crystalline Light Champagne */
            --background: 40 33% 97%;           /* #faf9f7 - Clear Quartz */
            --foreground: 0 0% 29%;             /* #4a4a4a - Charcoal */

            /* Cards/Surfaces */
            --card: 0 0% 100%;                  /* #ffffff - Pure White */
            --card-foreground: 0 0% 29%;        /* #4a4a4a - Charcoal */
            --surface: 0 0% 100%;               /* #ffffff */
            --surface-elevated: 0 0% 100%;      /* #ffffff */

            /* Primary (Light Champagne Gold) */
            --primary: 43 38% 73%;              /* #d9ca9c - Light Champagne */
            --primary-foreground: 0 0% 100%;    /* White text on gold */
            --primary-hover: 43 38% 68%;        /* Slightly darker gold */
            --primary-muted: 43 38% 80%;        /* Lighter gold */

            /* Secondary */
            --secondary: 40 14% 93%;            /* #f0eeea - Light warm gray */
            --secondary-foreground: 0 0% 29%;   /* #4a4a4a */
            --secondary-hover: 40 14% 88%;      /* Slightly darker */

            /* Muted */
            --muted: 40 14% 93%;                /* #f0eeea */
            --muted-foreground: 0 0% 54%;       /* #8a8a8a */

            /* Accent (Light Champagne Gold) */
            --accent: 43 38% 73%;               /* #d9ca9c */
            --accent-foreground: 0 0% 29%;      /* #4a4a4a */
            --accent-muted: 43 38% 85%;         /* Very light gold */

            /* Text Colors */
            --text-heading: 0 0% 29%;           /* #4a4a4a - Charcoal */
            --text-body: 0 0% 42%;              /* #6a6a6a - Gray */
            --text-muted: 0 0% 54%;             /* #8a8a8a - Muted Gray */
            --text-subtle: 0 0% 67%;            /* #aaaaaa - Subtle Gray */

            /* Borders & Dividers */
            --border: 40 14% 90%;               /* #e8e6e2 */
            --border-muted: 40 14% 93%;         /* #f0eeea */
            --divider: 40 14% 90%;              /* #e8e6e2 */

            /* Input & Form */
            --input: 40 14% 90%;                /* #e8e6e2 */
            --input-border: 40 14% 90%;         /* #e8e6e2 */
            --ring: 43 38% 73%;                 /* #d9ca9c - Gold focus ring */

            /* States */
            --popover: 0 0% 100%;               /* #ffffff */
            --popover-foreground: 0 0% 29%;     /* #4a4a4a */
            --destructive: 0 62% 45%;
            --destructive-foreground: 0 0% 100%;
            --success: 140 50% 40%;
            --success-foreground: 0 0% 100%;

            /* Shadows - Softer for quartz aesthetic */
            --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.03);
            --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04);
            --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.06);

            /* Radius */
            --radius-sm: 0.375rem;
            --radius: 0.75rem;
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
            background: hsl(40, 14%, 93%);
          }
          ::-webkit-scrollbar-thumb {
            background: hsl(43, 38%, 73%);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: hsl(43, 38%, 68%);
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
            border-color: hsl(var(--border) / 0.6);
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