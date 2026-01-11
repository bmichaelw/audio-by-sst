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
            --background: 32 30% 95%;
            --foreground: 280 45% 25%;
            --card: 30 25% 98%;
            --card-foreground: 280 45% 25%;
            --popover: 30 25% 98%;
            --popover-foreground: 280 45% 25%;
            --primary: 280 45% 35%;
            --primary-foreground: 32 30% 95%;
            --secondary: 40 60% 70%;
            --secondary-foreground: 280 45% 25%;
            --muted: 32 20% 90%;
            --muted-foreground: 280 20% 45%;
            --accent: 40 60% 70%;
            --accent-foreground: 280 45% 25%;
            --destructive: 0 62% 30%;
            --destructive-foreground: 32 30% 95%;
            --border: 32 20% 85%;
            --input: 32 20% 90%;
            --ring: 280 45% 35%;
          }

          body {
            background-color: hsl(32, 30%, 95%);
            color: hsl(280, 45%, 25%);
            font-family: 'Cormorant Garamond', serif;
          }

          h1, h2, h3, h4, h5, h6 {
            font-family: 'Cinzel', serif;
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
                  Sanguine Sound
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