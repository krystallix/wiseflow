"use client"

import { useState, useEffect } from "react"

import { useChat } from "@ai-sdk/react"
import {
    Sparkles, Send, Plus, MessageSquare,
    Search, MoreHorizontal, Paperclip, Mic, Settings2,
    RefreshCcw, Volume2, Copy, ThumbsDown, ArrowRight, Play, ArrowUpRight,
    Trash2
} from "lucide-react"
import { DefaultChatTransport } from "ai"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getSupabase } from "@/lib/supabase/client"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AskAIPage() {
    const supabase = getSupabase()
    const [sessions, setSessions] = useState<any[]>([])
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
    const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)
    const [input, setInput] = useState("")

    const { messages, setMessages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
        }),
    })

    useEffect(() => {
        loadSessions()
    }, [])

    const loadSessions = async () => {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData?.user) return

        const { data } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', userData.user.id)
            .order('updated_at', { ascending: false })

        if (data) setSessions(data)
    }

    const selectChat = async (id: string) => {
        setActiveSessionId(id)
        const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', id)
            .order('sort_order', { ascending: true })

        if (data) {
            setMessages(data.map(m => ({
                id: m.id,
                role: m.role as any,
                content: m.content,
                parts: [{ type: 'text', text: m.content }]
            })))
        }
    }

    const startNewChat = () => {
        setActiveSessionId(null);
        setMessages([]);
    }

    const deleteChat = async (id: string) => {
        const { error } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('id', id)

        if (!error) {
            if (activeSessionId === id) {
                startNewChat()
            }
            loadSessions()
        }
        setDeleteSessionId(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        let currentSessionId = activeSessionId
        let newTitle = input.substring(0, 50) + (input.length > 50 ? '...' : '')

        if (!currentSessionId) {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData?.user) return

            const { data, error } = await supabase
                .from('chat_sessions')
                .insert({ title: newTitle, user_id: userData.user.id })
                .select('id')
                .single()

            if (data) {
                currentSessionId = data.id
                setActiveSessionId(currentSessionId)
                loadSessions() // Refresh sidebar right after creation
            }
        }

        const msgInput = input
        setInput("")
        sendMessage(
            { role: "user", parts: [{ type: 'text', text: msgInput }] } as any,
            { body: { sessionId: currentSessionId } }
        )
    }

    const renderSessionGroup = (title: string, groupSessions: any[]) => {
        if (groupSessions.length === 0) return null;
        return (
            <>
                <div className="px-2 py-1.5 mt-2 border-t border-border/20 pt-2 first:border-0 first:pt-0">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
                </div>
                {groupSessions.map((chat) => (
                    <div
                        key={chat.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => selectChat(chat.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectChat(chat.id) }}
                        className={cn(
                            "w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all flex items-center gap-2.5 group relative overflow-hidden cursor-pointer outline-none focus-visible:bg-sidebar-accent",
                            activeSessionId === chat.id
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                    >
                        <MessageSquare className={cn("size-3 shrink-0 transition-opacity", activeSessionId === chat.id ? "opacity-100" : "opacity-50")} />
                        <span className="truncate flex-1">{chat.title}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setDeleteSessionId(chat.id)
                            }}
                            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                        >
                            <Trash2 className="size-3" />
                        </button>
                    </div>
                ))}
            </>
        )
    }

    const now = new Date()
    const today = sessions.filter(s => new Date(s.updated_at).toDateString() === now.toDateString())
    const yesterday = sessions.filter(s => {
        const d = new Date(s.updated_at)
        const y = new Date(now)
        y.setDate(y.getDate() - 1)
        return d.toDateString() === y.toDateString()
    })
    const previous7Days = sessions.filter(s => {
        const d = new Date(s.updated_at)
        const t = new Date(now)
        t.setDate(t.getDate() - 2)
        const limit = new Date(now)
        limit.setDate(limit.getDate() - 7)
        return d <= t && d >= limit
    })

    return (
        <div className="flex bg-background h-[calc(100vh-130px)] rounded-2xl border border-border/40 overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-500">
            {/* LEFT SIDEBAR - HISTORY */}
            <div className="w-60 sm:w-64 flex-shrink-0 flex flex-col bg-card/30 hidden md:flex">
                {/* Header */}
                <div className="h-12 px-4 border-b border-border/40 flex items-center justify-between bg-card/10">
                    <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <MessageSquare className="size-3.5 text-primary" /> Chat History
                    </h2>
                    <Button variant="ghost" size="icon-sm" className="rounded-lg h-7 w-7 hover:bg-muted/80">
                        <Search className="size-3.5 text-muted-foreground" />
                    </Button>
                </div>

                {/* New Chat Button */}
                <div className="p-3 border-b border-border/20">
                    <Button size="sm" onClick={startNewChat} className="w-full justify-start gap-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-colors border-none shadow-none font-medium text-xs h-8">
                        <Plus className="size-3" /> New Chat
                    </Button>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 mt-1">
                    {sessions.length === 0 ? (
                        <div className="px-3 py-6 text-center text-xs text-muted-foreground/60 italic">
                            No chat history
                        </div>
                    ) : (
                        <>
                            {renderSessionGroup("Today", today)}
                            {renderSessionGroup("Yesterday", yesterday)}
                            {renderSessionGroup("Previous 7 Days", previous7Days)}
                        </>
                    )}
                </div>
            </div>

            {/* RIGHT PANE - CHAT INTERFACE */}
            <div className="flex-1 flex flex-col relative bg-background">

                {/* Top header (Optional, left empty or minimal for layout balance) */}
                <div className="h-14 flex-shrink-0 flex items-center px-4 sm:px-6 justify-between bg-transparent sticky top-0 z-20">
                    <div className="flex items-center gap-2.5">
                    </div>
                </div>

                {/* Messages Area or Empty State */}
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 pb-32 relative overflow-y-auto w-full">
                        {/* Background Gradient Layer */}
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
                            <div className="absolute w-[40rem] h-[40rem] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-70 translate-x-[-20%] translate-y-[-10%]"></div>
                            <div className="absolute w-[35rem] h-[35rem] bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-70 translate-x-[20%] translate-y-[10%]"></div>
                        </div>

                        <div className="relative z-10 flex flex-col items-center w-full max-w-4xl mx-auto  mb-auto">
                            <div className="mb-8">
                                <svg width="42" height="42" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-foreground">
                                    <circle cx="20" cy="8" r="4.5" fill="currentColor" />
                                    <circle cx="20" cy="32" r="4.5" fill="currentColor" />
                                    <circle cx="9" cy="14" r="4.5" fill="currentColor" />
                                    <circle cx="31" cy="14" r="4.5" fill="currentColor" />
                                    <circle cx="9" cy="26" r="4.5" fill="currentColor" />
                                    <circle cx="31" cy="26" r="4.5" fill="currentColor" />
                                </svg>
                            </div>

                            <h1 className="text-4xl sm:text-[2.75rem] font-medium tracking-tight text-foreground mb-5 text-center">
                                How can we <span className="text-purple-600 dark:text-purple-400">assist</span> you today?
                            </h1>
                            <p className="text-muted-foreground/80 max-w-2xl text-center mb-16 text-[15px] leading-relaxed">
                                Get expert guidance powered by AI agents specializing in Sales, Marketing, and Negotiation. Choose the agent that suits your needs and start your conversation with ease.
                            </p>

                            {/* Cards Grid */}

                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto px-4 sm:px-10 space-y-8 scroll-smooth pb-32 pt-8 w-full max-w-4xl mx-auto">
                        {messages.map((m: any) => (
                            <div key={m.id} className={cn("flex flex-col gap-2 w-full", m.role === 'user' ? 'items-end' : 'items-start')}>
                                <div className={cn("flex items-start gap-3 max-w-[85%]", m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                                    {m.role === 'user' ? (
                                        <Avatar className="w-9 h-9 rounded-full mt-1 shrink-0 bg-transparent">
                                            <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" className="bg-muted rounded-full" />
                                            <AvatarFallback>US</AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <div className="flex-shrink-0 w-9 h-9 mt-1 rounded-full bg-[#dcfce7] dark:bg-green-900/30 flex items-center justify-center">
                                            <Sparkles className="size-5 text-green-700 dark:text-green-400" />
                                        </div>
                                    )}
                                    <div className={cn(
                                        "px-4 py-3 shadow-sm space-y-2",
                                        m.role === 'user'
                                            ? "bg-[#f3e8ff] dark:bg-[#2b1b3d] text-foreground rounded-[20px] rounded-tr-sm"
                                            : "bg-card border border-border/50 text-foreground rounded-[20px] rounded-tl-sm"
                                    )}>
                                        <div className="text-[14px] leading-relaxed markdown-container">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                                    li: ({ node, ...props }) => <li className="mb-0" {...props} />,
                                                    code: ({ node, inline, ...props }: any) =>
                                                        inline
                                                            ? <code className="bg-muted px-1.5 py-0.5 rounded text-[13px] font-mono" {...props} />
                                                            : <code className="block bg-muted/50 p-3 rounded-lg text-[13px] font-mono my-2 overflow-x-auto" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="font-bold text-foreground" {...props} />,
                                                    h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2" {...props} />,
                                                    h2: ({ node, ...props }) => <h2 className="text-md font-bold mb-2" {...props} />,
                                                    h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-1" {...props} />,
                                                }}
                                            >
                                                {m.parts ? m.parts.map((p: any) => p.type === 'text' ? p.text : '').join('') : (m as any).content || ''}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {status === 'submitted' && (
                            <div className="flex flex-col gap-2 w-full items-start animate-in fade-in zoom-in-95 duration-300">
                                <div className="flex items-start gap-3 max-w-[85%] flex-row">
                                    <div className="flex-shrink-0 w-9 h-9 mt-1 rounded-full bg-[#dcfce7] dark:bg-green-900/30 flex items-center justify-center">
                                        <Sparkles className="size-5 text-green-700 dark:text-green-400" />
                                    </div>
                                    <div className="px-5 py-4 shadow-sm space-y-2.5 bg-card border border-border/50 text-foreground rounded-[24px] rounded-tl-sm flex items-center gap-1.5 h-[52px]">
                                        <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Fixed Input Area (Pill-shaped) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-background via-background/80 to-transparent pt-12">
                    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center gap-3 bg-muted/30 dark:bg-muted/10 backdrop-blur-3xl border border-border/30 rounded-full p-2.5 pr-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-border/80 transition-all">
                        {/* Left action (Attachment) */}
                        <button type="button" className="flex-shrink-0 size-10 sm:size-11 flex items-center justify-center rounded-full bg-zinc-700 dark:bg-zinc-800 text-white hover:bg-zinc-600 transition-colors ml-0.5 shadow-sm">
                            <Paperclip className="size-[18px]" />
                        </button>

                        {/* Input */}
                        <input
                            type="text"
                            placeholder="type your prompt here"
                            className="flex-1 bg-transparent border-none outline-none text-[15px] px-3 font-medium text-foreground placeholder:text-muted-foreground/50"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />

                        {/* Right actions */}
                        <div className="flex items-center gap-2">
                            <button type="button" className="flex-shrink-0 size-10 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                <Mic className="size-5" />
                            </button>
                            <button type="submit" className="flex-shrink-0 size-10 sm:size-11 flex items-center justify-center rounded-full bg-[#bbf7d0] text-green-900 hover:bg-[#86efac] transition-colors shadow-sm ml-1">
                                <ArrowRight className="size-5" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <AlertDialog open={!!deleteSessionId} onOpenChange={(open) => !open && setDeleteSessionId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your chat conversion history.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() => deleteSessionId && deleteChat(deleteSessionId)}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
