'use client';

import { useState, FormEvent } from 'react';
//import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { AuthService } from '@/lib/services/auth.service';

export default function LoginForm() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  //const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!password) {
      toast({
        title: 'Password required',
        description: 'Please enter the password.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await AuthService.userLogin(password);
      
      if (response.success) {
        toast({
          title: 'Authentication successful',
          description: 'Welcome back!',
        });
        
      // Force a full page reload to ensure cookies are set
      window.location.href = '/';
      } else {
        throw new Error(response.error || 'Authentication failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid password. Please try again.';
      toast({
        title: 'Authentication failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter the password"
          disabled={isLoading}
          className="w-full"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
} 