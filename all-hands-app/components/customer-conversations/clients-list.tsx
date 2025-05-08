'use client';

import { useEffect, useState } from 'react';
import { Company } from '@/types/supabase';
import { CompanyService } from '@/lib/services/company.service';
import CompanyCard from './company-card';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function ClientsList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CompanyService.getAllCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError('Failed to load companies');
      toast({
        variant: 'destructive',
        title: 'Error loading companies',
        description: 'Failed to load companies. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-lg text-gray-500">Loading companies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <span className="text-lg text-gray-500">{error}</span>
        <Button 
          variant="outline" 
          onClick={fetchCompanies}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Retry
        </Button>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-lg text-gray-500">No companies found</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  );
} 