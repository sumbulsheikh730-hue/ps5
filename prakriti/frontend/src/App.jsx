import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Map, FileText, AlertTriangle, Truck,
  Activity, BarChart2, Play, Radio, Shield, UserCheck
} from 'lucide-react'
import Dashboard from './pages/Dashboard.jsx'
import MapPage from './pages/MapPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import ContradictionRadar from './pages/ContradictionRadar.jsx'
import ResourceAllocation from './pages/ResourceAllocation.jsx'
import AIDamageAssessment from './pages/AIDamageAssessment.jsx'
import Analytics from './pages/Analytics.jsx'
import SimulationPage from './pages/SimulationPage.jsx'
import HITLPage from './pages/HITLPage.jsx'
import { getSimulationStatus, getHITLRecommendations } from './services/api.js'

const NAV = [
  { path: '/', icon: LayoutDashboard, label: 'EOC Dashboard' },
  { path: '/map', icon: Map, label: 'Live Map' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/contradictions', icon: AlertTriangle, label: 'Contradiction Radar' },
  { path: '/resources', icon: Truck, label: 'Resource Allocation' },
  { path: '/ai-assessment', icon: Activity, label: 'AI Assessment' },
  { path: '/hitl', icon: UserCheck, label: 'Officer Control' },
  { path: '/analytics', icon: BarChart2, label: 'Analytics' },
  { path: '/simulation', icon: Play, label: 'Simulation' },
]

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [simRunning, setSimRunning] = useState(false)
  const [hitlPending, setHitlPending] = useState(0)

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

  // Poll HITL pending count so the sidebar badge stays current
  useEffect(() => {
    const checkHITL = async () => {
      try {
        const r = await getHITLRecommendations('pending')
        setHitlPending(Array.isArray(r.data) ? r.data.length : 0)
      } catch {}
    }
    checkHITL()
    const t = setInterval(checkHITL, 10000)
    return () => clearInterval(t)
  }, [])

  return (
    <BrowserRouter>
      {/* bg-[#07111F] = PRAKRITI deep navy */}
      <div className="flex h-screen overflow-hidden bg-[#07111F] text-[#F1F5F9]">
        {/* Sidebar — navy slate surface */}
        <aside
          className={`${sidebarOpen ? 'w-56' : 'w-16'} flex-shrink-0 flex flex-col transition-all duration-200`}
          style={{ background: '#0D1B2A', borderRight: '1px solid #243B53' }}
        >
          {/* Logo */}
          <div className="p-3 flex items-center gap-2.5 min-h-[56px]" style={{ borderBottom: '1px solid #243B53' }}>
            <div
              className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)' }}
            >
              <Shield size={15} style={{ color: '#00D4FF' }} />
            </div>
            {sidebarOpen && (
              <div>
                <div className="font-bold text-sm tracking-wide text-white leading-tight">PRAKRITI</div>
                <div className="text-[10px] leading-tight tracking-widest font-medium" style={{ color: '#00D4FF' }}>DISASTER INTELLIGENCE</div>
              </div>
            )}
          </div>

          {/* Demo badge */}
          {sidebarOpen && (
            <div
              className="mx-3 mt-2.5 px-2.5 py-1.5 rounded-lg text-[10px] text-center font-medium tracking-wide"
              style={{ background: 'rgba(255,159,10,0.12)', border: '1px solid rgba(255,159,10,0.25)', color: '#FF9F0A' }}
            >
              DEMO – Suvarnapur District
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 py-2 overflow-y-auto space-y-0.5">
            {NAV.map(({ path, icon: Icon, label }) => {
              const isHITL = path === '/hitl'
              return (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg text-sm transition-all duration-200 nav-active-accent ${
                      isActive ? '' : ''
                    }`
                  }
                  style={({ isActive }) => isActive
                    ? { background: 'rgba(0,212,255,0.08)', color: '#00D4FF', borderLeft: '2px solid #00D4FF' }
                    : { color: '#94A3B8' }
                  }
                  onMouseEnter={e => { if (!e.currentTarget.style.borderLeft) e.currentTarget.style.background = 'rgba(36,59,83,0.4)'; e.currentTarget.style.color = '#F1F5F9' }}
                  onMouseLeave={e => { if (!e.currentTarget.style.borderLeft?.includes('00D4FF')) { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#94A3B8' } }}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {sidebarOpen && <span className="flex-1 truncate font-medium">{label}</span>}
                  {sidebarOpen && isHITL && hitlPending > 0 && (
                    <span
                      className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: '#FF9500', color: '#000' }}
                    >
                      {hitlPending}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Sim status indicator */}
          {simRunning && (
            <div
              className="m-2 p-2.5 rounded-lg text-xs flex items-center gap-2"
              style={{ background: 'rgba(0,191,166,0.10)', border: '1px solid rgba(0,191,166,0.25)', color: '#00BFA6' }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: '#00BFA6' }} />
              {sidebarOpen && <span className="font-medium">Simulation running...</span>}
            </div>
          )}

          {/* Toggle */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-3 text-center transition-colors duration-200 text-xs"
            style={{ color: '#4A5568', borderTop: '1px solid #243B53' }}
            onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
            onMouseLeave={e => e.currentTarget.style.color = '#4A5568'}
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Top bar */}
          <header
            className="h-14 flex items-center justify-between px-5 flex-shrink-0"
            style={{ background: '#0D1B2A', borderBottom: '1px solid #243B53' }}
          >
            <div className="flex items-center gap-3">
              <Radio size={13} className="animate-pulse" style={{ color: '#FF3B30' }} />
              <span className="text-sm font-semibold text-white tracking-tight">District Emergency Operations Center</span>
              <span style={{ color: '#243B53' }}>|</span>
              <span className="text-xs" style={{ color: '#94A3B8' }}>Suvarnapur District – DEMO SCENARIO</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span
                className="px-2.5 py-1 rounded-lg font-medium"
                style={{ background: 'rgba(255,159,10,0.12)', border: '1px solid rgba(255,159,10,0.25)', color: '#FF9F0A' }}
              >
                ⚠ DEMO DATA – Not real-world statistics
              </span>
              <span className="tabular-nums" style={{ color: '#4A5568' }}>{new Date().toLocaleTimeString()}</span>
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
              <Route path="/hitl" element={<HITLPage />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/simulation" element={<SimulationPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}
