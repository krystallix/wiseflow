'use client'

import { useState } from 'react'
import { Loader2Icon, Save } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/animate-ui/components/radix/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconPicker, type IconName } from '@/components/ui/icon-picker'
import { createProject } from '@/lib/supabase/projects'

type DialogProjectProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function DialogProject({ open, onOpenChange }: DialogProjectProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [icon, setIcon] = useState<IconName>('File')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return
        setLoading(true)

        try {
            await createProject(name, icon, description)
            onOpenChange(false)
            setName('')
            setDescription('')
            setIcon('File')
        } catch (error) {
            console.error('Failed to create project:', error)
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
                    <DialogTitle className="text-base font-semibold">New Project</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Create a new project to organize your tasks and workflows.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <Label htmlFor="project-name" className="text-xs font-medium">
                            Project name
                        </Label>
                        <div className="flex items-center gap-2">
                            <IconPicker value={icon} onChange={setIcon} />
                            <Input
                                id="project-name"
                                placeholder="Enter project name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                autoComplete="off"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="desctiprion" className="text-xs font-medium">
                            Description
                        </Label>
                        <Input
                            id="desctiprion"
                            placeholder="Enter short description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            autoFocus
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    <DialogFooter className="pt-1">
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
                            type="submit"
                            size="sm"
                            disabled={!name.trim() || loading}
                        >
                            {loading
                                ? <Loader2Icon className="size-3.5 animate-spin" />
                                : <Save className="size-3.5" />
                            }
                            Create project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}