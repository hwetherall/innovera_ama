import { Tag, TagInsert } from '@/types/supabase';

export const TagService = {
    async getAllTags(): Promise<Tag[]> {
        try {
            const res = await fetch('/api/tags');
            
            if (!res.ok) {
            throw new Error('Failed to fetch tags');
            }
            
            return await res.json();
        } catch (err) {
            throw new Error(`Error fetching tags: ${err instanceof Error ? err.message : err}`);
        }
        },
        
    async createTag(tag: TagInsert): Promise<Tag> {
    try {
        const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tag),
        });

        if (!res.ok) {
        throw new Error('Failed to create tag');
        }

        return await res.json();
    } catch (err) {
        throw new Error(`Error creating tag: ${err instanceof Error ? err.message : err}`);
    }
    },

    async deleteTag(id: string): Promise<void> {
    try {
        const res = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
        });

        if (!res.ok) {
        throw new Error('Failed to delete tag');
        }
    } catch (err) {
        throw new Error(`Error deleting tag: ${err instanceof Error ? err.message : err}`);
    }
    },

    async getTagsByIds(tagIds: string[]): Promise<Tag[]> {
        try {
            const res = await fetch(`/api/tags?ids=${tagIds.join(',')}`);
            if (!res.ok) {
                throw new Error('Failed to fetch tags');
            }
            return await res.json();
        } catch (error) {
            throw new Error(`Error fetching tags: ${error instanceof Error ? error.message : error}`);
        }
    }
}; 