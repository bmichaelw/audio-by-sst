import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      <Card className="bg-stone-900 border-stone-800 max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <div className="w-20 h-20 rounded-full bg-stone-800 flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-stone-600" />
          </div>
          <h1 className="text-4xl font-light text-white mb-2">404</h1>
          <h2 className="text-xl font-medium text-white mb-3">Page Not Found</h2>
          <p className="text-stone-400 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            className="bg-amber-600 hover:bg-amber-500"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}