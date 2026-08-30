import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Map, FileText, AlertTriangle, Truck,
  Activity, BarChart2, Play, Radio, Shield
} from 'lucide-react'
import Dashboard from './pages/Dashboard.jsx'
import MapPage from './pages/MapPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import ContradictionRadar from './pages/ContradictionRadar.jsx'
import ResourceAllocation from './pages/ResourceAllocation.jsx'
import AIDamageAssessment from './pages/AIDamageAssessment.jsx'
import Analytics from './pages/Analytics.jsx'
import SimulationPage from './pages/SimulationPage.jsx'
import { getSimulationStatus } from './services/api.js'

const NAV = [
  { path: '/', icon: LayoutDashboard, label: 'EOC Dashboard' },
  { path: '/map', icon: Map, label: 'Live Map' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/contradictions', icon: AlertTriangle, label: 'Contradiction Radar' },
  { path: '/resources', icon: Truck, label: 'Resource Allocation' },
  { path: '/ai-assessment', icon: Activity, label: 'AI Assessment' },
  { path: '/analytics', icon: BarChart2, label: 'Analytics' },
  { path: '/simulation', icon: Play, label: 'Simulation' },
]

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [simRunning, setSimRunning] = useState(false)

  useEffect(() => {
    const check = async () => {
      try {
        const r = await getSimulationStatus()
        setSimRunning(r.data.running)
      } catch {}
    }
    check()
    const t = setInterval(check, 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-[#0a0e1a] text-gray-200">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} flex-shrink-0 bg-[#080c18] border-r border-gray-800/80 flex flex-col transition-all duration-200`}>
          {/* Logo */}
          <div className="p-3 border-b border-gray-800 flex items-center gap-2 min-h-[56px]">
            <div className="w-8 h-8 flex-shrink-0 rounded bg-blue-600 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <div className="font-bold text-sm text-white leading-tight">PRAKRITI</div>
                <div className="text-[10px] text-blue-400 leading-tight">DISASTER INTELLIGENCE</div>
              </div>
            )}
          </div>

          {/* Demo badge */}
          {sidebarOpen && (
            <div className="mx-3 mt-2 px-2 py-1 rounded text-[10px] bg-amber-900/40 border border-amber-700/40 text-amber-400 text-center">
              DEMO – Suvarnapur District
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 py-2 overflow-y-auto">
            {NAV.map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 mx-1 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                      : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                  }`
                }
              >
                <Icon size={16} className="flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Sim status indicator */}
          {simRunning && (
            <div className="m-2 p-2 bg-green-900/40 border border-green-700/40 rounded text-xs text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              {sidebarOpen && 'Simulation running...'}
            </div>
          )}

          {/* Toggle */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-3 text-gray-600 hover:text-gray-400 border-t border-gray-800 text-center"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Top bar */}
          <header className="h-14 bg-[#080c18] border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Radio size={14} className="text-red-400 animate-pulse" />
              <span className="text-sm font-medium text-gray-300">District Emergency Operations Center</span>
              <span className="text-xs text-gray-600">|</span>
              <span className="text-xs text-gray-500">Suvarnapur District – DEMO SCENARIO</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="px-2 py-0.5 rounded bg-amber-900/40 border border-amber-700/40 text-amber-400">
                ⚠ DEMO DATA – Not real-world statistics
              </span>
              <span className="text-gray-600">{new Date().toLocaleTimeString()}</span>
            </div>
          </header>

          {/* Page content */}
          <div className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/contradictions" element={<ContradictionRadar />} />
              <Route path="/resources" element={<ResourceAllocation />} />
              <Route path="/ai-assessment" element={<AIDamageAssessment />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/simulation" element={<SimulationPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}
