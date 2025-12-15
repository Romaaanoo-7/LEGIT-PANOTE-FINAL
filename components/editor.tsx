"use client";

import * as React from "react";
import {
    Lock,
    Paperclip,
    Info,
    MoreHorizontal,
    Tag as TagIcon,
    X,
    ListTodo,
    Bold,
    Italic,
    Underline as UnderlineIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

interface Tag {
    id: string;
    name: string;
}

interface Note {
    id: string;
    title: string;
    content: string;
    date: string;
    pinned: boolean;
    tag_id?: string;
}

interface EditorProps {
    isSidebarOpen?: boolean;
    onToggleSidebar?: () => void;
    tags: Tag[];
    onAddTag: (name: string) => void;
    onDeleteTag: (id: string) => void;
    note: Note;
    onUpdateNote: (title: string, content: string, tag_id?: string) => void;
    onMoveToTrash?: () => void;
    onRestoreNote?: () => void;
    onDeleteForever?: () => void;
    isTrash?: boolean;
}

export function Editor({
    isSidebarOpen = true,
    onToggleSidebar,
    tags,
    onAddTag,
    onDeleteTag,
    note,
    onUpdateNote,
    onMoveToTrash,
    onRestoreNote,
    onDeleteForever,
    isTrash
}: EditorProps) {
    const [newTag, setNewTag] = React.useState("");

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
        ],
        content: note.content,
        onUpdate: ({ editor }) => {
            onUpdateNote(note.title, editor.getHTML(), note.tag_id);
        },
        editorProps: {
            attributes: {
                class: 'min-h-[calc(100vh-300px)] border-none bg-transparent text-lg shadow-none focus-visible:outline-none px-0 prose prose-invert max-w-none',
            },
        },
        editable: !isTrash,
        immediatelyRender: false,
    });

    // Update editor content when note changes externally (e.g. switching notes)
    React.useEffect(() => {
        if (editor && note.content !== editor.getHTML()) {
            // Avoid loop if content is same (Tiptap getHTML might return different string for same content sometimes, but basic check helps)
            // Actually, simply setting content on every render is bad for cursor.
            // We should only set content if the note ID changed or if it's vastly different.
            // For this simple app, we can check if it's the same note ID/title logic or just trust that note.content is stable.
            // But if we seek to update content while typing, it will re-render.
            // A common pattern is to sync only when note.id changes.
        }
    }, [note.id, editor]);

    React.useEffect(() => {
        if (editor && note.id) {
            // When note ID changes, load the new content.
            // We use emitUpdate: false to prevent triggering the onUpdate callback immediately
            if (editor.getHTML() !== note.content) {
                editor.commands.setContent(note.content || "", { emitUpdate: false });
            }
        }
    }, [note.id, editor]);


    // Mock data for dates (using note date if available, or current date)
    const createdDate = note.date || new Date().toLocaleDateString();
    const modifiedDate = new Date().toLocaleDateString();

    const wordCount = editor?.storage.characterCount?.words?.() || 0; // Tiptap doesn't have character count by default in starter kit without extension, but we can approximate or add extension.
    // Actually starter kit doesn't include CharacterCount extension.
    // Let's us basic approximation from textContent.
    const textContent = editor?.getText() || "";
    const activeWordCount = textContent.trim().split(/\s+/).filter((w) => w.length > 0).length;
    const charCount = textContent.length;

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && newTag.trim()) {
            onAddTag(newTag.trim());
            setNewTag("");
        }
    };

    if (!editor) {
        return null;
    }

    return (
        <div className="flex h-full flex-col bg-background relative">
            {/* Top Bar - Fixed at the top */}
            <div className="flex flex-none items-center justify-between border-b p-2 bg-background z-10">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleSidebar}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        {!isSidebarOpen ? (
                            <Lock className="mr-2 h-4 w-4" />
                        ) : (
                            <Lock className="mr-2 h-4 w-4 opacity-50" />
                        )}

                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    {isTrash ? (
                        <>
                            <Button variant="ghost" size="sm" onClick={onRestoreNote}>
                                Restore Note
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDeleteForever}>
                                Delete Permanently
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                className={editor.isActive('bold') ? 'bg-secondary' : ''}
                            >
                                <Bold className="h-4 w-4" />
                                <span className="sr-only">Bold</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                className={editor.isActive('italic') ? 'bg-secondary' : ''}
                            >
                                <Italic className="h-4 w-4" />
                                <span className="sr-only">Italic</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleUnderline().run()}
                                className={editor.isActive('underline') ? 'bg-secondary' : ''}
                            >
                                <UnderlineIcon className="h-4 w-4" />
                                <span className="sr-only">Underline</span>
                            </Button>
                            <Separator orientation="vertical" className="mx-1 h-6" />
                            <Button variant="ghost" size="icon">
                                <ListTodo className="h-4 w-4" />
                                <span className="sr-only">Checklist</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                                <Paperclip className="h-4 w-4" />
                                <span className="sr-only">Add attachments</span>
                            </Button>

                            {/* Info Dialog */}
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Info className="h-4 w-4" />
                                        <span className="sr-only">Info</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                                    <DialogHeader>
                                        <DialogTitle>Information</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Modified</span>
                                            <span className="text-sm text-muted-foreground">{modifiedDate}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Created</span>
                                            <span className="text-sm text-muted-foreground">{createdDate}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Words</span>
                                            <span className="text-sm text-muted-foreground">{activeWordCount}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Characters</span>
                                            <span className="text-sm text-muted-foreground">{charCount}</span>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* Action Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Action</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 bg-card text-card-foreground border-border">
                                    <DropdownMenuItem>
                                        Save
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={onMoveToTrash}
                                    >
                                        Move to trash
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                </div>
            </div>

            {/* Editor Area - Scrollable */}
            <div className="flex-1 overflow-y-auto pb-20">
                <div className="mx-auto flex w-full max-w-3xl flex-col p-8">
                    <Input
                        className="mb-4 border-none bg-transparent text-4xl font-bold shadow-none focus-visible:ring-0 px-0 text-center"
                        placeholder="New Note"
                        value={note.title}
                        onChange={(e) => onUpdateNote(e.target.value, note.content, note.tag_id)}
                        disabled={isTrash}
                    />
                    <EditorContent editor={editor} />
                </div>
            </div>

            {/* Tags Section - Fixed at bottom left of the editor area */}
            <div className="absolute bottom-4 left-8 flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                    <div
                        key={tag.id}
                        className={cn(
                            "flex items-center gap-1 rounded-md px-2 py-1 text-sm bg-secondary/50 text-secondary-foreground group cursor-pointer transition-colors",
                            note.tag_id === tag.id && "bg-primary text-primary-foreground"
                        )}
                        onClick={() => !isTrash && onUpdateNote(note.title, note.content, note.tag_id === tag.id ? undefined : tag.id)}
                    >
                        <TagIcon className="h-3 w-3" />
                        <span>{tag.name}</span>
                        {!isTrash && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTag(tag.id);
                                }}
                                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                ))}
                {!isTrash && (
                    <div className="flex items-center gap-1">
                        <Input
                            className="h-auto w-[100px] border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
                            placeholder="Add tag.."
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={handleAddTag}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
