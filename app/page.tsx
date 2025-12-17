"use client";

import { createClient } from "@/utils/supabase/client";

import * as React from "react";
import { Sidebar } from "@/components/sidebar";
import { Editor } from "@/components/editor";
import { AIChat } from "@/components/ai-chat";
import { SettingsDialog } from "@/components/settings-dialog";

interface Tag {
  id: string;
  name: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  date: string; // We'll map created_at/updated_at to this
  pinned: boolean; // Mapped from is_pinned
  trashed?: boolean; // Mapped from is_deleted
  tag_id?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: string[];
}

export default function Home() {
  const [currentView, setCurrentView] = React.useState<"notes" | "ai" | "trash" | "settings">("notes");
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [availableTags, setAvailableTags] = React.useState<string[]>([]);

  const [tags, setTags] = React.useState<Tag[]>([]);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [trashNotes, setTrashNotes] = React.useState<Note[]>([]);
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [currentNoteId, setCurrentNoteId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch Data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [notesRes, tagsRes, trashRes, chatRes] = await Promise.all([
        fetch('/api/notes'),
        fetch('/api/tags'),
        fetch('/api/trash'),
        fetch('/api/chat')
      ]);

      let fetchedNotes: Note[] = [];

      if (notesRes.ok) {
        const data = await notesRes.json();
        fetchedNotes = data.map((n: any) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          date: new Date(n.updated_at).toLocaleDateString(),
          pinned: n.is_pinned,
          trashed: false,
          tag_id: n.tag_id
        }));
        setNotes(fetchedNotes);
      }

      if (tagsRes.ok) {
        const data = await tagsRes.json();
        setTags(data);
      }

      if (trashRes.ok) {
        const data = await trashRes.json();
        setTrashNotes(data.map((n: any) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          date: new Date(n.deleted_at).toLocaleDateString(),
          pinned: n.is_pinned,
          trashed: true,
          tag_id: n.tag_id
        })));
      }

      if (chatRes.ok) {
        const data = await chatRes.json();
        setChatMessages(data.map((m: any) => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments
        })));
      }

      // Check for welcome note creation
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const hasSeenWelcome = localStorage.getItem(`hasSeenWelcome_${user.id}`);

        if (!hasSeenWelcome && fetchedNotes.length === 0) {
          const welcomeContent = `
<h2 style="text-align: center">WELCOME TO PA-NOTE APP!</h2>
<p style="text-align: center"><em><strong>Kindly Explore Our App!!</strong></em></p>
<p><strong>Features:</strong></p>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Note Taking</p></div></li>
</ul>
<ul>
  <li><p>Photo Attachment</p></li>
  <li><p>Tags</p></li>
  <li><p>Note Searching (tag)</p></li>
</ul>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Baldy (AI)</p></div></li>
</ul>
<ul>
  <li><p>Image to Text Converter</p></li>
  <li><p>Chat Bot</p></li>
  <li><p>AI Message transfer to existing notes or new notes</p></li>
</ul>
<p><strong>Developer:</strong></p>
<ul>
  <li><p>Jerean Camerino</p></li>
  <li><p>Roman Cenica</p></li>
  <li><p>Erol John Nool</p></li>
  <li><p>Danielle Yvan Senador</p></li>
</ul>
`;
          // Create welcome note
          await fetch('/api/notes', {
            method: 'POST',
            body: JSON.stringify({ title: 'Welcome to PA-Note App!', content: welcomeContent })
          }).then(async (res) => {
            if (res.ok) {
              const n = await res.json();
              const newNote: Note = {
                id: n.id,
                title: n.title,
                content: n.content || '',
                date: new Date(n.updated_at).toLocaleDateString(),
                pinned: n.is_pinned,
                trashed: false,
                tag_id: n.tag_id
              };
              setNotes([newNote]); // Set directly since we know it was empty
              setCurrentNoteId(newNote.id);
              // Wait a bit to ensure UI updates? No need.
            }
          });
          localStorage.setItem(`hasSeenWelcome_${user.id}`, 'true');
        } else if (fetchedNotes.length > 0) {
          // If they have notes, assume they've seen it or don't need it
          localStorage.setItem(`hasSeenWelcome_${user.id}`, 'true');
        }
      }

    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize availableTags from existing notes
  React.useEffect(() => {
    // This effect should probably be removed or refactored if tags are managed via `tags` state
    // For now, keeping it as is but noting it might be redundant with `tags` state
    const initialTags = Array.from(new Set(notes.flatMap(note => note.tag_id ? [note.tag_id] : [])));
    if (availableTags.length === 0 && initialTags.length > 0) {
      setAvailableTags(initialTags);
    }
  }, [notes, availableTags]); // Run when notes change

  const handleNavigate = (view: "notes" | "ai" | "trash" | "settings") => {
    if (view === "settings") {
      setIsSettingsOpen(true);
    } else {
      setCurrentView(view);
      // If switching to notes/trash, maybe select the first one?
      setCurrentNoteId(null);
    }
  };

  // Tag Handlers
  // Tag Handlers
  const handleAddTag = async (name: string) => {
    if (!name.trim()) return;

    // Check if tag exists
    const existingTag = tags.find(t => t.name.toLowerCase() === name.trim().toLowerCase());
    if (existingTag) {
      // Just assign it to current note
      if (currentNoteId) {
        handleUpdateNote(currentNoteId, currentNote?.title || "", currentNote?.content || "", existingTag.id);
      }
      return;
    }

    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() })
      });
      if (res.ok) {
        const newTag = await res.json();
        setTags([...tags, newTag]);
        // Assign to current note
        if (currentNoteId) {
          handleUpdateNote(currentNoteId, currentNote?.title || "", currentNote?.content || "", newTag.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTagFromNote = (tagId: string) => {
    if (currentNoteId) {
      handleUpdateNote(currentNoteId, currentNote?.title || "", currentNote?.content || "", undefined);
    }
  };

  const handleDeleteTag = async (id: string) => {
    // Optimistic update
    setTags(tags.filter((tag) => tag.id !== id));
    setNotes(notes.map(n => n.tag_id === id ? { ...n, tag_id: undefined } : n));
    setTrashNotes(trashNotes.map(n => n.tag_id === id ? { ...n, tag_id: undefined } : n));

    try {
      await fetch(`/api/tags/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
      fetchData(); // Revert on error
    }
  };

  // Note Handlers
  const handleAddNote = async (initialContent: string = '', title: string = 'New Note') => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        body: JSON.stringify({ title, content: initialContent })
      });
      if (res.ok) {
        const n = await res.json();
        const newNote: Note = {
          id: n.id,
          title: n.title,
          content: n.content || '',
          date: new Date(n.updated_at).toLocaleDateString(),
          pinned: n.is_pinned,
          trashed: false,
          tag_id: n.tag_id
        };
        // Use functional state update to ensure we have latest notes
        // However, for welcome note, existing `setNotes` in `fetchData` handles initial load
        // But for user action, this is correct
        setNotes((prev) => [newNote, ...prev]);
        setCurrentNoteId(newNote.id);
        if (currentView === 'trash') setCurrentView('notes');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePinNote = async (id: string) => {
    const noteToUpdate = notes.find(n => n.id === id);
    if (!noteToUpdate) return;

    // Optimistic update
    const updatedNotes = notes.map(note => note.id === id ? { ...note, pinned: !note.pinned } : note);
    setNotes(updatedNotes);

    try {
      await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_pinned: !noteToUpdate.pinned })
      });
    } catch (e) {
      console.error(e);
      // Revert on failure?
      fetchData();
    }
  };

  const handleUpdateNote = async (id: string, title: string, content: string, tag_id?: string | undefined) => {
    // Optimistic update (local state)
    // Update wherever found to ensure UI consistency regardless of current view
    if (notes.some(n => n.id === id)) {
      setNotes(notes.map(note => note.id === id ? { ...note, title, content, tag_id } : note));
    }

    // Also check trash (though less likely to be edited from chat, good for consistency)
    if (trashNotes.some(n => n.id === id)) {
      setTrashNotes(trashNotes.map(note => note.id === id ? { ...note, title, content, tag_id } : note));
    }

    // Debounce this in a real app, but for now direct call
    try {
      await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, content, tag_id })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveToTrash = async (id: string) => {
    // Optimistic
    const note = notes.find(n => n.id === id);
    if (note) {
      setNotes(notes.filter(n => n.id !== id));
      setTrashNotes([{ ...note, trashed: true }, ...trashNotes]);
      if (currentNoteId === id) setCurrentNoteId(null);
    }

    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
      fetchData();
    }
  };

  const handleRestoreFromTrash = async (id: string) => {
    // Optimistic
    const note = trashNotes.find(n => n.id === id);
    if (note) {
      setTrashNotes(trashNotes.filter(n => n.id !== id));
      setNotes([{ ...note, trashed: false }, ...notes]);
      if (currentNoteId === id) setCurrentNoteId(null);
    }

    try {
      await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_deleted: false })
      });
    } catch (e) {
      console.error(e);
      fetchData();
    }
  };

  const handleDeleteForever = async (id: string) => {
    // Optimistic
    setTrashNotes(trashNotes.filter(n => n.id !== id));
    if (currentNoteId === id) setCurrentNoteId(null);

    try {
      await fetch(`/api/trash?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
      fetchData();
    }
  };

  const handleAddToNoteFromChat = (text: string, noteId?: string) => {
    // Helper to format text into HTML paragraphs
    const formatToHtml = (plainText: string) => {
      if (!plainText) return "";
      return plainText.split('\n').map(line => `<p>${line || '<br>'}</p>`).join('');
    };

    const formattedText = formatToHtml(text);

    if (noteId === 'new') {
      handleAddNote(formattedText);
      setCurrentView('notes');
      return;
    }

    const targetId = noteId || currentNoteId;

    if (targetId) {
      // Add to specific or current note
      const note = notes.find(n => n.id === targetId);
      if (note) {
        // Append new content. If existing content doesn't end with a tag, maybe add spacing? 
        // For HTML content, just appending the new paragraphs is usually sufficient.
        const newContent = note.content ? note.content + formattedText : formattedText;
        handleUpdateNote(note.id, note.title, newContent, note.tag_id);
        setCurrentNoteId(note.id);
      }
    } else {
      // No target and no current note => Create new
      handleAddNote(formattedText);
    }
    setCurrentView('notes');
  };

  // Determine what to display
  const displayNotes = currentView === 'trash' ? trashNotes : notes;
  const currentNote = displayNotes.find(n => n.id === currentNoteId);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {isSidebarOpen && (
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          className="hidden md:flex"
          tags={tags}
          onDeleteTag={handleDeleteTag}
          notes={displayNotes}
          currentNoteId={currentNoteId || ''}
          onSelectNote={(id) => {
            setCurrentNoteId(id);
            if (currentView !== 'trash') setCurrentView('notes');
          }}
          onAddNote={() => handleAddNote()}
          onPinNote={handlePinNote}
          isTrash={currentView === 'trash'}
        />
      )}
      <main className={`flex-1 ${currentView === 'ai' ? 'overflow-hidden flex flex-col' : 'overflow-auto'}`}>
        {currentView === "notes" && (
          currentNote ? (
            <Editor
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              tags={currentNote.tag_id ? tags.filter(t => t.id === currentNote.tag_id) : []}
              onAddTag={handleAddTag}
              onDeleteTag={handleDeleteTagFromNote}
              note={currentNote}
              onUpdateNote={(title, content, tag_id) => handleUpdateNote(currentNote.id, title, content, tag_id)}
              onMoveToTrash={() => handleMoveToTrash(currentNote.id)}
              isTrash={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a note or create a new one.
            </div>
          )
        )}
        {currentView === "trash" && (
          currentNote ? (
            <Editor
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              tags={currentNote.tag_id ? tags.filter(t => t.id === currentNote.tag_id) : []}
              onAddTag={handleAddTag}
              onDeleteTag={handleDeleteTagFromNote}
              note={currentNote}
              onUpdateNote={(title, content, tag_id) => handleUpdateNote(currentNote.id, title, content, tag_id)}
              onRestoreNote={() => handleRestoreFromTrash(currentNote.id)}
              onDeleteForever={() => handleDeleteForever(currentNote.id)}
              isTrash={true}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a trashed note to view.
            </div>
          )
        )}
        {currentView === "ai" && <AIChat onAddToNote={handleAddToNoteFromChat} notes={notes} messages={chatMessages} onUpdateMessages={setChatMessages} />}
      </main>
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
}
