import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const { summary, monthIncome, monthExpense, recentTransactions } = await req.json();

        const prompt = `You are a helpful and concise financial assistant.
Analyze the following financial block for this month. 
Provide a very short, supportive, and 1-2 sentence insights / advice on how the user's spending habits can be improved or maintained based on this real data:
- Month Net: ${summary.monthNet}
- Income: ${monthIncome}
- Expense: ${monthExpense}
Recent transactions: ${JSON.stringify(recentTransactions.map((t: any) => ({ name: t.category?.name || t.note, amount: t.amount, type: t.type })))}

Keep it straight to the point, maximum 3 sentences. No bullet points. Talk directly to the user (e.g. "You spent a lot on food..."). Language: English.`;

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
