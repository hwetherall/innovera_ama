'use client';

import { useEffect, useState } from 'react';
import { supabase, Session } from '@/lib/supabase/client';
import SessionCard from './session-card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setSessions(data || []);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load sessions. Please try again later.');
        toast({
          variant: 'destructive',
          title: 'Error loading sessions',
          description: 'Please refresh the page and try again.',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, [toast]);

  if (loading) {
    return <div className="py-8 text-center">Loading sessions...</div>;
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 mb-4">No sessions available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  );
}