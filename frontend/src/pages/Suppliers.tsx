import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { fetchSuppliers, fetchSupplierRiskDistribution, fetchSupplierSpendByCategory } from '../api/client'
import StatusBadge from '../components/StatusBadge'

const RISK_COLORS: Record<string, string> = { low: '#22c55e', medium: '#eab308', high: '#ef4444' }
const CAT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export default function Suppliers() {
  const { data: suppliers, isLoading } = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers })
  const { data: riskDist } = useQuery({ queryKey: ['riskDist'], queryFn: fetchSupplierRiskDistribution })
  const { data: spendByCat } = useQuery({ queryKey: ['supplierSpend'], queryFn: fetchSupplierSpendByCategory })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Supplier Performance</h1>
        <p className="text-slate-500 text-sm mt-1">Scorecards, risk levels, and spend analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-4">On-Time Delivery by Supplier</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={(suppliers ?? []).slice(0, 10)}
              layout="vertical"
              margin={{ left: 10, right: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} width={130} />
              <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="on_time_delivery" fill="#3b82f6" radius={[0, 4, 4, 0]} name="On-Time %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-rows-2 gap-6">
          <div className="card">
            <h2 className="text-base font-semibold text-slate-800 mb-3">Risk Distribution</h2>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={riskDist ?? []} dataKey="count" nameKey="risk_level" cx="50%" cy="50%" outerRadius={50} paddingAngle={3}>
                  {(riskDist ?? []).map((entry: { risk_level: string }, i: number) => (
                    <Cell key={i} fill={RISK_COLORS[entry.risk_level] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h2 className="text-base font-semibold text-slate-800 mb-3">Spend by Category</h2>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={spendByCat ?? []} margin={{ top: 0, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 9 }} tickLine={false} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
                  {(spendByCat ?? []).map((_: unknown, i: number) => (
                    <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Supplier table */}
      <div className="card">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Supplier Scorecards</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Supplier', 'Country', 'Category', 'Risk', 'On-Time Del.', 'Fill Rate', 'Rejection', 'Avg Lead', 'Orders', 'Total Spend'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-slate-500 font-medium text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="py-8 text-center text-slate-400">Loading...</td></tr>
              ) : (suppliers ?? []).map((s: Record<string, unknown>) => (
                <tr key={String(s.id)} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 px-3 font-medium text-slate-900">{String(s.name)}</td>
                  <td className="py-2 px-3 text-slate-600">{String(s.country)}</td>
                  <td className="py-2 px-3 text-slate-600">{String(s.category)}</td>
                  <td className="py-2 px-3"><StatusBadge value={String(s.risk_level)} /></td>
                  <td className="py-2 px-3">
                    <span className={`font-medium ${Number(s.on_time_delivery) >= 95 ? 'text-green-600' : Number(s.on_time_delivery) >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {Number(s.on_time_delivery).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2 px-3">{Number(s.shipped_in_full_rate).toFixed(1)}%</td>
                  <td className="py-2 px-3">{Number(s.rejection_rate).toFixed(1)}%</td>
                  <td className="py-2 px-3">{Number(s.avg_lead_time_days).toFixed(1)}d</td>
                  <td className="py-2 px-3">{Number(s.total_orders)}</td>
                  <td className="py-2 px-3 font-medium">${Number(s.total_spend).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
