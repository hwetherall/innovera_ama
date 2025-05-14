import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { CompanyService } from '@/lib/services/company.service';
import { ConversationService } from '@/lib/services/conversation.service';
import { ConversationSummaryService } from '@/lib/services/conversation-summary.service';
import { TagService } from '@/lib/services/tag.service';
import { Company, CompanyInsert, CustomerConversationWithSummary, Tag } from '@/types/supabase';
import CreateCompanyDialog from './create-company-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ChevronDown, ChevronUp, Pencil, Trash2, Save, X } from 'lucide-react';
import { Tag as TagComponent } from '@/components/ui/tag';
import { Textarea } from '@/components/ui/textarea';
import { TagsInput, getFinalTags } from '@/components/ui/tags-input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ConversationManager() {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clients, setClients] = useState<Company[]>([]);
  const [conversations, setConversations] = useState<CustomerConversationWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<CustomerConversationWithSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingSummary, setEditingSummary] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [deleteCompanyDialogOpen, setDeleteCompanyDialogOpen] = useState(false);
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);

  // Fetch conversations for a client
  const handleClientChange = useCallback(async (clientId: string) => {
    setSelectedClient(clientId);
    setLoadingConversations(true);
    try {
      const conversations = await ConversationService.getAllConversationsWithSummary(clientId);
      setConversations(conversations);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load conversations. Please try again.",
        variant: "destructive",
      });
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  }, [toast]);

  // Fetch all clients and tags on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [companies, allTags] = await Promise.all([
          CompanyService.getAllCompanies(),
          TagService.getAllTags()
        ]);
        setClients(companies);
        setTags(allTags);

        // Auto-select the first client and load its conversations
        if (companies.length > 0) {
          const firstCompanyId = companies[0].id;
          setSelectedClient(firstCompanyId);
          handleClientChange(firstCompanyId);
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load initial data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [toast, handleClientChange]);

  const handleCreateCompany = () => {
    setShowCreateDialog(true);
  };

  const handleCompanyCreated = async (company: CompanyInsert) => {
    const newCompany = await CompanyService.createCompany(company);
    setClients(prev => [...prev, newCompany].sort((a, b) => a.company_name.localeCompare(b.company_name)));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  };

  const getTagNames = (tagIds: string[]) => {
    return tagIds
      .map(id => tags.find(tag => tag.id === id)?.name)
      .filter((name): name is string => name !== undefined);
  };

  const handleDeleteClick = (conversation: CustomerConversationWithSummary) => {
    setConversationToDelete(conversation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    setIsDeleting(true);
    try {
      await ConversationService.deleteConversation(conversationToDelete.id);
      
      // Remove the deleted conversation from the state
      setConversations(prev => prev.filter(conv => conv.id !== conversationToDelete.id));
      
      toast({
        title: "Success",
        description: "Conversation deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete conversation",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const handleEditClick = (conversation: CustomerConversationWithSummary) => {
    // Expand the card if it's not already expanded
    if (expandedConversation !== conversation.id) {
      setExpandedConversation(conversation.id);
    }
    setEditingSummary(conversation.id);
    setEditingTags(conversation.id);
    setEditedContent(conversation.summary_content || '');
    // Set initial selected tags
    const conversationTags = tags.filter(tag => conversation.tag_id.includes(tag.id));
    setSelectedTags(conversationTags);
  };

  const handleCancelEdit = () => {
    setEditingSummary(null);
    setEditingTags(null);
    setEditedContent('');
    setSelectedTags([]);
  };

  const handleSaveChanges = async (conversationId: string) => {
    setIsSaving(true);
    let newTagIds: Tag[] = [];
    let previousTagIds: string[] = [];

    try {
      // Get current conversation and summary
      const currentConversation = conversations.find(c => c.id === conversationId);
      const currentSummary = currentConversation?.summary_content || '';
      previousTagIds = currentConversation?.tag_id || [];

      // Handle tags update if needed
      const currentTagIds = currentConversation?.tag_id || [];
      const { final_tag_ids, new_tag_ids } = await getFinalTags(selectedTags);
      newTagIds = new_tag_ids;

      let tagsWereUpdated = false;
      if (JSON.stringify(currentTagIds.sort()) !== JSON.stringify(final_tag_ids.sort())) {
        try {
          const updatedConversation = await ConversationService.updateConversation(conversationId, {
            tag_id: final_tag_ids
          });

          // Update conversation in state with the server response
          setConversations(prev => prev.map(conv => conv.id === conversationId ? { ...updatedConversation, summary_content: conv.summary_content } : conv));
          tagsWereUpdated = true;
        } catch (error) {
          // Rollback: Delete any newly created tags
          if (newTagIds.length > 0) {
            try {
              await Promise.all(newTagIds.map(tag => TagService.deleteTag(tag.id)));
            } catch (rollbackError) {
              console.error('Error during tag rollback:', rollbackError);
            }
          }
          throw error; // Re-throw to be caught by outer catch
        }
      }

      // Handle summary update if needed
      if (editedContent !== currentSummary) {
        try {
          const updatedSummary = await ConversationSummaryService.updateSummary(conversationId, {
            content: editedContent
          });

          // Update summary in state
          setConversations(prev => prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, summary_content: updatedSummary.content }
              : conv
          ));
        } catch (error) {
          // Rollback: Delete any newly created tags and restore tag_ids
          if (newTagIds.length > 0) {
            try {
              await Promise.all(newTagIds.map(tag => TagService.deleteTag(tag.id)));
            } catch (rollbackError) {
              console.error('Error during tag rollback:', rollbackError);
            }
          }
          if (tagsWereUpdated) {
            // Restore previous tag_ids in state and update the database
            setConversations(prev => prev.map(conv =>
              conv.id === conversationId
                ? { ...conv, tag_id: previousTagIds }
                : conv
            ));
            await ConversationService.updateConversation(conversationId, { tag_id: previousTagIds });
          }
          throw error;
        }
      }

      toast({
        title: "Success",
        description: "Changes saved successfully.",
        variant: "default",
      });

      // Reset editing state
      setEditingSummary(null);
      setEditingTags(null);
      setEditedContent('');
      setSelectedTags([]);

      // After successful save, add new tags to tags state
      if (new_tag_ids && new_tag_ids.length > 0) {
        setTags(prev => [...prev, ...new_tag_ids].sort((a, b) => a.name.localeCompare(b.name)));
      }

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCompanyClick = () => {
    if (!selectedClient) return;
    setDeleteCompanyDialogOpen(true);
  };

  const handleDeleteCompanyConfirm = async () => {
    if (!selectedClient) return;

    setIsDeletingCompany(true);
    try {
      // Delete the company - cascading will handle the rest
      await CompanyService.deleteCompany(selectedClient);

      // Remove the company from the list and get the updated list
      const updatedClients = clients.filter(client => client.id !== selectedClient);
      setClients(updatedClients);
      
      // Clear the current view
      setConversations([]);

      // Select the next company if available
      if (updatedClients.length > 0) {
        setSelectedClient(updatedClients[0].id);
        // Trigger the client change to load conversations
        handleClientChange(updatedClients[0].id);
      } else {
        setSelectedClient(null);
      }

      toast({
        title: "Success",
        description: "Company deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete company",
        variant: "destructive",
      });
    } finally {
      setIsDeletingCompany(false);
      setDeleteCompanyDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Manage Conversations</h3>
        <Button onClick={handleCreateCompany}>Create Client Company</Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-full max-w-xs">
          <Select
            value={selectedClient || ''}
            onValueChange={handleClientChange}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading clients..." : "Select a client"}>
                {selectedClient ? clients.find(c => c.id === selectedClient)?.company_name : ''}
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

      {selectedClient && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold mb-2">
            Customer Conversations for {clients.find(c => c.id === selectedClient)?.company_name}
          </h4>
          
          {loadingConversations ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-gray-500 pt-4 pb-2">No conversations found for this client.</p>
          ) : (
            <div className="space-y-4">
              {conversations.map((conv) => (
                <Card key={conv.id} className="shadow-[0_2px_4px_0_rgba(0,0,0,0.05)]">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{conv.customer_name} - {formatDate(conv.date)}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Innovera Contact: {conv.innovera_person}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-gray-900"
                          onClick={() => handleEditClick(conv)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#D11A2A] hover:text-[#B01523]"
                          onClick={() => handleDeleteClick(conv)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedConversation(
                            expandedConversation === conv.id ? null : conv.id
                          )}
                        >
                          {expandedConversation === conv.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {expandedConversation === conv.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-medium text-gray-700">Tags:</p>
                            {editingTags === conv.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClick(conv)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {editingTags === conv.id ? (
                            <TagsInput
                              tagOptions={tags}
                              selectedTags={selectedTags}
                              onTagsChange={setSelectedTags}
                              isLoading={false}
                            />
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {getTagNames(conv.tag_id)
                                .sort((a, b) => a.localeCompare(b))
                                .map(tagName => (
                                  <TagComponent key={tagName} name={tagName} />
                                ))}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-medium text-gray-700">Summary:</p>
                          </div>
                          
                          {editingSummary === conv.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="min-h-[400px]"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  disabled={isSaving}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveChanges(conv.id)}
                                  disabled={isSaving}
                                >
                                  {isSaving ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4 mr-2" />
                                      Save
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          ) : conv.summary_content ? (
                            <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 whitespace-pre-wrap">
                              {conv.summary_content}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No summary available</p>
                          )}
                    </div>
                  </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedClient && (
        <>
          <div className="pt-8 border-t">
            <Button
              variant="outline"
              className="bg-[#D11A2A] hover:bg-[#B01523] text-white border-0"
              onClick={handleDeleteCompanyClick}
              disabled={isDeletingCompany}
            >
              {isDeletingCompany ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Company'
              )}
            </Button>
          </div>
        </>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to delete this conversation?</p>
            <p className="mt-2 text-sm text-gray-500">
              This will permanently delete the conversation, its transcript, notes, and summary. This action cannot be undone.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#D11A2A] hover:bg-[#B01523] text-white"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Conversation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteCompanyDialogOpen} onOpenChange={setDeleteCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to delete this company and all its conversations?</p>
            <p className="mt-2 text-sm text-gray-500">
              This will permanently delete the company and all its conversations, transcripts, notes, and summaries. This action cannot be undone.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteCompanyDialogOpen(false)}
              disabled={isDeletingCompany}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#D11A2A] hover:bg-[#B01523] text-white"
              onClick={handleDeleteCompanyConfirm}
              disabled={isDeletingCompany}
            >
              {isDeletingCompany ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Company'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateCompanyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCompanyCreated}
      />
    </div>
  );
} 