import React, { useState, useEffect, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { AudioPlayerProvider } from '@/components/audio/AudioPlayerContext';
import PersistentPlayer from '@/components/audio/PersistentPlayer';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, User, LogOut, Settings, Home, Library, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from 'sonner';

interface LayoutProps {
  children: ReactNode;
  currentPageName: string;
}

export default function Layout({ children, currentPageName }: LayoutProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
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
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin', icon: Shield, href: createPageUrl('Admin') });
  }

  return (
    <AudioPlayerProvider>
      <div className="min-h-screen bg-stone-950">
        <style>{`
          :root {
            --background: 12 10% 3%;
            --foreground: 60 9% 98%;
            --card: 12 10% 6%;
            --card-foreground: 60 9% 98%;
            --popover: 12 10% 6%;
            --popover-foreground: 60 9% 98%;
            --primary: 36 77% 49%;
            --primary-foreground: 60 9% 98%;
            --secondary: 12 10% 15%;
            --secondary-foreground: 60 9% 98%;
            --muted: 12 10% 15%;
            --muted-foreground: 24 5% 64%;
            --accent: 12 10% 15%;
            --accent-foreground: 60 9% 98%;
            --destructive: 0 62% 30%;
            --destructive-foreground: 60 9% 98%;
            --border: 12 10% 15%;
            --input: 12 10% 15%;
            --ring: 36 77% 49%;
          }
          
          body {
            background-color: hsl(12, 10%, 3%);
            color: hsl(60, 9%, 98%);
          }

          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: hsl(12, 10%, 6%);
          }
          ::-webkit-scrollbar-thumb {
            background: hsl(12, 10%, 20%);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: hsl(12, 10%, 30%);
          }

          /* Safe area for mobile */
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom, 0);
          }
        `}</style>

        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-40 bg-stone-950/80 backdrop-blur-xl border-b border-stone-800/50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to={createPageUrl('Home')} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white/80" />
                </div>
                <span className="text-lg font-medium text-white tracking-tight">
                  Sound Library
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
                          ? "bg-stone-800/50 text-white"
                          : "text-stone-400 hover:text-white hover:bg-stone-800/30"
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
                        className="h-9 px-3 text-stone-300 hover:text-white hover:bg-stone-800"
                      >
                        <User className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">{user.full_name || user.email}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-stone-800 border-stone-700 w-48">
                      <div className="px-2 py-1.5">
                        <p className="text-sm text-white font-medium truncate">
                          {user.full_name || 'User'}
                        </p>
                        <p className="text-xs text-stone-400 truncate">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator className="bg-stone-700" />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-stone-300 focus:text-white focus:bg-stone-700"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    onClick={handleLogin}
                    className="bg-amber-600 hover:bg-amber-500 text-white"
                  >
                    Sign in
                  </Button>
                )}

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-stone-400"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-stone-800/50 bg-stone-950/95 backdrop-blur-xl">
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
                          ? "bg-stone-800/50 text-white"
                          : "text-stone-400 hover:text-white hover:bg-stone-800/30"
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
              background: 'hsl(12, 10%, 10%)',
              border: '1px solid hsl(12, 10%, 20%)',
              color: 'white',
            },
          }}
        />
      </div>
    </AudioPlayerProvider>
  );
}