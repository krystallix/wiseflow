"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useTheme } from "next-themes";

interface BlockNoteEditorProps {
    initialContent?: string;
    onChange?: (content: string) => void;
    editable?: boolean;
}

export function Editor({ initialContent, onChange, editable = true }: BlockNoteEditorProps) {    // Creates a new editor instance.
    const { resolvedTheme } = useTheme();

    const editor = useCreateBlockNote({
        initialContent: initialContent ? JSON.parse(initialContent) : undefined,
    });

    // Upload callback if needed can be configured in useCreateBlockNote

    return (
        <div className="-mx-14 mt-4 h-full">
            <BlockNoteView
                editor={editor}
                theme={resolvedTheme === "dark" ? "dark" : "light"}
                editable={editable}
                onChange={() => {
                    if (onChange) {
                        onChange(JSON.stringify(editor.document));
                    }
                }}
                data-theming-css-variables
                className="min-h-[500px]"
            />
        </div>
    );
}
