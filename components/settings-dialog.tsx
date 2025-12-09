"use client";

import * as React from "react";
import { X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <DialogTitle>Settings</DialogTitle>
                    0
                </DialogHeader>
                <div className="py-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase">
                            Account
                        </h3>
                        <div className="rounded-md bg-secondary/50 p-4 text-center text-sm font-medium">
                            EMAIL
                        </div>
                        <div className="flex justify-center pt-4">
                            <Button variant="ghost" className="flex flex-col gap-2 h-auto">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                                    <LogOut className="h-5 w-5" />
                                </div>
                                <span className="text-xs">LOG OUT</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
