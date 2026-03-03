"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Notebook, Plus, Save, Trash2, ChevronDown, Loader2, FileText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { EditorWrapper } from "./editor-wrapper";
import { type Note } from "@/lib/supabase/notes";
import { createNoteClient, updateNoteClient, softDeleteNoteClient, restoreNoteClient, permanentlyDeleteNoteClient } from "@/lib/supabase/notes-client-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract plain text preview from a BlockNote JSON string. */
function extractTextFromBlockNote(content: string | null | undefined): string {
    if (!content) return ""
    try {
        const blocks = JSON.parse(content)
        if (!Array.isArray(blocks)) return ""
        return blocks
            .flatMap((block: any) => block?.content ?? [])
            .filter((inline: any) => inline?.type === "text")
            .map((inline: any) => inline.text as string)
            .join(" ")
            .trim()
    } catch {
        return content
    }
}


function formatNoteDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffH < 24) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffD === 1) return "Yesterday";
    if (diffD < 7) return date.toLocaleDateString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ─── Types ────────────────────────────────────────────────────────────────────

// A "draft" note is a new unsaved note that only lives on the client
type DraftNote = {
    id: "__draft__";
    title: string;
    content: string;
    updated_at: string;
    deleted_at: null;
};

type ActiveNote = Note | DraftNote;

function isDraft(note: ActiveNote): note is DraftNote {
    return note.id === "__draft__";
}

// ─── Component ───────────────────────────────────────────────────────────────

interface NotesClientProps {
    initialNotes: Note[];
    initialDeletedNotes: Note[];
}

export function NotesClient({ initialNotes, initialDeletedNotes }: NotesClientProps) {
    const router = useRouter();

    const [notes, setNotes] = useState<Note[]>(initialNotes);
    const [deletedNotes, setDeletedNotes] = useState<Note[]>(initialDeletedNotes);

    const [activeNote, setActiveNote] = useState<ActiveNote | null>(
        initialNotes.length > 0 ? initialNotes[0] : null
    );

    // Local editor state (title + content) — kept in sync as user types
    const [editorTitle, setEditorTitle] = useState<string>(
        initialNotes.length > 0 ? initialNotes[0].title : ""
    );
    const [editorContent, setEditorContent] = useState<string>(
        initialNotes.length > 0 ? (initialNotes[0].content ?? "") : ""
    );

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [hardDeleting, setHardDeleting] = useState(false);
    const [isPending, startTransition] = useTransition();

    const isDeletedNote = activeNote && !isDraft(activeNote) && activeNote.deleted_at !== null;

    // ── Select a saved note ──────────────────────────────────────────────────
    const handleSelectNote = (note: Note) => {
        setActiveNote(note);
        setEditorTitle(note.title);
        setEditorContent(note.content ?? "");
    };

    // ── Create a new draft ───────────────────────────────────────────────────
    const handleNewNote = () => {
        const draft: DraftNote = {
            id: "__draft__",
            title: "Untitled",
            content: "",
            updated_at: new Date().toISOString(),
            deleted_at: null,
        };
        setActiveNote(draft);
        setEditorTitle("Untitled");
        setEditorContent("");
    };

    // ── Save (create or update) ──────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        if (!activeNote) return;
        setSaving(true);
        try {
            if (isDraft(activeNote)) {
                // CREATE
                const created = await createNoteClient(editorTitle.trim() || "Untitled", editorContent);
                setNotes((prev) => [created, ...prev]);
                setActiveNote(created);
                toast.success("Note created");
            } else {
                // UPDATE
                const updated = await updateNoteClient(activeNote.id, {
                    title: editorTitle.trim() || "Untitled",
                    content: editorContent,
                });
                setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
                setActiveNote(updated);
                toast.success("Note saved");
            }
            // Revalidate Server Component data in background
            startTransition(() => router.refresh());
        } catch (err) {
            console.error(err);
            toast.error("Failed to save note");
        } finally {
            setSaving(false);
        }
    }, [activeNote, editorTitle, editorContent, router]);

    // ── Soft delete ──────────────────────────────────────────────────────────
    const handleDelete = useCallback(async () => {
        if (!activeNote || isDraft(activeNote)) {
            // Just discard draft
            setActiveNote(notes[0] ?? null);
            if (notes[0]) {
                setEditorTitle(notes[0].title);
                setEditorContent(notes[0].content ?? "");
            }
            return;
        }
        toast("Delete this note?", {
            action: {
                label: "Delete",
                onClick: async () => {
                    setDeleting(true);
                    try {
                        await softDeleteNoteClient(activeNote.id);
                        const remaining = notes.filter((n) => n.id !== activeNote.id);
                        setNotes(remaining);
                        const next = remaining[0] ?? null;
                        setActiveNote(next);
                        setEditorTitle(next?.title ?? "");
                        setEditorContent(next?.content ?? "");
                        toast.success("Note moved to trash");
                        startTransition(() => router.refresh());
                    } catch (err) {
                        console.error(err);
                        toast.error("Failed to delete note");
                    } finally {
                        setDeleting(false);
                    }
                },
            },
            actionButtonStyle: { backgroundColor: "#F85149", color: "#fff", fontWeight: "600" },
        });
    }, [activeNote, notes, router]);

    // ── Restore ──────────────────────────────────────────────────────────────
    const handleRestore = useCallback(async () => {
        if (!activeNote || isDraft(activeNote) || !activeNote.deleted_at) return;
        setRestoring(true);
        try {
            await restoreNoteClient(activeNote.id);
            // Move from deletedNotes to notes in local state
            const restored = { ...activeNote, deleted_at: null };
            setNotes(prev => [restored, ...prev]);
            setDeletedNotes(prev => prev.filter(n => n.id !== activeNote.id));
            setActiveNote(restored);
            toast.success("Note restored");
            startTransition(() => router.refresh());
        } catch (err) {
            console.error(err);
            toast.error("Failed to restore note");
        } finally {
            setRestoring(false);
        }
    }, [activeNote, router]);

    // ── Hard Delete ──────────────────────────────────────────────────────────
    const handleHardDelete = useCallback(async () => {
        if (!activeNote || isDraft(activeNote) || !activeNote.deleted_at) return;
        toast("Delete permanently?", {
            description: "This note cannot be recovered.",
            action: {
                label: "Delete Forever",
                onClick: async () => {
                    setHardDeleting(true);
                    try {
                        await permanentlyDeleteNoteClient(activeNote.id);
                        const remaining = deletedNotes.filter(n => n.id !== activeNote.id);
                        setDeletedNotes(remaining);
                        // Pick next available note to show (active or deleted)
                        const next = remaining[0] ?? notes[0] ?? null;
                        setActiveNote(next);
                        setEditorTitle(next?.title ?? "");
                        setEditorContent(next?.content ?? "");
                        toast.success("Note permanently deleted");
                        startTransition(() => router.refresh());
                    } catch (err) {
                        console.error(err);
                        toast.error("Failed to delete note permanently");
                    } finally {
                        setHardDeleting(false);
                    }
                },
            },
            actionButtonStyle: { backgroundColor: "#F85149", color: "#fff", fontWeight: "600" },
        });
    }, [activeNote, notes, deletedNotes, router]);


    // ── Empty state ──────────────────────────────────────────────────────────
    const showEmptyState = !activeNote;

    return (
        <div className="flex h-[calc(100vh-theme(spacing.24))] flex-col max-w-full overflow-hidden w-full gap-4 animate-in fade-in zoom-in-95 duration-500">
            {/* ── Page Header ── */}
            <div className="flex justify-between items-center shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Notebook className="size-7" />
                        <h1 className="font-bold text-3xl">Notes</h1>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        A dedicated space to capture your thoughts.
                    </p>
                </div>
            </div>

            {/* ── Main Panel ── */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-card rounded-md shadow-sm border">
                <div className="grid grid-cols-[20%_80%] flex-1 overflow-hidden min-h-0">

                    {/* ── Left sidebar (note list) ── */}
                    <div className="p-4 border-r overflow-y-auto min-h-0 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-lg shrink-0">Notes</span>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleNewNote}
                                title="New note"
                            >
                                <Plus />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto flex flex-col gap-4">
                            {/* All Notes */}
                            <Collapsible defaultOpen>
                                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-sm font-semibold hover:bg-sidebar-accent transition-colors [&[data-state=open]>svg]:rotate-180">
                                    All Notes
                                    <ChevronDown className="size-4 shrink-0 transition-transform duration-200" />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-1 flex flex-col gap-2 px-1">
                                    {/* Draft pill */}
                                    {activeNote && isDraft(activeNote) && (
                                        <div className="p-2 bg-sidebar-accent cursor-pointer transition-colors text-left flex flex-col border-b last:border-0 ring-1 ring-primary/30 rounded-sm">
                                            <div className="flex justify-between gap-2">
                                                <span className="font-medium text-sm truncate italic text-muted-foreground">
                                                    {editorTitle || "Untitled"}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground mt-1 shrink-0">New</span>
                                            </div>
                                        </div>
                                    )}
                                    {notes.length === 0 && !(activeNote && isDraft(activeNote)) ? (
                                        <div className="p-4 text-center text-sm text-muted-foreground italic">
                                            No Notes
                                        </div>
                                    ) : notes.map((note) => (
                                        <div
                                            key={note.id}
                                            onClick={() => handleSelectNote(note)}
                                            className={cn(
                                                "p-2 hover:bg-sidebar-accent cursor-pointer transition-colors text-left flex flex-col border-b last:border-0 rounded-sm",
                                                activeNote && !isDraft(activeNote) && activeNote.id === note.id && "bg-sidebar-accent"
                                            )}
                                        >
                                            <div className="flex justify-between gap-2">
                                                <span className="font-medium text-sm truncate">{note.title}</span>
                                                <span className="text-[10px] text-muted-foreground mt-1 shrink-0">{formatNoteDate(note.updated_at)}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground truncate">{extractTextFromBlockNote(note.content)}</span>
                                        </div>
                                    ))}
                                </CollapsibleContent>
                            </Collapsible>

                            {/* Recently Deleted */}
                            <Collapsible>
                                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-sm font-semibold hover:bg-sidebar-accent transition-colors [&[data-state=open]>svg]:rotate-180">
                                    Recently Deleted
                                    <ChevronDown className="size-4 shrink-0 transition-transform duration-200" />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-1 flex flex-col gap-2 px-1">
                                    {deletedNotes.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-muted-foreground italic">
                                            No Items
                                        </div>
                                    ) : deletedNotes.map((note) => (
                                        <div
                                            key={note.id}
                                            onClick={() => handleSelectNote(note)}
                                            className={cn(
                                                "p-2 hover:bg-sidebar-accent cursor-pointer transition-colors text-left flex flex-col border-b last:border-0 opacity-60 rounded-sm",
                                                activeNote && !isDraft(activeNote) && activeNote.id === note.id && "bg-sidebar-accent opacity-100"
                                            )}
                                        >
                                            <div className="flex justify-between gap-2">
                                                <span className="font-medium text-sm truncate line-through">{note.title}</span>
                                                <span className="text-[10px] text-muted-foreground mt-1 shrink-0">{formatNoteDate(note.deleted_at!)}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground truncate">{extractTextFromBlockNote(note.content)}</span>
                                        </div>
                                    ))}
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    </div>

                    {/* ── Right: Editor ── */}
                    <div className="flex flex-col p-4 min-h-0">
                        {showEmptyState ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                <FileText className="size-12 opacity-20" />
                                <p className="text-sm font-medium">No note selected</p>
                                <Button size="sm" variant="outline" onClick={handleNewNote}>
                                    <Plus className="size-4" /> New Note
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* ── Title bar ── */}
                                <div className="flex justify-between items-center shrink-0">
                                    <Input
                                        value={editorTitle}
                                        onChange={(e) => setEditorTitle(e.target.value)}
                                        readOnly={isDeletedNote as boolean}
                                        placeholder="Note title..."
                                        className={cn(
                                            "font-semibold text-lg shrink-0 border-transparent focus-visible:border-transparent focus-visible:ring-0 shadow-none px-2 h-auto py-1 w-full max-w-[400px]",
                                            isDeletedNote && "text-muted-foreground italic pointer-events-none"
                                        )}
                                    />
                                    <div className="flex gap-2">
                                        {!isDeletedNote ? (
                                            <>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                    title="Save note"
                                                >
                                                    {saving
                                                        ? <Loader2 className="size-4 animate-spin" />
                                                        : <Save className="size-4" />
                                                    }
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    onClick={handleDelete}
                                                    disabled={deleting}
                                                    title="Delete note"
                                                >
                                                    {deleting
                                                        ? <Loader2 className="size-4 animate-spin" />
                                                        : <Trash2 className="size-4" />
                                                    }
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={handleRestore}
                                                    disabled={restoring}
                                                    title="Restore note"
                                                >
                                                    {restoring
                                                        ? <Loader2 className="size-4 animate-spin" />
                                                        : <RotateCcw className="size-4" />
                                                    }
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    onClick={handleHardDelete}
                                                    disabled={hardDeleting}
                                                    title="Delete permanently"
                                                >
                                                    {hardDeleting
                                                        ? <Loader2 className="size-4 animate-spin" />
                                                        : <Trash2 className="size-4" />
                                                    }
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* ── BlockNote Editor ── */}
                                <div className="overflow-y-auto min-h-0 ps-12 flex-1">
                                    <EditorWrapper
                                        key={activeNote.id}
                                        initialContent={
                                            activeNote.content && activeNote.content.startsWith("[")
                                                ? activeNote.content
                                                : undefined
                                        }
                                        onChange={setEditorContent}
                                        editable={!isDeletedNote}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>
            <div />
        </div>
    );
}
