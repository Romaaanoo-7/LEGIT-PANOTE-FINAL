"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Paperclip,
    Send,
    ImageIcon,
    MessageSquarePlus,
    X,
    SquarePen,
    Bot,
    Plus,
    FileText
} from "lucide-react";

interface Note {
    id: string;
    title: string;
}

interface AIChatProps {
    onAddToNote?: (text: string, noteId?: string) => void;
    notes?: Note[];
}

export function AIChat({ onAddToNote, notes }: AIChatProps) {
    const [input, setInput] = React.useState("");
    const [messages, setMessages] = React.useState<{ role: 'user' | 'assistant', content: string, attachments?: string[] }[]>([]);
    const [attachments, setAttachments] = React.useState<string[]>([]);
    const [isConverting, setIsConverting] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const imageToTextInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch('/api/chat');
                if (res.ok) {
                    const data = await res.json();
                    // Transform DB messages to UI messages
                    const uiMessages = data.map((m: any) => ({
                        role: m.role,
                        content: m.content,
                        attachments: m.attachments
                    }));
                    setMessages(uiMessages);
                }
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        };
        fetchMessages();
    }, []);

    const saveMessage = async (role: 'user' | 'assistant', content: string, attachments?: string[]) => {
        try {
            // Filter out blob URLs from being sent to DB as they are useless there
            // In a real app, upload to storage first, then save public URL.
            const validAttachments = attachments?.filter(a => !a.startsWith('blob:')) || [];

            await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, content, attachments: validAttachments })
            });
        } catch (e) {
            console.error("Failed to save message", e);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newAttachments = files.map(file => URL.createObjectURL(file));
            setAttachments(prev => [...prev, ...newAttachments]);
        }
    };

    const handleImageToTextSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsConverting(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                // Remove data URL prefix (e.g. "data:image/jpeg;base64,")
                const base64Content = base64String.split(",")[1];
                const previewUrl = URL.createObjectURL(file);

                // Add user message with the image immediately
                const userMsgContent = "Extract text from this image";
                setMessages(prev => [...prev, {
                    role: 'user',
                    content: userMsgContent,
                    attachments: [previewUrl]
                }]);

                // Persist User Message (Image not persisted in DB for now)
                saveMessage('user', userMsgContent);

                try {
                    const response = await fetch("/api/gemini/vision", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            image: base64Content,
                            mimeType: file.type,
                        }),
                    });

                    const data = await response.json();

                    if (data.text) {
                        // Add assistant response with extracted text
                        setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: data.text
                        }]);
                        // Persist Assistant Message
                        saveMessage('assistant', data.text);
                    } else if (data.error) {
                        console.error("API Error:", data.error);
                        alert(`Error: ${data.error}`);
                    }
                } catch (error) {
                    console.error("Fetch Error:", error);
                    alert("Failed to connect to the server.");
                } finally {
                    setIsConverting(false);
                    // Reset the input so the same file can be selected again if needed
                    if (imageToTextInputRef.current) {
                        imageToTextInputRef.current.value = "";
                    }
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Error reading file:", error);
            setIsConverting(false);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if (!input.trim() && attachments.length === 0) return;

        const currentInput = input;
        const currentAttachments = [...attachments];

        const newUserMessage = {
            role: 'user' as const,
            content: currentInput,
            attachments: currentAttachments
        };

        // Add user message
        setMessages(prev => [...prev, newUserMessage]);
        setInput("");
        setAttachments([]);

        // Persist User Message
        saveMessage('user', currentInput, currentAttachments);

        try {
            // Prepare messages context (simplify for API)
            const apiMessages = [...messages, newUserMessage].map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch('/api/gemini/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: apiMessages })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate response");
            }

            const data = await response.json();
            const aiContent = data.text;

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: aiContent
            }]);
            saveMessage('assistant', aiContent);

        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage = "Sorry, I'm having trouble connecting right now.";
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: errorMessage
            }]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto p-8">
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-100">
                        <h2 className="mb-8 text-xl font-medium">How can I help you today?</h2>
                        <div className="grid w-full max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                            <Button
                                variant="secondary"
                                className="h-auto flex-col items-start gap-2 p-4 text-left bg-white shadow-sm hover:bg-gray-100/80 transition-colors"
                                onClick={() => setInput("Add context ")}
                            >
                                <MessageSquarePlus className="h-6 w-6 text-primary" />
                                <div className="space-y-1">
                                    <span className="font-medium">Add context</span>
                                    <p className="text-xs text-muted-foreground font-normal">
                                        Ask anything!
                                    </p>
                                </div>
                            </Button>
                            <Button
                                variant="secondary"
                                className="h-auto flex-col items-start gap-2 p-4 text-left bg-white shadow-sm hover:bg-gray-100/80 transition-colors relative overflow-hidden"
                                onClick={() => imageToTextInputRef.current?.click()}
                                disabled={isConverting}
                            >
                                {isConverting && (
                                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    </div>
                                )}
                                <ImageIcon className="h-6 w-6 text-primary" />
                                <div className="space-y-1">
                                    <span className="font-medium">Image to Text</span>
                                    <p className="text-xs text-muted-foreground font-normal">
                                        Extract text from images
                                    </p>
                                </div>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto max-w-3xl space-y-6">
                        {messages.map((message, index) => (
                            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] space-y-2 ${message.role === 'user' ? 'items-end flex flex-col' : 'items-start flex flex-col'}`}>
                                    {message.role === 'assistant' && (
                                        <div className="flex items-center gap-2 mb-1 pl-1">
                                            <Bot className="h-4 w-4 text-primary" />
                                            <span className="text-sm font-medium text-muted-foreground">Baldy (AI)</span>
                                        </div>
                                    )}
                                    {message.attachments && message.attachments.length > 0 && (
                                        <div className="flex gap-2 flex-wrap justify-end">
                                            {message.attachments.map((src, i) => (
                                                <img key={i} src={src} alt="attachment" className="h-32 w-auto rounded-lg border object-cover" />
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2 items-start">
                                        <div className={`rounded-lg p-4 whitespace-pre-wrap ${message.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-foreground border'
                                            }`}>
                                            {message.content}
                                        </div>
                                        {message.role === 'assistant' && onAddToNote && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 mt-2" title="Add to Note">
                                                        <SquarePen className="h-4 w-4" />
                                                        <span className="sr-only">Add to Note</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => onAddToNote(message.content, 'new')}>
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Create New Note
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel>Add to existing...</DropdownMenuLabel>
                                                    <div className="max-h-48 overflow-y-auto">
                                                        {notes && notes.length > 0 ? (
                                                            notes.map(note => (
                                                                <DropdownMenuItem key={note.id} onClick={() => onAddToNote(message.content, note.id)}>
                                                                    <FileText className="mr-2 h-4 w-4" />
                                                                    <span className="truncate max-w-[150px]">{note.title || "Untitled Note"}</span>
                                                                </DropdownMenuItem>
                                                            ))
                                                        ) : (
                                                            <DropdownMenuItem disabled>No notes found</DropdownMenuItem>
                                                        )}
                                                    </div>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isConverting && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] rounded-lg p-4 bg-muted text-foreground border">
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        <span>Extracting text...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Chat Input Area */}
            <div className="border-t bg-background p-4">
                <div className="mx-auto max-w-3xl space-y-4">
                    {/* Attachments Preview - Only for new unsent attachments */}
                    {attachments.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {attachments.map((src, index) => (
                                <div key={index} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border group">
                                    <img
                                        src={src}
                                        alt="Attachment"
                                        className="h-full w-full object-cover"
                                    />
                                    <button
                                        onClick={() => removeAttachment(index)}
                                        className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2 items-end">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                        />
                        <input
                            type="file"
                            ref={imageToTextInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageToTextSelect}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="h-5 w-5" />
                            <span className="sr-only">Attach file</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={() => imageToTextInputRef.current?.click()}
                            disabled={isConverting}
                            title="Image to Text"
                        >
                            <ImageIcon className="h-5 w-5" />
                            <span className="sr-only">Image to Text</span>
                        </Button>

                        <div className="relative flex-1">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Message Baldy AI..."
                                className="min-h-[44px] max-h-32 resize-none py-3 pr-12"
                            />
                        </div>

                        <Button
                            onClick={handleSend}
                            size="icon"
                            disabled={!input.trim() && attachments.length === 0}
                            className="h-10 w-10 shrink-0"
                        >
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send message</span>
                        </Button>
                    </div>
                    <div className="text-center text-xs text-muted-foreground">
                        Baldy AI can make mistakes. Consider checking important information.
                    </div>
                </div>
            </div>
        </div>
    );
}
