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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";

interface Note {
    id: string;
    title: string;
    content: string;
    date: string;
    pinned: boolean;
    tag_id?: string;
    trashed?: boolean;
}

interface Tag {
    id: string;
    name: string;
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onNavigate: (view: "notes" | "ai" | "trash" | "settings") => void;
    currentView: string;
    tags: Tag[];
    onDeleteTag: (tagId: string) => void;
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
    const [tagToDelete, setTagToDelete] = React.useState<Tag | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");
    const { user } = useAuth();

    const [activeFilter, setActiveFilter] = React.useState<{ type: 'all' | 'untagged' | 'tag'; value?: string }>({ type: 'all' });

    const handleSetFilter = (type: 'all' | 'untagged' | 'tag', value?: string) => {
        setActiveFilter({ type, value });
        setSearchQuery("");
        setIsMenuOpen(false);
        if (currentView !== 'notes') {
            onNavigate('notes');
        }
    };
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

    // Check for "tag:" search syntax
    const isTagSearch = lowerQuery.startsWith("tag:");
    const tagSearchQuery = isTagSearch ? lowerQuery.slice(4).trim() : "";

    // 1. Matched Tags Logic
    let matchedTags: Tag[] = [];
    let showUntaggedResult = false;

    if (hasSearch) {
        if (isTagSearch) {
            // "tag:" or "tag: something"
            if (!tagSearchQuery) {
                // "tag:" -> show all matchable tags? Or just prompt? 
                // User request: "If the user enters tag: without specifying a tag name, all available tags will be displayed"
                matchedTags = tags;
                showUntaggedResult = true; // "tag: untagged" should appear?
            } else {
                // "tag: something" -> filter tags
                matchedTags = tags.filter(t => t.name.toLowerCase().includes(tagSearchQuery));
                if ("untagged".includes(tagSearchQuery)) {
                    showUntaggedResult = true;
                }
            }
        } else {
            // Normal search -> also show relevant tags in "Tags" section if they match query
            matchedTags = tags.filter(t => t.name.toLowerCase().includes(lowerQuery));
            // Also check if they might be searching for "untagged" literally
            if ("untagged".includes(lowerQuery)) {
                // Actually user request: "Tags will display tag-related results (such as tag: untagged notes and tag: tag name)"
                // So if normal search matches "untagged", show it?
                // Let's be permissive.
                showUntaggedResult = true;
            }
        }
    }


    // 2. Filter Notes Logic
    const filteredNotes = notes.filter(note => {
        if (note.trashed && !isTrash) return false;

        // 1. Filter by Active View (Untagged/Tag/All)
        if (activeFilter.type === 'untagged') {
            if (note.tag_id) return false;
        } else if (activeFilter.type === 'tag') {
            if (note.tag_id !== activeFilter.value) return false;
        }

        // 2. Filter by Search Query
        if (hasSearch) {
            const noteTag = tags.find(t => t.id === note.tag_id);
            const noteTagName = noteTag?.name || "";

            if (isTagSearch) {
                // Strict "tag:" search
                if (!tagSearchQuery) return true; // Show all if just "tag:" typed? Or maybe none? 
                // "When a valid tag name is entered, all notes associated with that tag will be displayed"
                // Implies: if "tag: work", show notes with tag "work".

                // Special case: "tag: untagged" -> show untagged notes? 
                // User said: "Upon clicking tag: untagged, the user will be redirected to the Untagged Notes section"
                // It implies the *search result item* redirects. 
                // Does the note list *also* filter by it live? Probably.
                if (tagSearchQuery === "untagged") {
                    return !note.tag_id;
                }

                return noteTagName.toLowerCase().includes(tagSearchQuery);
            } else {
                // Normal search: Title, Content, or Tag Name
                const titleMatch = (note.title || "").toLowerCase().includes(lowerQuery); // Fix: title could be empty/undefined safe check
                const contentMatch = (note.content || "").toLowerCase().includes(lowerQuery);
                const tagMatch = noteTagName.toLowerCase().includes(lowerQuery);
                return titleMatch || contentMatch || tagMatch;
            }
        }

        return true;
    });


    // Sort notes
    const notesDisplay = (hasSearch || activeFilter.type !== 'all') ? filteredNotes : notes;

    const sortedNotes = [...notesDisplay].sort((a, b) => {
        if (a.pinned === b.pinned) return 0;
        return a.pinned ? -1 : 1;
    });

    // Helper to strip HTML tags for preview
    const stripHtml = (html: string) => {
        if (!html) return "";
        return html.replace(/<[^>]*>?/gm, '');
    };

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
                    {activeFilter.type === 'untagged' ? (
                        <span className="text-sm font-medium">Untagged Notes</span>
                    ) : activeFilter.type === 'tag' ? (
                        <span className="text-sm font-medium">Tag: {tags.find(t => t.id === activeFilter.value)?.name || "Unknown"}</span>
                    ) : (
                        <>
                            <Avatar className="h-8 w-8">
                                <AvatarImage src="/placeholder-user.jpg" />
                                <AvatarFallback>{initials || "UN"}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{displayName}'s Notepad</span>
                        </>
                    )}
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
                                handleSetFilter('all');
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

                        <Button
                            variant={activeFilter.type === 'untagged' ? "secondary" : "ghost"}
                            className="w-full justify-start text-muted-foreground hover:text-foreground"
                            onClick={() => handleSetFilter('untagged')}
                        >
                            <div className="mr-2 flex h-4 w-4 items-center justify-center">
                                <Tag className="h-3 w-3 opacity-50" />
                            </div>
                            Untagged Notes
                        </Button>

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
                                <Button
                                    key={tag.id}
                                    variant={activeFilter.type === 'tag' && activeFilter.value === tag.id ? "secondary" : "ghost"}
                                    className="w-full justify-between"
                                    onClick={() => handleSetFilter('tag', tag.id)}
                                >
                                    <span className="truncate">{tag.name}</span>
                                    {isEditingTags && (
                                        <div
                                            className="ml-2 h-4 w-4 rounded-sm hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTagToDelete(tag);
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </div>
                                    )}
                                </Button>
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
                        placeholder="Search all notes and tags"
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Note List */}
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
                            {(matchedTags.length > 0 || showUntaggedResult) && (
                                <div className="mb-4">
                                    <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase">
                                        Tags
                                    </div>
                                    {matchedTags.map(tag => (
                                        <div
                                            key={tag.id}
                                            className="flex items-center px-2 py-1.5 text-sm text-sidebar-foreground cursor-pointer hover:bg-sidebar-accent/50 rounded-md"
                                            onClick={() => {
                                                // If parsing "tag: name", clicking it sets filter or auto-completes?
                                                // "tag: untagged will appear as a search result. Upon clicking tag: untagged, the user will be redirected to the Untagged Notes section"
                                                // Let's behave similarly for real tags: redirect to filter.
                                                handleSetFilter('tag', tag.id);
                                            }}
                                        >
                                            <Tag className="mr-2 h-4 w-4" />
                                            tag: {tag.name}
                                        </div>
                                    ))}
                                    {showUntaggedResult && (
                                        <div
                                            className="flex items-center px-2 py-1.5 text-sm text-sidebar-foreground cursor-pointer hover:bg-sidebar-accent/50 rounded-md"
                                            onClick={() => {
                                                handleSetFilter('untagged');
                                            }}
                                        >
                                            <Tag className="mr-2 h-4 w-4" />
                                            tag: untagged
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Note Results Section */}
                            <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase">
                                Notes
                            </div>
                            {sortedNotes.length > 0 ? (
                                sortedNotes.map((note) => (
                                    <div
                                        key={note.id}
                                        className={cn(
                                            "group flex flex-col gap-1 rounded-lg p-3 transition-colors hover:bg-sidebar-accent/50 cursor-pointer",
                                            currentNoteId === note.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"
                                        )}
                                        onClick={() => onSelectNote(note.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium line-clamp-1">{note.title || "Untitled"}</span>
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
                                            {stripHtml(note.content) || "No content"}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="px-2 text-sm text-muted-foreground">No matching notes found.</div>
                            )}
                        </div>
                    ) : (
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
                                        {stripHtml(note.content) || "No content"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )
                    // End hasSearch check

                )}
            </ScrollArea >

            <Dialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Tag</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove "{tagToDelete?.name}"?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTagToDelete(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (tagToDelete) {
                                    onDeleteTag(tagToDelete.id);
                                    if (activeFilter.type === 'tag' && activeFilter.value === tagToDelete.id) {
                                        handleSetFilter('all');
                                    }
                                    setTagToDelete(null);
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
