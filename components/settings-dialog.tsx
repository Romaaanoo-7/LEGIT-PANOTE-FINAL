"use client";

import * as React from "react";
import { X, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { deleteAccount } from "@/app/auth/actions";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { useRouter } from "next/navigation";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [isDeleteConfirming, setIsDeleteConfirming] = React.useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = React.useState("");

    const [isLoading, setIsLoading] = React.useState(false);

    // Reset state when dialog closes
    React.useEffect(() => {
        if (!open) {
            setIsDeleteConfirming(false);
            setDeleteConfirmation("");
            setIsLoading(false);
        }
    }, [open]);

    const handleDelete = async () => {
        if (deleteConfirmation === "Delete") {
            setIsLoading(true);
            try {
                const res = await deleteAccount();
                if (res?.error) {
                    alert(res.error);
                } else if (res?.success) {
                    router.push('/login');
                }
            } catch (error) {
                console.error(error);
                alert("An unexpected error occurred.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div className="py-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase">
                            Account
                        </h3>
                        <div className="rounded-md bg-secondary/50 p-4 text-center text-sm font-medium">
                            {user?.email || "Not signed in"}
                        </div>
                        <div className="flex justify-center pt-4">
                            <Button
                                variant="ghost"
                                className="flex flex-col gap-2 h-auto"
                                onClick={() => signOut()}
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                                    <LogOut className="h-5 w-5" />
                                </div>
                                <span className="text-xs">LOG OUT</span>
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t mt-4">
                        <h3 className="text-sm font-medium text-destructive uppercase">
                            Danger Zone
                        </h3>
                        {isDeleteConfirming ? (
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Type <strong>Delete</strong> below to confirm. This action is irreversible.
                                </p>
                                <Input
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    placeholder='Type "Delete" to confirm'
                                    className="border-destructive/50 focus-visible:ring-destructive"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setIsDeleteConfirming(false);
                                            setDeleteConfirmation("");
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        disabled={deleteConfirmation !== "Delete" || isLoading}
                                        onClick={handleDelete}
                                    >
                                        {isLoading ? "Deleting..." : "Confirm Delete"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => setIsDeleteConfirming(true)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Account
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
