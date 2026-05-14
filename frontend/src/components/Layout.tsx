import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, Users, ClipboardList,
  ShoppingCart, Truck, ChevronRight,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/suppliers', icon: Users, label: 'Suppliers' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/procurement', icon: ShoppingCart, label: 'Procurement' },
  { to: '/logistics', icon: Truck, label: 'Logistics' },
]

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-slate-900 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Truck size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">SCM Platform</p>
              <p className="text-slate-400 text-xs mt-0.5">Supply Chain Analytics</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-slate-700">
          <p className="text-slate-500 text-xs">SCM Dashboard v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
