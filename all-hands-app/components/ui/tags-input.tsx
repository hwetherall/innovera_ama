import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Tag } from '@/types/supabase';
import { TagService } from '@/lib/services/tag.service';

interface TagsInputProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  className?: string;
  tagOptions: Tag[];
  isLoading?: boolean;
}

interface TagResult {
  final_tag_ids: string[];
  new_tag_ids: Tag[];
}

export async function getFinalTags(selectedTags: Tag[]): Promise<TagResult> {
  try {
    // Create any pending tags first
    const pendingTags = selectedTags.filter(tag => tag.id.startsWith('pending-'));
    const createdTags = await Promise.all(
      pendingTags.map(tag => TagService.createTag({ name: tag.name }))
    );

    // Verify all pending tags were created successfully
    const missingTags = pendingTags.filter(pendingTag => 
      !createdTags.some(createdTag => createdTag.name === pendingTag.name)
    );
    
    if (missingTags.length > 0) {
      throw new Error(`Failed to create tags: ${missingTags.map(t => t.name).join(', ')}`);
    }

    // Get final list of tag IDs
    const finalTagIds = selectedTags.map(tag => {
      if (tag.id.startsWith('pending-')) {
        const createdTag = createdTags.find(t => t.name === tag.name);
        if (!createdTag) {
          throw new Error(`Failed to find created tag for: ${tag.name}`);
        }
        return createdTag.id;
      }
      return tag.id;
    });

    // Get list of new tag objects
    const newTagObjs = createdTags;

    return { final_tag_ids: finalTagIds, new_tag_ids: newTagObjs };
  } catch (error) {
    console.error('Error creating tags:', error);
    throw error;
  }
}

export function TagsInput({ selectedTags, onTagsChange, className, tagOptions, isLoading = false }: TagsInputProps) {
  const [tagInput, setTagInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const getAvailableTags = () => {
    return tagOptions.filter(opt => 
      !selectedTags.some(t => t.id === opt.id) && 
      opt.name.toLowerCase().includes(tagInput.toLowerCase())
    );
  };

  const selectTag = (tag: Tag) => {
    onTagsChange([...selectedTags, tag]);
    setTagInput('');
    setShowDropdown(false);
  };

  const createLocalTag = (name: string) => {
    onTagsChange([...selectedTags, { id: `pending-${name}`, name }]);
    setTagInput('');
    setShowDropdown(false);
  };

  return (
    <div className={className} ref={containerRef}>
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
                onClick={() => onTagsChange(selectedTags.filter(t => t.id !== tag.id))}
              >
                &times;
              </button>
            </span>
          ))}
          <Input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder={isLoading ? "Loading tags..." : tagOptions.length === 0 ? "No tags available" : "Type to search tags..."}
            className="flex-1 min-w-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-6"
            disabled={isLoading || tagOptions.length === 0}
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
  );
} 