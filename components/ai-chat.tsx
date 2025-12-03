"use client";

import * as React from "react";
import { Image as ImageIcon, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AIChat() {
    return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <h2 className="mb-8 text-xl font-medium">How can I help you today?</h2>

            <div className="grid w-full max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                <Button
                    variant="secondary"
                    className="h-auto flex-col items-start gap-2 p-4 text-left"
                >
                    <MessageSquarePlus className="h-6 w-6" />
                    <div className="space-y-1">
                        <span className="font-medium">Add context</span>
                        <p className="text-xs text-muted-foreground font-normal">
                            Ask anything!
                        </p>
                    </div>
                </Button>

                <Button
                    variant="secondary"
                    className="h-auto flex-col items-start gap-2 p-4 text-left"
                >
                    <ImageIcon className="h-6 w-6" />
                    <div className="space-y-1">
                        <span className="font-medium">Image to Text</span>
                    </div>
                </Button>
            </div>
        </div>
    );
}
