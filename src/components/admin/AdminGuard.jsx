import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * AdminGuard - Client-side admin access control
 * 
 * SECURITY NOTES:
 * - This is CLIENT-SIDE protection only
 * - Server-side protection is provided by Base44's built-in entity security
 * - User.role field is managed by Base44 and can only be modified by admins
 * - Entity operations (AuditLog, Phase, etc.) can be restricted to admin-only via Base44 dashboard
 * 
 * For TRUE server-side API protection:
 * - Enable Backend Functions in Base44 dashboard
 * - Create server-side functions with admin checks
 */
export default function AdminGuard({ children }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'admin' | 'denied'
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const userData = await base44.auth.me();
        
        if (!userData) {
          // Not logged in - redirect to login with return URL
          base44.auth.redirectToLogin(window.location.href);
          return;
        }

        setUser(userData);

        // Check admin role
        if (userData.role === 'admin') {
          setStatus('admin');
        } else {
          setStatus('denied');
          // Wait 2 seconds before redirect so user sees the message
          setTimeout(() => {
            navigate(createPageUrl('Library'));
          }, 2000);
        }
      } catch (error) {
        // Authentication failed - redirect to login
        base44.auth.redirectToLogin(window.location.href);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-stone-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (status === 'denied') {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <Card className="bg-stone-900 border-stone-800 max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2">Access Denied</h2>
            <p className="text-stone-400 mb-2">
              Admin privileges required to access this page.
            </p>
            <p className="text-stone-500 text-sm mb-6">
              Logged in as: {user?.email}
            </p>
            <Button
              onClick={() => navigate(createPageUrl('Library'))}
              className="bg-amber-600 hover:bg-amber-500"
            >
              Return to Library
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin access granted
  return <>{children}</>;
}