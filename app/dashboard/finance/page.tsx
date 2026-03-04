import FinanceClient from './finance-client'

export const metadata = {
    title: 'Finance · Wiseflow',
    description: 'Manage your wallets, transactions, budgets, and saving goals',
}

export default function FinancePage() {
    return <FinanceClient />
}
