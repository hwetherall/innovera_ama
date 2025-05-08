'use client';

import { CustomerConversation, Tag } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Tag as TagComponent } from '@/components/ui/tag';

interface ConversationCardProps {
  conversation: CustomerConversation;
  allTags: Tag[];
  asTableRow?: boolean;
  isLast?: boolean;
}

function formatDateMMDDYYYY(dateString: string) {
  const date = new Date(dateString);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export default function ConversationCard({ conversation, allTags, asTableRow, isLast }: ConversationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter tags for this conversation
  const conversationTags = allTags.filter(tag => 
    conversation.tag_id.includes(tag.id)
  );

  if (asTableRow) {
    return <>
      <tr>
        <td className={`px-2 py-2 font-medium truncate w-1/3 align-middle${!isExpanded && !isLast ? ' border-b' : ''}`}>{conversation.customer_name}</td>
        <td className={`px-2 py-2 text-sm text-gray-500 whitespace-nowrap w-32 align-middle${!isExpanded && !isLast ? ' border-b' : ''}`}>{formatDateMMDDYYYY(conversation.date)}</td>
        <td className={`px-2 py-2 w-1/3 align-middle${!isExpanded && !isLast ? ' border-b' : ''}`}>
          <div className="flex gap-1 flex-wrap">
            {conversationTags.map((tag) => (
              <TagComponent 
                key={tag.id} 
                name={tag.name} 
                color="blue"
              />
            ))}
          </div>
        </td>
        <td className={`px-2 py-2 w-10 align-middle${!isExpanded && !isLast ? ' border-b' : ''}`}>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </Button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={4} className={`bg-white px-4 py-3${!isLast ? ' border-b' : ''}`} style={{ borderTop: 'none' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium">Innovera Person:</span>
              <span className="text-sm text-gray-600">{conversation.innovera_person}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Summary</h4>
              <div className="flex items-center justify-center min-h-[140px]">
                <span className="text-lg text-gray-500">Coming soon</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>;
  }

  // fallback: original div-based rendering (not used in table mode)
  return (
    <div className="border-b last:border-b-0">
      <div className="flex items-center justify-between py-3 px-2">
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <span className="font-medium truncate">{conversation.customer_name}</span>
          <span className="text-sm text-gray-500 whitespace-nowrap">{formatDateMMDDYYYY(conversation.date)}</span>
          <div className="flex gap-1 flex-wrap">
            {conversationTags.map((tag) => (
              <TagComponent 
                key={tag.id} 
                name={tag.name} 
                color="blue"
              />
            ))}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </Button>
      </div>
      {isExpanded && (
        <div className="bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Innovera Person:</span>
            <span className="text-sm text-gray-600">{conversation.innovera_person}</span>
          </div>
          <div className="rounded-lg">
            <h4 className="text-sm font-medium mb-2">Summary</h4>
            <div className="flex items-center justify-center min-h-[140px]">
              <span className="text-lg text-gray-500">Coming soon</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 