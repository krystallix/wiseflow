import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const { recentTransactions } = await req.json();

        const now = new Date();
        const dayOfMonth = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        const prompt = `You are a helpful and concise financial assistant.
Today is day ${dayOfMonth} out of ${daysInMonth} days this month.

Here are the user's transactions this month:
${JSON.stringify(recentTransactions.map((t: any) => ({
            name: t.category?.name || t.note,
            amount: t.amount,
            type: t.type,
        })))}

From the list above:
1. Identify only consumptive spending — things like food, entertainment, lifestyle, shopping, dining out, hobbies, subscriptions. 
2. Ignore investment, savings, income, or essential fixed costs like rent and utility bills.
3. Calculate the total consumptive spending so far.

Then provide 1-2 short, supportive sentences of insight or advice based on:
- The consumptive spending pattern and total
- What kind of expense category need to reduce

Talk directly to the user. No bullet points. Language: English.`;

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return new Response(JSON.stringify({ summary: text }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Failed to generate AI finance summary:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate summary' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
