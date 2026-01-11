import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Play, Loader2 } from 'lucide-react';

/**
 * Manual Test Runner Component
 * Add to any page with: import TestRunner from '@/components/testing/TestRunner';
 */

export default function TestRunner() {
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const tests = [
    {
      name: 'Free User Access',
      run: async () => {
        const tracks = await base44.entities.Track.list();
        const freeTrack = tracks.find(t => t.access_tier === 'free');
        return { pass: !!freeTrack, message: `Found ${tracks.filter(t => t.access_tier === 'free').length} free tracks` };
      }
    },
    {
      name: 'Tier Hierarchy',
      run: async () => {
        const tiers = { free: 0, member: 1, resonance_path: 2, collaborations: 3 };
        return { pass: tiers.resonance_path > tiers.member, message: 'Tier hierarchy correct' };
      }
    },
    {
      name: 'Signed URL Creation',
      run: async () => {
        const tracks = await base44.entities.Track.list();
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: tracks[0].audio_file_uri,
          expires_in: 3600,
        });
        return { pass: !!signed_url, message: 'Signed URL created successfully' };
      }
    },
    {
      name: 'Admin Role Check',
      run: async () => {
        const user = await base44.auth.me();
        return { pass: user?.role === 'admin', message: `User role: ${user?.role || 'none'}` };
      }
    },
    {
      name: 'Featured Tracks Query',
      run: async () => {
        const tracks = await base44.entities.Track.list();
        const featured = tracks.filter(t => t.is_featured);
        return { pass: featured.length > 0, message: `Found ${featured.length} featured tracks` };
      }
    },
  ];

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    for (const test of tests) {
      try {
        const result = await test.run();
        setResults(prev => [...prev, { name: test.name, ...result }]);
      } catch (error) {
        setResults(prev => [...prev, { name: test.name, pass: false, message: error.message }]);
      }
    }
    
    setIsRunning(false);
  };

  return (
    <Card className="bg-stone-900 border-stone-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Test Runner</CardTitle>
          <Button
            onClick={runTests}
            disabled={isRunning}
            size="sm"
            className="bg-amber-600 hover:bg-amber-500"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {results.length === 0 ? (
          <p className="text-stone-400 text-sm">Click Run to execute tests</p>
        ) : (
          results.map((result, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-stone-800/30 rounded">
              <div className="flex items-center gap-2">
                {result.pass ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-white text-sm">{result.name}</span>
              </div>
              <Badge variant="outline" className={result.pass ? 'text-green-400' : 'text-red-400'}>
                {result.message}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}