"use client";

import * as React from "react";
import { Sidebar } from "@/components/sidebar";
import { Editor } from "@/components/editor";
import { AIChat } from "@/components/ai-chat";
import { SettingsDialog } from "@/components/settings-dialog";

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  pinned: boolean;
  trashed?: boolean;
  tags: string[];
}

export default function Home() {
  const [currentView, setCurrentView] = React.useState<"notes" | "ai" | "trash" | "settings">("notes");
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  // Note State - Initial Welcome Note
  const [notes, setNotes] = React.useState<Note[]>([
    {
      id: 'welcome-note',
      title: 'Welcome to Pa-Note',
      content: `Pa-Note is an easy way to take notes, capture ideas, and more. Open it, jot down some thoughts, and you're done. 

Pinned Notes

Have a few important notes that you keep coming back to? Pin those notes to the top of your list for easier access.

Tags

Keep your notes organized by adding tags. Tags work a bit like folders, except there’s no limit to the number of tags you can add per note.

Search

Quickly find notes using search.`,
      date: new Date().toLocaleDateString(),
      pinned: true,
      trashed: false,
      tags: []
    }
  ]);
  const [currentNoteId, setCurrentNoteId] = React.useState<string>('welcome-note');

  const handleNavigate = (view: "notes" | "ai" | "trash" | "settings") => {
    if (view === "settings") {
      setIsSettingsOpen(true);
    } else {
      setCurrentView(view);
    }
  };

  // Tag Handlers
  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag || !currentNoteId) return;

    setNotes(notes.map(note => {
      if (note.id === currentNoteId) {
        if (!note.tags.includes(trimmedTag)) {
          return { ...note, tags: [...note.tags, trimmedTag] };
        }
      }
      return note;
    }));
  };

  const handleRemoveTagFromNote = (tagToDelete: string) => {
    if (!currentNoteId) return;

    setNotes(notes.map(note => {
      if (note.id === currentNoteId) {
        return { ...note, tags: note.tags.filter(t => t !== tagToDelete) };
      }
      return note;
    }));
  };

  // Global delete for sidebar
  const handleDeleteTagGlobally = (tagToDelete: string) => {
    setNotes(notes.map(note => ({
      ...note,
      tags: note.tags.filter(t => t !== tagToDelete)
    })));
  };

  // Derive all unique tags from all notes for the sidebar
  const allTags = Array.from(new Set(notes.flatMap(note => note.tags || [])));

  // Note Handlers
  const handleAddNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Title',
      content: '',
      date: new Date().toLocaleDateString(),
      pinned: false,
      trashed: false,
      tags: []
    };
    setNotes([newNote, ...notes]);
    setCurrentNoteId(newNote.id);
    // Ensure we are in notes view when adding a note
    if (currentView === 'trash') {
      setCurrentView('notes');
    }
  };

  const handlePinNote = (id: string) => {
    setNotes(notes.map(note => note.id === id ? { ...note, pinned: !note.pinned } : note));
  };

  const handleUpdateNote = (id: string, title: string, content: string) => {
    setNotes(notes.map(note => note.id === id ? { ...note, title, content } : note));
  };

  const handleMoveToTrash = (id: string) => {
    setNotes(notes.map(note => note.id === id ? { ...note, trashed: true } : note));
  };

  const handleRestoreFromTrash = (id: string) => {
    setNotes(notes.map(note => note.id === id ? { ...note, trashed: false } : note));
  };

  const handleDeleteForever = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
    if (currentNoteId === id) {
      setCurrentNoteId('');
    }
  };

  // Filter notes based on current view
  const visibleNotes = notes.filter(note => {
    if (currentView === 'trash') {
      return note.trashed;
    }
    return !note.trashed;
  });

  const currentNote = notes.find(n => n.id === currentNoteId) || (visibleNotes.length > 0 ? visibleNotes[0] : undefined);

  // Update currentNoteId if it's invalid or empty but we have notes
  React.useEffect(() => {
    if (!currentNoteId && visibleNotes.length > 0) {
      setCurrentNoteId(visibleNotes[0].id);
    }
  }, [currentNoteId, visibleNotes]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {isSidebarOpen && (
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          className="hidden md:flex"
          tags={allTags}
          onDeleteTag={() => { }}
          notes={visibleNotes}
          currentNoteId={currentNoteId}
          onSelectNote={setCurrentNoteId}
          onAddNote={handleAddNote}
          onPinNote={handlePinNote}
          isTrash={currentView === 'trash'}
        />
      )}
      <main className="flex-1 overflow-hidden">
        {currentView === "notes" && currentNote && !currentNote.trashed && (
          <Editor
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            tags={currentNote.tags || []}
            onAddTag={handleAddTag}
            onDeleteTag={handleRemoveTagFromNote}
            note={currentNote}
            onUpdateNote={(title, content) => handleUpdateNote(currentNote.id, title, content)}
            onMoveToTrash={() => handleMoveToTrash(currentNote.id)}
            isTrash={false}
          />
        )}
        {currentView === "trash" && currentNote && currentNote.trashed && (
          <Editor
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            tags={currentNote.tags || []}
            onAddTag={handleAddTag}
            onDeleteTag={handleRemoveTagFromNote}
            note={currentNote}
            onUpdateNote={(title, content) => handleUpdateNote(currentNote.id, title, content)}
            onRestoreNote={() => handleRestoreFromTrash(currentNote.id)}
            onDeleteForever={() => handleDeleteForever(currentNote.id)}
            isTrash={true}
          />
        )}
        {currentView === "ai" && <AIChat />}
      </main>
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
}
