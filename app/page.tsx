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
}

export default function Home() {
  const [currentView, setCurrentView] = React.useState<"notes" | "ai" | "trash" | "settings">("notes");
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [tags, setTags] = React.useState<string[]>(["Tag"]);

  // Note State
  const [notes, setNotes] = React.useState<Note[]>([
    { id: '1', title: 'Title', content: 'This is your text.', date: new Date().toLocaleDateString(), pinned: false, trashed: false },
    { id: '2', title: 'Class Notes', content: 'ABCD.', date: new Date().toLocaleDateString(), pinned: false, trashed: false }
  ]);
  const [currentNoteId, setCurrentNoteId] = React.useState<string>('1');

  const handleNavigate = (view: "notes" | "ai" | "trash" | "settings") => {
    if (view === "settings") {
      setIsSettingsOpen(true);
    } else {
      setCurrentView(view);
    }
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter((tag) => tag !== tagToDelete));
  };

  // Note Handlers
  const handleAddNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Title',
      content: '',
      date: new Date().toLocaleDateString(),
      pinned: false,
      trashed: false
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
    // If the current note is trashed, switch to another note or clear selection if needed
    // For now, we'll just let the user stay on the editor or maybe switch view?
    // The requirement says "it will only show at the Trash page".
    // So if we are in "notes" view, it should disappear from sidebar.
  };

  const handleRestoreFromTrash = (id: string) => {
    setNotes(notes.map(note => note.id === id ? { ...note, trashed: false } : note));
  };

  const handleDeleteForever = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  // Filter notes based on current view
  const visibleNotes = notes.filter(note => {
    if (currentView === 'trash') {
      return note.trashed;
    }
    return !note.trashed;
  });

  const currentNote = notes.find(n => n.id === currentNoteId) || visibleNotes[0];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {isSidebarOpen && (
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          className="hidden md:flex"
          tags={tags}
          onDeleteTag={handleDeleteTag}
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
            tags={tags}
            onAddTag={handleAddTag}
            onDeleteTag={handleDeleteTag}
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
            tags={tags}
            onAddTag={handleAddTag}
            onDeleteTag={handleDeleteTag}
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
