import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { TagService } from '@/lib/services/tag.service';
import { CompanyService } from '@/lib/services/company.service';
import { TranscriptService } from '@/lib/services/transcript.service';
import { Company } from '@/types/supabase';
import { Tag } from '@/types/supabase';
import { ConversationService } from '@/lib/services/conversation.service';
import { ConversationTranscriptService } from '@/lib/services/conversation-transcript.service';
import { ConversationNoteService } from '@/lib/services/conversation-note.service';
import { AIService } from '@/lib/services/ai.service';
import { ConversationSummaryService } from '@/lib/services/conversation-summary.service';

const INNOVERA_CONTACTS = [
  'Harry Wetherall',
  'Daniel Kozlov',
  'Felipe Goes',
  'Pedram Mokrian',
];

interface TranscriptResult {
  text: string;
  pages: number;
}

export default function CreateConversation() {
  const { toast } = useToast();
  const [company, setCompany] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [innoveraContact, setInnoveraContact] = useState('');
  const [selectedTags, setSelectedTags] = useState<{ id: string; name: string }[]>([]);
  const [date, setDate] = useState('');
  const [transcriptContent, setTranscriptContent] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [tagOptions, setTagOptions] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchCompanies();
    fetchTags();
  }, []);

  useEffect(() => {
    const textarea = notesRef.current;
    if (textarea) {
      textarea.style.height = '100px'; // Reset height
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = Math.min(scrollHeight, 250) + 'px'; // Set new height, max 250px
    }
  }, [notes]);

  const fetchCompanies = async () => {
    try {
      setIsLoadingCompanies(true);
      const companies = await CompanyService.getAllCompanies();
      setCompanies(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setIsLoadingCompanies(false);
    }
  };
  
  const fetchTags = async () => {
    try {
      setIsLoadingTags(true);
      const tags = await TagService.getAllTags();
      setTagOptions(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setIsLoadingTags(false);
    }
  };

  const clearFileInput = () => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (!selectedFile) return;

    // Check file type
    const fileType = selectedFile.type;
    const fileName = selectedFile.name.toLowerCase();

    // Handle text files
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setTranscriptContent(content.trim());
      };
      reader.onerror = () => {
        toast({
          title: "File Reading Error",
          description: "Failed to read the text file.",
          variant: "destructive",
        });
        clearFileInput();
      };
      reader.readAsText(selectedFile);
      return;
    }

    // Handle PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      setIsProcessing(true);
      
      TranscriptService.extractTextFromPDF(selectedFile) //Reused from transcript-upload.tsx
        .then((result: TranscriptResult) => {
          setTranscriptContent(result.text.trim());
          
          toast({
            title: "PDF Processed",
            description: `Successfully extracted text from ${result.pages} pages of the PDF.`,
            variant: "default",
          });
        })
        .catch((error: Error) => {
          console.error('Error processing PDF:', error);
          toast({
            title: "PDF Processing Error",
            description: error.message || "Failed to extract text from the PDF file.",
            variant: "destructive",
          });
          clearFileInput();
        })
        .finally(() => {
          setIsProcessing(false);
        });
      
      return;
    }
  };

  const getAvailableTags = () => {
    return tagOptions.filter(opt => 
      !selectedTags.some(t => t.id === opt.id) && 
      opt.name.toLowerCase().includes(tagInput.toLowerCase())
    );
  };

  const selectTag = (tag: Tag) => {
    setSelectedTags([...selectedTags, { id: tag.id, name: tag.name }]);
    setTagInput('');
    setShowDropdown(false);
  };

  const createLocalTag = (name: string) => {
    setSelectedTags([...selectedTags, { id: `pending-${name}`, name }]);
    setTagInput('');
    setShowDropdown(false);
  };

  const getFinalTags = async (): Promise<string[]> => {	
    try {
      // Create any pending tags first
      const pendingTags = selectedTags.filter(tag => tag.id.startsWith('pending-'));
      const createdTags = await Promise.all(
        pendingTags.map(tag => TagService.createTag({ name: tag.name }))
      );

      // Get final list of tag IDs
      const finalTagIds = selectedTags.map(tag => {
        if (tag.id.startsWith('pending-')) {
          const createdTag = createdTags.find(t => t.name === tag.name);
          return createdTag?.id || tag.id;
        }
        return tag.id;
      });

      return finalTagIds;
    } catch (error) {
      console.error('Error creating tags:', error);
      throw error; // Re-throw the error to be handled by the caller
    } 
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      // New validation: all fields except tags are required
      if (
        !company ||
        !clientName.trim() ||
        !innoveraContact ||
        !date ||
        !file
      ) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in all required fields and upload a file.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const finalTagIds = await getFinalTags();
      const formattedDate = new Date(date).toISOString().split('T')[0];

      // Prepare conversation data
      const conversation = {
        customer_name: clientName,
        innovera_person: innoveraContact,
        date: formattedDate,
        tag_id: finalTagIds,
      };

      const createdConversation = await ConversationService.createConversation(company, conversation);

      // Create transcript
      await ConversationTranscriptService.createTranscript({
        content: transcriptContent,
        conversation_id: createdConversation.id,
      });

      // Create note
      await ConversationNoteService.createNote({
        content: notes,
        conversation_id: createdConversation.id,
      });

      // Generate summary
      const summaryRequest = {
        transcriptContent,
        notes,
        client_company: companies.find(c => c.id === company)?.company_name || 'Unknown Company',
        customer_name: clientName,
        innovera_person: innoveraContact,
        tags: selectedTags.map(tag => tag.name),
      };

      const summaryResponse = await AIService.generateSummary(summaryRequest);
      console.log('Generated Summary:', summaryResponse.summary);

      // Save summary to database
      await ConversationSummaryService.createOrUpdateSummary(createdConversation.id, {
        content: summaryResponse.summary,
        conversation_id: createdConversation.id,
      });

      toast({
        title: "Conversation Created",
        description: "The customer conversation was created successfully.",
        variant: "default",
      });

      // Reset form
      setClientName("");
      setInnoveraContact("");
      setDate("");
      setSelectedTags([]);
      setTranscriptContent("");
      setNotes("");
      setCompany("");
      setFile(null);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to create conversation';
      toast({
        title: "Error",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Conversation</CardTitle>
        <CardDescription>
          Fill out the form below to create a new customer conversation.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Company Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-2">Company</label>
            <Select
              value={company}
              onValueChange={setCompany}
              disabled={isProcessing || isLoadingCompanies || companies.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingCompanies ? "Loading companies..." : companies.length === 0 ? "No companies available" : "Select a company"}>
                  {company && companies.find(c => c.id === company)?.company_name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Client Name</label>
            <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client name" />
          </div>
          {/* Innovera Contact */}
          <div>
            <label className="block text-sm font-medium mb-2">Innovera Contact</label>
            <Select value={innoveraContact} onValueChange={setInnoveraContact}>
              <SelectTrigger>
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent>
                {INNOVERA_CONTACTS.map(contact => (
                  <SelectItem key={contact} value={contact}>{contact}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Tags Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="relative">
              <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px] bg-background">
                {selectedTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-700"
                  >
                    {tag.name}
                    <button
                      type="button"
                      className="ml-2 text-gray-500 hover:text-red-500 focus:outline-none"
                      onClick={() => setSelectedTags(selectedTags.filter(t => t.id !== tag.id))}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <Input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={isLoadingTags ? "Loading tags..." : tagOptions.length === 0 ? "No tags available" : "Type to search tags..."}
                  className="flex-1 min-w-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-6"
                  disabled={isLoadingTags || tagOptions.length === 0}
                />
              </div>
              {/* Tag options dropdown */}
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md max-h-[200px] overflow-auto">
                  {getAvailableTags().map(opt => (
                    <div
                      key={opt.id}
                      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      onClick={() => selectTag(opt)}
                    >
                      {opt.name}
                    </div>
                  ))}
                  {tagInput && getAvailableTags().length === 0 && (
                    <div
                      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      onClick={() => createLocalTag(tagInput)}
                    >
                      Create tag &quot;{tagInput}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40" />
          </div>
          {/* Upload PDF or Text File */}
          <div>
            <label className="block text-sm font-medium mb-2">Upload PDF or Text File</label>
            <Input type="file" accept=".pdf,.txt" onChange={handleFileUpload} />
          </div>
          {/* Transcript Content */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Transcript Content
            </label>
            <Textarea
              placeholder="Upload a file to extract transcript content"
              value={transcriptContent}
              readOnly
              className="min-h-[300px] max-h-[500px] overflow-y-auto bg-gray-50 text-gray-700"
            />
          </div>
          {/* Notes Field */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Notes
            </label>
            <Textarea
              ref={notesRef}
              placeholder="Enter any notes about this conversation"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[150px] max-h-[250px] overflow-y-auto"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Add'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 