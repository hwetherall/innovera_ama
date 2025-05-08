import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CompanyType, CompanyInsert } from '@/types/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const COMPANY_TYPES: CompanyType[] = ['vc', 'corporate', 'other'];

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (company: CompanyInsert) => Promise<void>;
}

export default function CreateCompanyDialog({ open, onOpenChange, onCreate }: CreateCompanyDialogProps) {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState<CompanyType>('vc');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate({ company_name: companyName, company_type: companyType });
      setCompanyName('');
      setCompanyType('other');
      onOpenChange(false);
      toast({
        title: "Success",
        description: `Company ${companyName} created successfully`,
      });
    } catch {
      setError('Failed to create company');
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Company</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <Input
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Enter company name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Company Type</label>
            <Select 
              value={companyType} 
              onValueChange={(value: CompanyType) => setCompanyType(value)}
            >
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Select company type" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type == 'vc' ? "VC" : type[0].toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !companyName}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 