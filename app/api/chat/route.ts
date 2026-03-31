import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, type UIMessage, convertToModelMessages } from 'ai';
import { createClient } from '@/lib/supabase/server';

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages, sessionId }: { messages: UIMessage[], sessionId?: string } = await req.json();

    const supabase = await createClient();
    let authUser = null;
    if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        authUser = user;
    }

    if (supabase && authUser && sessionId && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'user') {
            const content = lastMessage.parts ? lastMessage.parts.map((p: any) => p.text || '').join('') : (lastMessage as any).text || '';
            await supabase.schema('risenwise').from('chat_messages').insert([{
                session_id: sessionId,
                user_id: authUser.id,
                role: 'user',
                content: content,
                sort_order: messages.length,
            }])
        }
    }

    const result = streamText({
        model: google('gemini-2.5-flash'),
        messages: await convertToModelMessages(messages),
        onFinish: async ({ text }) => {
            if (supabase && authUser && sessionId) {
                await supabase.schema('risenwise').from('chat_messages').insert([{
                    session_id: sessionId,
                    user_id: authUser.id,
                    role: 'assistant',
                    content: text,
                    sort_order: messages.length + 1,
                }])
                await supabase.schema('risenwise').from('chat_sessions')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', sessionId);
            }
        }
    });

    return result.toUIMessageStreamResponse();
}
