'use client'

import { useState } from 'react'
import { Loader2Icon, Trash2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/animate-ui/components/radix/dialog'
import { Button } from '@/components/ui/button'
import { softDeleteProject } from '@/lib/supabase/projects'
import { useRouter, usePathname } from 'next/navigation'

type DialogDeleteProjectProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    project: {
        id: string
        name: string
        url: string
    } | null
    onSuccess?: () => void
}

export default function DialogDeleteProject({ open, onOpenChange, project, onSuccess }: DialogDeleteProjectProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    const handleDelete = async () => {
        if (!project || !project.id) return
        setLoading(true)

        try {
            await softDeleteProject(project.id)
            onOpenChange(false)
            onSuccess?.()
            window.dispatchEvent(new CustomEvent('project-updated'))

            if (pathname === project.url) {
                router.push('/dashboard')
            } else if (pathname === '/dashboard/trash') {
                router.refresh()
            }
        } catch (error) {
            console.error('Failed to delete project:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md"
                from="bottom"
                transition={{ type: 'spring', stiffness: 1000, damping: 50 }}
            >
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">Delete Project</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-2">
                        Are you sure you want to delete <strong className="text-foreground">{project?.name}</strong>?
                        <span> This action will move it to the trash.</span>
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={loading || !project}
                    >
                        {loading
                            ? <Loader2Icon className="size-3.5 animate-spin mr-2" />
                            : <Trash2 className="size-3.5 mr-2" />
                        }
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
