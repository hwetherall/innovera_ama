'use client';

import { Company, CustomerConversationWithSummary, CompanyType, Tag } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Tag as TagComponent } from '@/components/ui/tag';
import ConversationCard from './conversation-card';

interface CompanyCardProps {
  company: Company;
  conversations: CustomerConversationWithSummary[];
  allTags: Tag[];
}

const getCompanyTypeColor = (type: CompanyType): 'green' | 'blue' | 'purple' => {
  switch (type) {
    case 'vc':
      return 'green';
    case 'corporate':
      return 'blue';
    case 'other':
      return 'purple';
    default:
      return 'blue';
  }
};

export default function CompanyCard({ company, conversations, allTags }: CompanyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="w-full">
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <CardTitle>{company.company_name}</CardTitle>
          <div className="flex items-center gap-2">
            <TagComponent 
              name={company.company_type == 'vc' ? "VC" : company.company_type[0].toUpperCase() + company.company_type.slice(1)} 
              color={getCompanyTypeColor(company.company_type)} 
            />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-4">
          {conversations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 border-b">
                    <th className="text-left px-2 py-2 w-1/3">Customer Name</th>
                    <th className="text-left px-2 py-2 w-32">Date</th>
                    <th className="text-left px-2 py-2 w-1/3">Tags</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((conversation, idx) => (
                    <ConversationCard 
                      key={conversation.id} 
                      conversation={conversation}
                      allTags={allTags}
                      asTableRow
                      isLast={idx === conversations.length - 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[100px]">
              <span className="text-lg text-gray-500">No conversations found</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
} 