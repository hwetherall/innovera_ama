import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CompanyService } from '@/lib/services/company.service';
import { Company, CompanyInsert } from '@/types/supabase';
import CreateCompanyDialog from './create-company-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ConversationManager() {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clients, setClients] = useState<Company[]>([]);
  const [conversations, setConversations] = useState<object[]>([]); // Placeholder for now
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch all clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const companies = await CompanyService.getAllCompanies();
        setClients(companies);

        // Auto-select the first client
        if (companies.length > 0) {
          setSelectedClient(companies[0].id);
        }
      } catch {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Simulate fetching conversations for a client (to be replaced with real logic)
  const handleClientChange = async (clientId: string) => {
    setSelectedClient(clientId);
    setConversations([]); // TODO: Replace with real fetch
  };

  const handleCreateCompany = () => {
    setShowCreateDialog(true);
  };

  const handleCompanyCreated = async (company: CompanyInsert) => {
    const newCompany = await CompanyService.createCompany(company);
    setClients(prev => [...prev, newCompany]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Manage Conversations</h3>
        <Button onClick={handleCreateCompany}>Create Company Client</Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-full max-w-xs">
          <Select
            value={selectedClient || 'Select a client'}
            onValueChange={handleClientChange}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue>
                {selectedClient ? clients.find(c => c.id === selectedClient)?.company_name : 'Select a client'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedClient ? (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold mb-2">Customer Conversations for {clients.find(c => c.id === selectedClient)?.company_name}</h4>
          {conversations.length === 0 ? (
            <p className="text-gray-500">No conversations found for this client.</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv, idx) => {
                const c = conv as any;
                return (
                  <div key={c.id || idx} className="border rounded p-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{c.customerName}</div>
                        <div className="text-sm text-gray-500">Innovera Person: {c.innoveraPerson}</div>
                        <div className="text-sm text-gray-500">Date: {c.date}</div>
                      </div>
                      {/* Future: Add actions for conversation */}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500">Select a client to view conversations.</p>
      )}

      <CreateCompanyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCompanyCreated}
      />
    </div>
  );
} 