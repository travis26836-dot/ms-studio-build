import { useState, useEffect } from 'react'

export default function App() {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://ms-studio-build-production.up.railway.app'
        const response = await fetch(`${apiUrl}/api/customer/1`)
        if (!response.ok) throw new Error('Failed to fetch')
        const data = await response.json()
        setCustomer(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomer()
  }, [])

  return (
    <div className="container">
      <header>
        <h1>Customer Portal</h1>
      </header>
      
      <main>
        {loading && <p>Loading...</p>}
        {error && <p className="error">Error: {error}</p>}
        {customer && (
          <div className="customer-card">
            <h2>Welcome, {customer.name || 'Customer'}</h2>
            <p>Email: {customer.email || 'N/A'}</p>
            <p>Account Status: Active</p>
          </div>
        )}
        {!loading && !customer && !error && (
          <p>No customer data available</p>
        )}
      </main>
    </div>
  )
}