import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { AudioPlayerProvider } from '@/components/audio/AudioPlayerContext.jsx';
import PersistentPlayer from '@/components/audio/PersistentPlayer.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, User, LogOut, Home, Library, Shield, DollarSign, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  const navItems = [
    { name: 'Home', icon: Home, href: createPageUrl('Home') },
    { name: 'Library', icon: Library, href: createPageUrl('Library') },
    { name: 'Pricing', icon: DollarSign, href: createPageUrl('Pricing') },
  ];

  if (user) {
    navItems.push({ name: 'Profile', icon: User, href: createPageUrl('Profile') });
    navItems.push({ name: 'Settings', icon: User, href: createPageUrl('Settings') });
  }

  // Add ResonancePath for eligible users
  if (user) {
    navItems.push({ 
      name: 'ResonancePath', 
      icon: TrendingUp, 
      href: createPageUrl('ResonancePath') 
    });
    navItems.push({ 
      name: 'Community', 
      icon: User, 
      href: createPageUrl('Community') 
    });
    navItems.push({ 
      name: 'Playlists', 
      icon: Library, 
      href: createPageUrl('Playlists') 
    });
  }

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin', icon: Shield, href: createPageUrl('Admin') });
  }

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
        `}</style>

        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-40 bg-[#f5f0e8]/95 backdrop-blur-xl border-b border-[#d4c4a8]/30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to={createPageUrl('Home')} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 border-2 border-purple-900/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-900" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <span className="text-lg font-medium text-purple-900 tracking-wide" style={{ fontFamily: 'Cinzel, serif' }}>
                  AU'DIO
                </span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPageName === item.name;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all",
                        isActive
                          ? "bg-purple-900/10 text-purple-900 font-medium"
                          : "text-purple-900/60 hover:text-purple-900 hover:bg-purple-900/5"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-2">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-9 px-3 text-purple-900/70 hover:text-purple-900 hover:bg-purple-900/5"
                      >
                        <User className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">{user.full_name || user.email}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#faf8f4] border-[#d4c4a8] w-48">
                      <div className="px-2 py-1.5">
                        <p className="text-sm text-purple-900 font-medium truncate">
                          {user.full_name || 'User'}
                        </p>
                        <p className="text-xs text-purple-900/60 truncate">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator className="bg-[#d4c4a8]" />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-purple-900/70 focus:text-purple-900 focus:bg-purple-900/5"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    onClick={handleLogin}
                    className="bg-purple-900 hover:bg-purple-800 text-white"
                  >
                    Sign in
                  </Button>
                )}

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-purple-900/60"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-[#d4c4a8]/30 bg-[#f5f0e8]/98 backdrop-blur-xl">
              <div className="px-4 py-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPageName === item.name;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all",
                        isActive
                          ? "bg-purple-900/10 text-purple-900 font-medium"
                          : "text-purple-900/60 hover:text-purple-900 hover:bg-purple-900/5"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

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