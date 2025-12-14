"use client";

import * as React from "react";
import {
    Search,
    Menu,
    Plus,
    Pin,
    Tag,
    Settings,
    Trash,
    FileText,
    Bot,
    X,
    Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/auth-context";

interface Note {
    id: string;
    title: string;
    content: string;
    date: string;
    pinned: boolean;
    trashed?: boolean;
    tags?: string[];
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onNavigate: (view: "notes" | "ai" | "trash" | "settings") => void;
    currentView: string;
    tags: string[];
    onDeleteTag: (tag: string) => void;
    notes: Note[];
    currentNoteId: string;
    onSelectNote: (id: string) => void;
    onAddNote: () => void;
    onPinNote: (id: string) => void;
    isTrash?: boolean;
}

export function Sidebar({
    className,
    onNavigate,
    currentView,
    tags,
    onDeleteTag,
    notes,
    currentNoteId,
    onSelectNote,
    onAddNote,
    onPinNote,
    isTrash
}: SidebarProps) {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isEditingTags, setIsEditingTags] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const { user } = useAuth();

    // Get display name: metadata.full_name -> email -> "User"
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";

    // Get initials for avatar fallback
    const initials = displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // Filter Logic
    const hasSearch = searchQuery.trim().length > 0;
    const lowerQuery = searchQuery.toLowerCase();

    // 1. Filter Tags
    const matchedTags = tags.filter(tag => tag.toLowerCase().includes(lowerQuery));

    // Check for "untagged" notes
    const hasUntaggedNotes = notes.some(n => (!n.tags || n.tags.length === 0) && !n.trashed);
    const showUntagged = hasUntaggedNotes && "untagged".includes(lowerQuery);

    // Combine matched tags and potentially "untagged"
    const displayTags = [...matchedTags];
    if (showUntagged) {
        displayTags.push("untagged");
    }

    // 2. Filter Notes
    const filteredNotes = notes.filter(note => {
        if (note.trashed && !isTrash) return false;

        const titleMatch = note.title.toLowerCase().includes(lowerQuery);
        // Note tag match
        const tagMatch = (note.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery));
        // Untagged match
        const isUntagged = (!note.tags || note.tags.length === 0);
        const untaggedMatch = isUntagged && "untagged".includes(lowerQuery);

        return titleMatch || tagMatch || untaggedMatch;
    });

    // Sort notes
    const notesDisplay = hasSearch ? filteredNotes : notes;

    const sortedNotes = [...notesDisplay].sort((a, b) => {
        if (a.pinned === b.pinned) return 0;
        return a.pinned ? -1 : 1;
    });

    return (
        <div
            className={cn(
                "flex h-screen w-[300px] flex-col border-r bg-sidebar text-sidebar-foreground relative",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center gap-2 p-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback>{initials || "UN"}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{displayName}'s Notepad</span>
                </div>
                {!isTrash && (
                    <Button variant="ghost" size="icon" className="ml-auto" onClick={onAddNote}>
                        <Plus className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {/* Menu Overlay */}
            {isMenuOpen && (
                <div className="absolute left-2 top-[60px] z-50 w-[260px] rounded-md bg-sidebar p-2 shadow-lg border">
                    <div className="space-y-1">
                        <Button
                            variant={currentView === "notes" ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                                onNavigate("notes");
                                setIsMenuOpen(false);
                            }}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            All Notes
                        </Button>
                        <Button
                            variant={currentView === "trash" ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                                onNavigate("trash");
                                setIsMenuOpen(false);
                            }}
                        >
                            <Trash className="mr-2 h-4 w-4" />
                            Trash
                        </Button>
                        <Button
                            variant={currentView === "settings" ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                                onNavigate("settings");
                                setIsMenuOpen(false);
                            }}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </Button>
                        <Separator className="my-2" />
                        <div className="flex items-center justify-between px-2 py-1">
                            <div className="text-xs font-medium text-muted-foreground">
                                Tags
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={() => setIsEditingTags(!isEditingTags)}
                            >
                                <Edit2 className="h-3 w-3" />
                            </Button>
                        </div>

                        {/* Tag List in Menu */}
                        <div className="space-y-1">
                            {tags.map((tag) => (
                                <div key={tag} className="flex items-center justify-between px-2 py-1.5 hover:bg-sidebar-accent/50 rounded-md group">
                                    <div className="flex items-center">
                                        <Tag className="mr-2 h-4 w-4" />
                                        <span className="text-sm">{tag}</span>
                                    </div>
                                    {isEditingTags && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive hover:text-destructive"
                                            onClick={() => onDeleteTag(tag)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Separator className="my-2" />
                        <Button
                            variant={currentView === "ai" ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                                onNavigate("ai");
                                setIsMenuOpen(false);
                            }}
                        >
                            <Bot className="mr-2 h-4 w-4" />
                            Baldy (AI)
                        </Button>
                    </div>
                </div>
            )}

            <Separator />

            {/* Search */}
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search notes and tags"
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Note List / Search Results */}
            <ScrollArea className="flex-1">
                {currentView === "trash" && notes.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
                        Trash is empty.
                    </div>
                ) : (
                    hasSearch ? (
                        // SEARCH RESULTS VIEW
                        <div className="space-y-1 p-2">
                            {/* Search by Tag Section */}
                            {displayTags.length > 0 && (
                                <div className="mb-4">
                                    <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase">
                                        Search by Tag
                                    </div>
                                    {displayTags.map(tag => (
                                        <div
                                            key={tag}
                                            className="flex items-center px-2 py-1.5 text-sm text-sidebar-foreground cursor-pointer hover:bg-sidebar-accent/50 rounded-md"
                                            onClick={() => setSearchQuery(tag)}
                                        >
                                            tag: {tag}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Divider if both exist */}
                            {displayTags.length > 0 && sortedNotes.length > 0 && (
                                <Separator className="my-2" />
                            )}

                            {/* Notes Section */}
                            {sortedNotes.length > 0 && (
                                <div className="space-y-1">
                                    {displayTags.length > 0 && (
                                        <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase">
                                            Notes
                                        </div>
                                    )}
                                    {sortedNotes.map((note) => (
                                        <div
                                            key={note.id}
                                            className={cn(
                                                "group flex flex-col gap-1 rounded-lg p-3 transition-colors hover:bg-sidebar-accent/50 cursor-pointer",
                                                currentNoteId === note.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"
                                            )}
                                            onClick={() => onSelectNote(note.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium line-clamp-1">{note.title || "Title"}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        "h-6 w-6 hover:bg-transparent",
                                                        note.pinned ? "text-primary opacity-100" : "opacity-0 group-hover:opacity-50"
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onPinNote(note.id);
                                                    }}
                                                >
                                                    <Pin className={cn("h-3 w-3", note.pinned && "fill-current")} />
                                                </Button>
                                            </div>
                                            <span className="text-xs text-muted-foreground line-clamp-1">
                                                {note.content || "No content"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* No Results */}
                            {displayTags.length === 0 && sortedNotes.length === 0 && (
                                <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                                    No results
                                </div>
                            )}
                        </div>
                    ) : (
                        // DEFAULT VIEW (No Search)
                        <div className="space-y-1 p-2">
                            {sortedNotes.map((note) => (
                                <div
                                    key={note.id}
                                    className={cn(
                                        "group flex flex-col gap-1 rounded-lg p-3 transition-colors hover:bg-sidebar-accent/50 cursor-pointer",
                                        currentNoteId === note.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"
                                    )}
                                    onClick={() => onSelectNote(note.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium line-clamp-1">{note.title || "Title"}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-6 w-6 hover:bg-transparent",
                                                note.pinned ? "text-primary opacity-100" : "opacity-0 group-hover:opacity-50"
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPinNote(note.id);
                                            }}
                                        >
                                            <Pin className={cn("h-3 w-3", note.pinned && "fill-current")} />
                                        </Button>
                                    </div>
                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                        {note.content || "No content"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </ScrollArea>
        </div>
    );
}
