import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Card className="max-w-md w-full" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <CardContent className="pt-6 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'hsl(var(--muted))' }}>
            <Search className="w-10 h-10" style={{ color: 'hsl(var(--text-subtle))' }} />
          </div>
          <h1 className="text-4xl font-light mb-2" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading))' }}>404</h1>
          <h2 className="text-xl font-medium mb-3" style={{ color: 'hsl(var(--foreground))' }}>Page Not Found</h2>
          <p className="mb-6" style={{ color: 'hsl(var(--text-muted))' }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}