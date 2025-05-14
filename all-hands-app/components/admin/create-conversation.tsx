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
import { Company, CustomerConversation } from '@/types/supabase';
import { Tag } from '@/types/supabase';
import { ConversationService } from '@/lib/services/conversation.service';
import { ConversationTranscriptService } from '@/lib/services/conversation-transcript.service';
import { ConversationNoteService } from '@/lib/services/conversation-note.service';
import { AIService } from '@/lib/services/ai.service';
import { ConversationSummaryService } from '@/lib/services/conversation-summary.service';
import { TagsInput, getFinalTags } from '@/components/ui/tags-input';

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
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [date, setDate] = useState('');
  const [transcriptContent, setTranscriptContent] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [tagOptions, setTagOptions] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
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

    // Handle vtt files
    if (fileType === 'text/vtt' || fileName.endsWith('.vtt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        // Remove VTT timestamps and sequence numbers
        let cleanedContent = content.replace(/^WEBVTT\s*\n/, '');
        cleanedContent = cleanedContent.replace(/^\d+\s*\n\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\s*\n/gm, '');
        setTranscriptContent(cleanedContent.trim());
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    let createdConversation: CustomerConversation | null = null;
    let newTagIds: Tag[] = [];

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

      const finalTagResult = await getFinalTags(selectedTags);
      newTagIds = finalTagResult.new_tag_ids;
      
      const formattedDate = new Date(date).toISOString().split('T')[0];

      // Prepare conversation data
      const conversation = {
        customer_name: clientName,
        innovera_person: innoveraContact,
        date: formattedDate,
        tag_id: finalTagResult.final_tag_ids,
      };

      createdConversation = await ConversationService.createConversation(company, conversation);

      // Create transcript
      await ConversationTranscriptService.createTranscript({
        content: transcriptContent,
        conversation_id: createdConversation.id,
      });

      if (notes) {
        // Create note
        await ConversationNoteService.createNote({
          content: notes,
          conversation_id: createdConversation.id,
        });
      }

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

      // Save summary to database
      await ConversationSummaryService.createSummary(createdConversation.id, {
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

      // After successful creation, add new tags to tagOptions state
      if (finalTagResult.new_tag_ids && finalTagResult.new_tag_ids.length > 0) {
        setTagOptions(prev => [...prev, ...finalTagResult.new_tag_ids].sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (error: unknown) {
      let errMsg = error instanceof Error ? error.message : 'Failed to create conversation';
      
      // Rollback operations
      try {
        // Delete created conversation if it exists (this will cascade delete transcript, notes, and summary)
        if (createdConversation) {
          await ConversationService.deleteConversation(createdConversation.id);
        }

        // Delete any newly created tags
        if (newTagIds.length > 0) {
          await Promise.all(
            newTagIds.map(tag => TagService.deleteTag(tag.id))
          );
        }
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
        errMsg += ' (Rollback failed)';
      }

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
            <TagsInput
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              tagOptions={tagOptions}
              isLoading={isLoadingTags}
            />
          </div>
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40" />
          </div>
          {/* Upload PDF or Text File */}
          <div>
            <label className="block text-sm font-medium mb-2">Upload PDF, VTT or Text File</label>
            <Input type="file" accept=".pdf,.txt,.vtt" onChange={handleFileUpload} />
          </div>
          {/* Transcript Content */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Transcript Content
            </label>
            <Textarea
              placeholder="Upload a file to extract transcript content or type directly"
              value={transcriptContent}
              className="min-h-[300px] max-h-[500px] overflow-y-auto bg-gray-50 text-gray-700"
              onChange={(e) => setTranscriptContent(e.target.value)}
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