<!-- Notes Page with Beautiful Formatting and Real-time Updates -->
<script lang="ts">
  import { onMount } from 'svelte';
  import DOMPurify from 'isomorphic-dompurify';
  import { marked } from 'marked';

  interface Note {
    id: string;
    title: string;
    content: string;
    summary: string | null;
    isAIGenerated: boolean;
    isRecentlyUpdated: boolean;
    tags: string[];
    relatedQuery: string | null;
    relatedSources: any[] | null;
    createdAt: string;
    updatedAt: string;
  }

  let notes: Note[] = [];
  let loading = true;
  let error = '';
  let searchTerm = '';
  let selectedTag = '';
  let showNewNoteForm = false;
  let newNote = {
    title: '',
    content: '',
    tags: ''
  };
  let editingNote: Note | null = null;

  // Authentication state
  let isAuthenticated = false;
  let authToken = '';

  onMount(() => {
    // Check authentication
    authToken = localStorage.getItem('auth_token') || '';
    isAuthenticated = !!authToken;
    
    if (isAuthenticated) {
      loadNotes();
    } else {
      loading = false;
    }
  });

  async function loadNotes() {
    try {
      loading = true;
      const response = await fetch('/api/notes', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          isAuthenticated = false;
          localStorage.removeItem('auth_token');
          return;
        }
        throw new Error('Failed to load notes');
      }

      const data = await response.json();
      notes = data.notes;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load notes';
    } finally {
      loading = false;
    }
  }

  async function createNote() {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: newNote.title,
          content: newNote.content,
          tags: newNote.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      });

      if (!response.ok) throw new Error('Failed to create note');

      const data = await response.json();
      notes = [data.note, ...notes];
      
      // Reset form
      newNote = { title: '', content: '', tags: '' };
      showNewNoteForm = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create note';
    }
  }

  async function updateNote(noteId: string, updatedData: Partial<Note>) {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) throw new Error('Failed to update note');

      const data = await response.json();
      notes = notes.map(note => note.id === noteId ? data.note : note);
      editingNote = null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update note';
    }
  }

  async function deleteNote(noteId: string) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete note');

      notes = notes.filter(note => note.id !== noteId);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete note';
    }
  }

  async function markAsRead(noteId: string) {
    try {
      await fetch(`/api/notes/${noteId}/mark-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      notes = notes.map(note => 
        note.id === noteId ? { ...note, isRecentlyUpdated: false } : note
      );
    } catch (err) {
      console.error('Failed to mark note as read:', err);
    }
  }

  function renderMarkdown(content: string): string {
    // Temporary simple rendering - just return sanitized content
    return DOMPurify.sanitize(content.replace(/\n/g, '<br>'));
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function startEditing(note: Note) {
    editingNote = { ...note };
  }

  function cancelEditing() {
    editingNote = null;
  }

  // Computed filtered notes
  $: filteredNotes = notes.filter(note => {
    const matchesSearch = !searchTerm || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !selectedTag || note.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  // Get all unique tags
  $: allTags = [...new Set(notes.flatMap(note => note.tags))];
</script>

<div class="min-h-screen bg-gray-900 px-10 py-8">
  <div class="max-w-6xl mx-auto">
    
    {#if !isAuthenticated}
      <!-- Authentication Required -->
      <div class="text-center py-16">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 max-w-md mx-auto">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Authentication Required</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">Please log in to access your notes.</p>
          <div class="space-y-3">
            <a href="/login" class="block w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors">
              Log In
            </a>
            <a href="/register" class="block w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 px-4 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              Create Account
            </a>
          </div>
        </div>
      </div>
    {:else}
      
      <!-- Header Section -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">My Notes</h1>
            <p class="text-gray-600 dark:text-gray-400">Organize your learning and research insights</p>
          </div>
          
          <button 
            on:click={() => showNewNoteForm = true}
            class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            New Note
          </button>
        </div>
        
        <!-- Search and Filter -->
        <div class="mt-6 flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <input
              type="text"
              placeholder="Search notes..."
              bind:value={searchTerm}
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <select 
            bind:value={selectedTag}
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Tags</option>
            {#each allTags as tag}
              <option value={tag}>{tag}</option>
            {/each}
          </select>
        </div>
      </div>

      {#if error}
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
          <p class="text-red-600 dark:text-red-400">{error}</p>
        </div>
      {/if}

      {#if loading}
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      {:else if filteredNotes.length === 0}
        <div class="text-center py-12">
          <div class="text-gray-400 dark:text-gray-500 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          {#if searchTerm || selectedTag}
            <p class="text-gray-500 dark:text-gray-400">No notes match your search criteria.</p>
          {:else}
            <p class="text-gray-500 dark:text-gray-400 mb-4">You haven't created any notes yet.</p>
            <p class="text-sm text-gray-400 dark:text-gray-500">Start learning and use "Add to Notes" to save insights!</p>
          {/if}
        </div>
      {:else}
        
        <!-- Notes Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each filteredNotes as note}
            <div 
              class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative transition-all duration-200 hover:shadow-md"
              class:ring-2={note.isRecentlyUpdated}
              class:ring-blue-500={note.isRecentlyUpdated}
              class:ring-opacity-50={note.isRecentlyUpdated}
            >
              
              <!-- Recently Updated Badge -->
              {#if note.isRecentlyUpdated}
                <div class="absolute -top-2 -right-2">
                  <span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                    New
                  </span>
                </div>
              {/if}

              <!-- AI Generated Badge -->
              {#if note.isAIGenerated}
                <div class="absolute top-4 right-4">
                  <span class="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 text-xs px-2 py-1 rounded-full">
                    AI
                  </span>
                </div>
              {/if}

              <!-- Note Content -->
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {note.title}
                </h3>
                
                <div class="prose prose-sm dark:prose-invert max-w-none">
                  {@html renderMarkdown(note.content.substring(0, 200) + (note.content.length > 200 ? '...' : ''))}
                </div>

                <!-- Tags -->
                {#if note.tags.length > 0}
                  <div class="flex flex-wrap gap-1">
                    {#each note.tags as tag}
                      <span class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded">
                        {tag}
                      </span>
                    {/each}
                  </div>
                {/if}

                <!-- Metadata -->
                <div class="text-xs text-gray-500 dark:text-gray-400 border-t pt-3">
                  <p>Created: {formatDate(note.createdAt)}</p>
                  {#if note.relatedQuery}
                    <p class="mt-1 italic">From: "{note.relatedQuery.substring(0, 50)}..."</p>
                  {/if}
                </div>

                <!-- Actions -->
                <div class="flex justify-between items-center pt-3 border-t">
                  <div class="flex gap-2">
                    <button 
                      on:click={() => startEditing(note)}
                      class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button 
                      on:click={() => deleteNote(note.id)}
                      class="text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                  
                  {#if note.isRecentlyUpdated}
                    <button 
                      on:click={() => markAsRead(note.id)}
                      class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Mark Read
                    </button>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}

    {/if}
  </div>
</div>

<!-- New Note Modal -->
{#if showNewNoteForm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Create New Note</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              bind:value={newNote.title}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter note title..."
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <textarea
              bind:value={newNote.content}
              rows="8"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Write your note in markdown..."
            ></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              bind:value={newNote.tags}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter tags separated by commas..."
            />
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button 
            on:click={() => showNewNoteForm = false}
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button 
            on:click={createNote}
            class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            disabled={!newNote.title || !newNote.content}
          >
            Create Note
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Edit Note Modal -->
{#if editingNote}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Edit Note</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              bind:value={editingNote.title}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <textarea
              bind:value={editingNote.content}
              rows="8"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            ></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              bind:value={editingNote.tags}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button 
            on:click={cancelEditing}
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
                     <button 
             on:click={() => {
               if (editingNote) {
                 const tagsString = Array.isArray(editingNote.tags) ? editingNote.tags.join(',') : editingNote.tags;
                 updateNote(editingNote.id, { 
                   title: editingNote.title, 
                   content: editingNote.content, 
                   tags: tagsString.split(',').map(tag => tag.trim()).filter(Boolean) 
                 });
               }
             }}
             class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
           >
             Save Changes
           </button>
        </div>
      </div>
    </div>
  </div>
{/if} 