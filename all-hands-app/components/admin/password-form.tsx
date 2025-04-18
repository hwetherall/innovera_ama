'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface AdminPasswordFormProps {
  onAuthenticated: () => void;
}

export default function AdminPasswordForm({ onAuthenticated }: AdminPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast({
        title: 'Password required',
        description: 'Please enter the admin password.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, you would verify the password on the server
      // For this prototype, we'll use a hardcoded check
      // IMPORTANT: In production, use environment variables and server-side auth
      const isValid = password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
      
      if (isValid) {
        onAuthenticated();
        toast({
          title: 'Authentication successful',
          description: 'Welcome to the admin dashboard.',
        });
      } else {
        toast({
          title: 'Authentication failed',
          description: 'Invalid password. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error authenticating:', error);
      toast({
        title: 'Authentication error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Admin Access</CardTitle>
        <CardDescription>
          Enter the admin password to access the dashboard.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Access Admin'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}