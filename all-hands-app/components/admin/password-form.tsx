'use client';

import { useState, useEffect } from 'react';
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

interface AdminPasswordFormProps {
  onAuthenticated: () => void;
}

export default function AdminPasswordForm({ onAuthenticated }: AdminPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  // Fix hydration issues by ensuring password field only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);

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
      console.log('Checking password:', password);
      console.log('Environment variables available:', Object.keys(process.env).filter(key => key.includes('ADMIN')));
      console.log('NEXT_PUBLIC_ADMIN_PASSWORD value:', process.env.NEXT_PUBLIC_ADMIN_PASSWORD);
      
      // Check against environment variable first, then fallback to hardcoded password
      const envPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
      const isValid = envPassword 
        ? password === envPassword 
        : password === 'admin123';
      
      console.log('Is password valid:', isValid);
      
      if (isValid) {
        // Call the onAuthenticated callback from the parent component
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
              {isClient && (
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Access Admin'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}