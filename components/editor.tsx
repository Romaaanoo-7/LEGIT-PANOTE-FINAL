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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Mock data for dates (using note date if available, or current date)
    const createdDate = note.date || new Date().toLocaleDateString();
    const modifiedDate = new Date().toLocaleDateString();

    const wordCount = (note.content || "").trim().split(/\s+/).filter((w) => w.length > 0).length;
    const charCount = (note.content || "").length;

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && newTag.trim()) {
            onAddTag(newTag.trim());
            setNewTag("");
        }
    };

    const handleChecklist = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const value = textarea.value;

        // Find start of current line
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = value.indexOf('\n', start);
        const currentLine = value.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);

        let newValue;
        let newCursorPos;

        if (currentLine.startsWith('- [ ] ') || currentLine.startsWith('- [x] ')) {
            // Remove checklist
            newValue = value.slice(0, lineStart) + currentLine.substring(6) + value.slice(lineEnd === -1 ? value.length : lineEnd);
            newCursorPos = start - 6;
        } else {
            // Add checklist
            newValue = value.slice(0, lineStart) + "- [ ] " + currentLine + value.slice(lineEnd === -1 ? value.length : lineEnd);
            newCursorPos = start + 6;
        }

        onUpdateNote(note.title, newValue, note.tag_id);

        // Restore cursor position after render
        requestAnimationFrame(() => {
            if (textareaRef.current) {
                textareaRef.current.selectionStart = newCursorPos;
                textareaRef.current.selectionEnd = newCursorPos;
                textareaRef.current.focus();
            }
        });
    };

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
                            <Button variant="ghost" size="icon" onClick={handleChecklist}>
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
                                            <span className="text-sm text-muted-foreground">{wordCount}</span>
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
                        className="mb-4 border-none bg-transparent text-4xl font-bold shadow-none focus-visible:ring-0 px-0"
                        placeholder="Title"
                        value={note.title}
                        onChange={(e) => onUpdateNote(e.target.value, note.content, note.tag_id)}
                        disabled={isTrash}
                    />
                    <Textarea
                        ref={textareaRef}
                        className="min-h-[calc(100vh-300px)] resize-none border-none bg-transparent text-lg shadow-none focus-visible:ring-0 px-0"
                        placeholder="This is your text."
                        value={note.content}
                        onChange={(e) => onUpdateNote(note.title, e.target.value, note.tag_id)}
                        disabled={isTrash}
                    />
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
