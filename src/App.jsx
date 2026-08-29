import Auth from "./Auth"
import { supabase } from "./supabaseClient"

import { useEffect, useState } from "react"
function App() {

  const [session, setSession] = useState(null)
const [authLoading, setAuthLoading] = useState(true)
const [category, setCategory] = useState("Other")

const categories = ["Food", "Transport", "Bills", "Entertainment", "Salary", "Other"]

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session)
    setAuthLoading(false)
  })

  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session)
    setAuthLoading(false)
  })

  return () => subscription.unsubscribe()
}, [])

const [transactions, setTransactions] = useState([])
const [transactionsLoading, setTransactionsLoading] = useState(true)
const [transactionError, setTransactionError] = useState("")

useEffect(() => {
  if (!session) {
    return
  }

  async function loadTransactions() {
    setTransactionsLoading(true)
    setTransactionError("")

    const { data, error } = await supabase
      .from("transactions")
      .select("id, name, amount, type, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      setTransactionError(error.message)
    } else {
      const formattedTransactions = data.map((transaction) => ({
        ...transaction,
        amount:
          transaction.type === "expense"
            ? -Number(transaction.amount)
            : Number(transaction.amount)
      }))

      setTransactions(formattedTransactions)
    }

    setTransactionsLoading(false)
  }

  loadTransactions()
}, [session])
const income = transactions
  .filter((transaction) => transaction.amount > 0)
  .reduce((total, transaction) => total + transaction.amount, 0)

const expenses = transactions
  .filter((transaction) => transaction.amount < 0)
  .reduce((total, transaction) => total + Math.abs(transaction.amount), 0)

const balance = income - expenses

const [newExpense, setNewExpense] = useState("")
const [newExpenseName, setNewExpenseName] = useState("")
const [transactionType, setTransactionType] = useState("expense")



async function addTransaction(event) {
  event.preventDefault()

  const amount = Number(newExpense)
  const name = newExpenseName.trim()

  if (name === "" || amount <= 0) {
    return
  }

  setTransactionError("")

 const { data, error } = await supabase
  .from("transactions")
  .insert({
    name: name,
    amount: amount,
    type: transactionType,
    category: category
  })
  .select("id, name, amount, type, category, created_at")
  .single()

  if (error) {
    setTransactionError(error.message)
    return
  }

  const formattedTransaction = {
    ...data,
    amount:
      data.type === "expense"
        ? -Number(data.amount)
        : Number(data.amount)
  }

  setTransactions((currentTransactions) => [
    formattedTransaction,
    ...currentTransactions
  ])

  setNewExpense("")
  setNewExpenseName("")
  setCategory("Other")
}

async function deleteTransaction(id, name) {
  const confirmed = window.confirm(`Delete "${name}"? This can't be undone.`)
  if (!confirmed) {
    return
  }

  setTransactionError("")

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)

  if (error) {
    setTransactionError(error.message)
    return
  }

  setTransactions((currentTransactions) =>
    currentTransactions.filter((transaction) => transaction.id !== id)
  )
}

if (authLoading) {
  return <p>Loading SecureVault...</p>
}

if (!session) {
  return <Auth />
}

return (
  <main className="dashboard">
   <div className="dashboard-header">
  <div>
    <h1>SecureVault</h1>
    <p>Your personal finance dashboard</p>
  </div>

  <button
    onClick={async () => {
      await supabase.auth.signOut()
    }}
  >
    Logout
  </button>
</div>
   <div className="summary-grid">
  <section className="summary-card">
    <h2>Total Balance</h2>
    <p>RM {balance}</p>
  </section>

  <section className="summary-card">
    <h2>Income</h2>
    <p>RM {income}</p>
  </section>

  <section className="summary-card">
    <h2>Expenses</h2>
    <p>RM {expenses}</p>
  </section>
</div>

<section className="form-card">
  <h2>Add Transaction</h2>

  <form className="transaction-form" onSubmit={addTransaction}>
    <select
      value={transactionType}
      onChange={(event) => setTransactionType(event.target.value)}
    >
      <option value="expense">Expense</option>
      <option value="income">Income</option>
    </select>
    <select value={category} onChange={(event) => setCategory(event.target.value)}>
  {categories.map((cat) => (
    <option key={cat} value={cat}>{cat}</option>
  ))}
</select>

    <input
      type="text"
      placeholder={
        transactionType === "income" ? "Income name" : "Expense name"
      }
      value={newExpenseName}
      onChange={(event) => setNewExpenseName(event.target.value)}
    />

    <input
      type="number"
      placeholder={
        transactionType === "income"
          ? "Enter income amount"
          : "Enter expense amount"
      }
      value={newExpense}
      onChange={(event) => setNewExpense(event.target.value)}
    />

    <button type="submit">Add Transaction</button>
  </form>
</section>


        <section className="transactions-card">
        <h2>Recent Transactions</h2>
        {transactionError && (
  <p role="alert">{transactionError}</p>
)}

{transactionsLoading && (
  <p>Loading transactions...</p>
)}
 <ul>
          {transactions.map((transaction) => (
          <li key={transaction.id}>
 <span>{transaction.name}</span>
 <span className="transaction-category">{transaction.category}</span>

<span
  className={
    transaction.amount < 0 ? "amount-negative" : "amount-positive"
  }
>
  RM {transaction.amount}
</span>

  <button onClick={() => deleteTransaction(transaction.id)}>
    Delete
  </button>
</li>
            
          ))}
        </ul>
      </section>
  
    </main>
  )
}

export default App