import { getNotes, getDeletedNotes } from "@/lib/supabase/notes";
import { NotesClient } from "./notes-client";

export default async function NotesPage() {
    const [notes, deletedNotes] = await Promise.all([
        getNotes(),
        getDeletedNotes(),
    ]);

    return (
        <NotesClient
            initialNotes={notes}
            initialDeletedNotes={deletedNotes}
        />
    );
}
