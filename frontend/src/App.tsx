import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Suppliers from './pages/Suppliers'
import Orders from './pages/Orders'
import Procurement from './pages/Procurement'
import Logistics from './pages/Logistics'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="orders" element={<Orders />} />
          <Route path="procurement" element={<Procurement />} />
          <Route path="logistics" element={<Logistics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
