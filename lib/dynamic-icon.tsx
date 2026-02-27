import * as React from 'react'
import * as LucideIcons from 'lucide-react'
import { File } from 'lucide-react'

export function DynamicIcon({ name, className }: { name?: string | null; className?: string }) {
    if (!name) return <File className={className} />
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name]
    return Icon ? <Icon className={className} /> : <File className={className} />
}
