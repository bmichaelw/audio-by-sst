import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, User, LogOut, Home, Library, Shield, DollarSign, TrendingUp, Radio, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header({ user, currentPageName, isMenuOpen, setIsMenuOpen, onLogin, onLogout }) {
  const navItems = [
    { name: 'Home', icon: Home, href: createPageUrl('Home') },
    { name: 'Library', icon: Library, href: createPageUrl('Library') },
    { name: 'LiveSessions', icon: Radio, href: createPageUrl('LiveSessions') },
    { name: 'Pricing', icon: DollarSign, href: createPageUrl('Pricing') },
  ];

  if (user) {
    navItems.push({ name: 'Community', icon: User, href: createPageUrl('Community') });
    navItems.push({ name: 'Playlists', icon: Library, href: createPageUrl('Playlists') });
  }

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin', icon: Shield, href: createPageUrl('Admin') });
  }

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b"
      style={{ 
        backgroundColor: 'hsl(var(--background) / 0.95)',
        borderColor: 'hsl(var(--border) / 0.3)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full overflow-hidden transition-all">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6963e3baba38fec6b46ac249/c1e96d6f5_AuDiosanguinelogosquare.png" 
                alt="Au'Dio Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <span 
              className="text-lg font-medium tracking-wide transition-colors"
              style={{ 
                fontFamily: 'var(--font-heading)',
                color: 'hsl(var(--foreground))',
                letterSpacing: '0.02em'
              }}
            >
              Au'Dio
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
                    isActive && "font-medium"
                  )}
                  style={isActive ? {
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                    color: 'hsl(var(--primary))'
                  } : {
                    color: 'hsl(var(--text-muted))'
                  }}
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
                    className="h-9 px-3"
                    style={{ color: 'hsl(var(--text-muted))' }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{user.full_name || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-48"
                  style={{ 
                    backgroundColor: 'hsl(var(--surface))',
                    borderColor: 'hsl(var(--border))'
                  }}
                >
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                      {user.full_name || 'User'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'hsl(var(--text-muted))' }}>{user.email}</p>
                  </div>
                  <DropdownMenuSeparator style={{ backgroundColor: 'hsl(var(--border))' }} />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Profile')} style={{ color: 'hsl(var(--foreground))' }}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Settings')} style={{ color: 'hsl(var(--foreground))' }}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator style={{ backgroundColor: 'hsl(var(--border))' }} />
                  <DropdownMenuItem onClick={onLogout} style={{ color: 'hsl(var(--foreground))' }}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={onLogin}
                style={{ 
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))'
                }}
              >
                Sign in
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              style={{ color: 'hsl(var(--text-muted))' }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div 
          className="md:hidden border-t backdrop-blur-xl"
          style={{ 
            borderColor: 'hsl(var(--border) / 0.3)',
            backgroundColor: 'hsl(var(--background) / 0.98)'
          }}
        >
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
                    isActive && "font-medium"
                  )}
                  style={isActive ? {
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                    color: 'hsl(var(--primary))'
                  } : {
                    color: 'hsl(var(--text-muted))'
                  }}
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
  );
}