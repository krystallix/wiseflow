"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const Editor = dynamic(() => import("./blocknote-editor").then((mod) => mod.Editor), {
    ssr: false,
    loading: () => (
        <div className="flex justify-center items-center h-full min-h-[300px]">
            <Loader2 className="animate-spin size-6 text-muted-foreground delay-150 duration-500 ease-in-out" />
        </div>
    )
});

interface EditorWrapperProps {
    initialContent?: string;
    onChange?: (content: string) => void;
    editable?: boolean;
    key?: string;
}

export function EditorWrapper({ initialContent, onChange, editable = true }: EditorWrapperProps) {
    return <Editor initialContent={initialContent} onChange={onChange} editable={editable} />;
}
