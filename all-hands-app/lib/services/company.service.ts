import { Company, CompanyInsert } from '@/types/supabase';

export const CompanyService = {
    
    async getAllCompanies(): Promise<Company[]> {
      try {
        const res = await fetch('/api/companies');
        
        if (!res.ok) {
            throw new Error('Failed to fetch companies');
        }
            
        const companies: Company[] = await res.json();

        return companies;
      } catch (err) {
        throw new Error(`Error fetching companies: ${err instanceof Error ? err.message : err}`);
      }
    },
   
    
    async createCompany(company: CompanyInsert): Promise<Company> {
      try {
        const res = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(company),
        });

        if (!res.ok) {
            throw new Error('Failed to create company');
        }

        return await res.json();
      } catch (err) {
        throw new Error(`Error creating company: ${err instanceof Error ? err.message : err}`);
      }
    },
  
    async deleteCompany(id: string): Promise<void> {
      try {
        const res = await fetch(`/api/companies/${id}`, { 
            method: 'DELETE' 
        });

        if (!res.ok) {
            throw new Error('Failed to delete company');
        }
        
      } catch (err) {
        throw new Error(`Error deleting company: ${err instanceof Error ? err.message : err}`);
      }
    },
  }; 