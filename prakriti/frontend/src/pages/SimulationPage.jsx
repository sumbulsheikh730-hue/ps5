import { useState, useEffect, useRef } from 'react'
import { startSimulation, getSimulationStatus, resetSimulation } from '../services/api.js'
import { DemoBadge } from '../components/SharedComponents.jsx'
import { Play, RotateCcw, CheckCircle, Zap } from 'lucide-react'

const STEPS = [
  { step: 1,  label: 'Initial citizen reports arriving',              icon: '📨', color: '#00D4FF' },
  { step: 2,  label: 'More reports — contradictions emerging',         icon: '⚠',  color: '#FFD60A' },
  { step: 3,  label: 'Police & official confirmations received',       icon: '👮', color: '#30D158' },
  { step: 4,  label: 'Duplicate reports detected & filtered',          icon: '🔍', color: '#A855F7' },
  { step: 5,  label: 'Contradiction analysis running',                 icon: '⚡', color: '#FF9500' },
  { step: 6,  label: 'Satellite imagery received — evidence fusion',   icon: '🛰',  color: '#00D4FF' },
  { step: 7,  label: 'AI damage assessment processing',                icon: '🤖', color: '#8B5CF6' },
  { step: 8,  label: 'Information Fog scores calculated',              icon: '🌫',  color: '#94A3B8' },
  { step: 9,  label: 'Population at risk estimated',                   icon: '👥', color: '#FF9500' },
  { step: 10, label: 'Rescue priority ranking computed',               icon: '🎯', color: '#FF3B30' },
  { step: 11, label: 'Resource allocation engine running',             icon: '🚣', color: '#30D158' },
  { step: 12, label: 'Route intelligence updated — EOC ready',         icon: '🛣',  color: '#00D4FF' },
]

const SCENARIO = [
  { block: 'Kalindi Block',   event: 'Flood + Road Blockage',              villages: ['Rampur (CRITICAL)', 'Sundarpalli (HIGH)'],   borderColor: 'rgba(0,212,255,0.25)',  bgColor: 'rgba(0,212,255,0.06)' },
  { block: 'Nayagarh Block',  event: 'Building Collapse + Medical Emergency', villages: ['Krishnanagar (CRITICAL)', 'Mahadevpur (HIGH)'], borderColor: 'rgba(255,59,48,0.30)', bgColor: 'rgba(255,59,48,0.06)' },
  { block: 'Baghmundi Block', event: 'Landslide + Communication Loss',     villages: ['Jhillimili (CRITICAL)', 'Kendupalli (HIGH)'],  borderColor: 'rgba(255,149,0,0.30)', bgColor: 'rgba(255,149,0,0.06)' },
  { block: 'Paharpur Block',  event: 'Information Blackout — No contact',  villages: ['Kurumundi (UNKNOWN)', 'Shilapur (BLACKOUT)'], borderColor: 'rgba(255,214,10,0.30)', bgColor: 'rgba(255,214,10,0.06)' },
]

export default function SimulationPage() {
  const [status, setStatus] = useState({ running: false, step: 0, progress_pct: 0, log: [] })
  const [startMsg, setStartMsg] = useState(null)
  const [resetMsg, setResetMsg] = useState(null)
  const pollRef = useRef(null)

  const pollStatus = async () => {
    try {
      const r = await getSimulationStatus()
      setStatus(r.data)
    } catch {}
  }

  useEffect(() => {
    pollStatus()
    pollRef.current = setInterval(pollStatus, 1500)
    return () => clearInterval(pollRef.current)
  }, [])

  const handleStart = async () => {
    setStartMsg(null)
    try {
      await startSimulation()
      setStartMsg('Simulation started! Watch the EOC Dashboard update in real-time.')
      pollStatus()
    } catch (e) {
      setStartMsg(e?.response?.data?.error || 'Failed to start simulation')
    }
  }

  const handleReset = async () => {
    try {
      await resetSimulation()
      setResetMsg('Demo data reset to initial state.')
      setStatus({ running: false, step: 0, progress_pct: 0, log: [] })
    } catch (e) {
      setResetMsg('Reset failed')
    }
  }

  const isComplete = !status.running && status.step >= 12

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4" style={{ background: '#07111F' }}>
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold" style={{ color: '#F1F5F9' }}>Disaster Simulation Mode</h1>
        <DemoBadge />
      </div>

      {/* Intro banner */}
      <div
        className="rounded-xl p-4 text-sm"
        style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.25)' }}
      >
        <div className="flex items-center gap-2 font-bold mb-2" style={{ color: '#F1F5F9' }}>
          <Zap size={16} style={{ color: '#00D4FF' }} />
          PRAKRITI Live Demo Simulation
        </div>
        <p className="mb-3" style={{ color: '#94A3B8' }}>
          Click <strong style={{ color: '#F1F5F9' }}>"RUN DISASTER SIMULATION"</strong> to automatically simulate a realistic multi-block disaster in Suvarnapur district.
          Watch the EOC Dashboard update live as reports arrive, contradictions are detected, AI analyses run, and resources are allocated.
        </p>
        <p className="text-xs" style={{ color: '#4A5568' }}>
          ⚠ This simulation uses entirely fictional data. All village names, numbers and events are for demonstration purposes only.
        </p>
      </div>

      {/* Scenario Overview */}
      <div className="rounded-xl p-4" style={{ background: '#12263A', border: '1px solid #243B53' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#F1F5F9' }}>Scenario: Suvarnapur Multi-Hazard Event</h3>
        <div className="grid grid-cols-2 gap-3">
          {SCENARIO.map((s, i) => (
            <div
              key={i}
              className="rounded-lg p-3 text-xs"
              style={{ background: s.bgColor, border: `1px solid ${s.borderColor}` }}
            >
              <div className="font-bold mb-1" style={{ color: '#F1F5F9' }}>{s.block}</div>
              <div className="mb-2" style={{ color: '#FF9500' }}>⚡ {s.event}</div>
              <div className="space-y-0.5">
                {s.villages.map(v => (
                  <div key={v} style={{ color: '#94A3B8' }}>• {v}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleStart}
          disabled={status.running}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200"
          style={status.running
            ? { background: '#172F46', color: '#4A5568', cursor: 'not-allowed', border: '1px solid #243B53' }
            : { background: 'rgba(48,209,88,0.15)', color: '#30D158', border: '1px solid rgba(48,209,88,0.35)', cursor: 'pointer' }
          }
        >
          {status.running ? (
            <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Simulation Running...</>
          ) : (
            <><Play size={16} /> RUN DISASTER SIMULATION</>
          )}
        </button>

        <button
          onClick={handleReset}
          disabled={status.running}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 disabled:opacity-40"
          style={{ background: '#172F46', color: '#94A3B8', border: '1px solid #243B53' }}
        >
          <RotateCcw size={14} /> Reset Demo Data
        </button>
      </div>

      {startMsg && (
        <div
          className="rounded-lg p-3 text-xs"
          style={{ background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.25)', color: '#30D158' }}
        >
          {startMsg}
        </div>
      )}
      {resetMsg && (
        <div
          className="rounded-lg p-3 text-xs"
          style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}
        >
          {resetMsg}
        </div>
      )}

      {/* Progress */}
      {(status.running || isComplete || status.step > 0) && (
        <div className="rounded-xl p-4" style={{ background: '#12263A', border: '1px solid #243B53' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
              {status.running ? '⚡ Simulation in Progress' : isComplete ? '✅ Simulation Complete' : 'Simulation Progress'}
            </h3>
            <span className="text-lg font-bold" style={{ color: '#00D4FF' }}>{status.progress_pct}%</span>
          </div>

          {/* Overall progress bar */}
          <div className="h-2 rounded-full mb-4 overflow-hidden" style={{ background: '#0D1B2A' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${status.progress_pct}%`, background: '#30D158' }}
            />
          </div>

          {/* Step list */}
          <div className="space-y-2">
            {STEPS.map(s => {
              const done   = status.step > s.step
              const active = status.step === s.step && status.running
              const pending = status.step < s.step

              return (
                <div
                  key={s.step}
                  className="flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200"
                  style={
                    active
                      ? { background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.25)' }
                      : done
                        ? { background: 'rgba(18,38,58,0.6)' }
                        : { opacity: 0.35 }
                  }
                >
                  <div
                    className="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-medium"
                    style={
                      done   ? { background: 'rgba(48,209,88,0.20)', color: '#30D158' } :
                      active ? { background: 'rgba(0,212,255,0.15)', color: '#00D4FF' } :
                               { background: '#172F46', color: '#4A5568' }
                    }
                  >
                    {done ? <CheckCircle size={12} /> : s.step}
                  </div>
                  <span
                    className="text-sm"
                    style={
                      active ? { color: '#30D158', fontWeight: 500 } :
                      done   ? { color: '#64748B' } :
                               { color: '#4A5568' }
                    }
                  >
                    {s.icon} {s.label}
                  </span>
                  {active && (
                    <span className="ml-auto text-xs animate-pulse" style={{ color: '#30D158' }}>Running...</span>
                  )}
                  {done && (
                    <span className="ml-auto text-xs" style={{ color: '#4A5568' }}>Done</span>
                  )}
                </div>
              )
            })}
          </div>

          {isComplete && (
            <div
              className="mt-4 rounded-lg p-3 text-sm"
              style={{ background: 'rgba(48,209,88,0.07)', border: '1px solid rgba(48,209,88,0.25)', color: '#30D158' }}
            >
              ✅ Simulation complete! Visit the <strong>EOC Dashboard</strong> and <strong>Live Map</strong> to see the updated results.
              Resources have been automatically deployed. Check the Activity Feed for the full event timeline.
            </div>
          )}
        </div>
      )}

      {/* What happens explanation */}
      <div className="rounded-xl p-4" style={{ background: '#12263A', border: '1px solid #243B53' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#F1F5F9' }}>What the Simulation Demonstrates</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[
            { icon: '📨', title: 'Fragmented reports',      desc: 'Reports arrive from citizens, police, officials and social media — many conflicting.' },
            { icon: '🔍', title: 'Duplicate detection',     desc: 'AI identifies likely duplicate reports from same source clusters.' },
            { icon: '⚠',  title: 'Contradiction radar',     desc: 'Conflicting severity claims are flagged and reliability weights applied.' },
            { icon: '🛰',  title: 'Satellite evidence fusion', desc: 'SAR imagery confirms flood extent, overriding unreliable citizen claims.' },
            { icon: '🌫',  title: 'Information Fog scoring', desc: 'Each village gets a Fog Score — high fog = high uncertainty = verification needed.' },
            { icon: '🎯', title: 'Explainable priority ranking', desc: 'AI ranks all villages with transparent reasons — "Why this village first?"' },
            { icon: '🚣', title: 'Resource allocation',     desc: 'Resources auto-deployed to highest-priority villages based on disaster type.' },
            { icon: '📡', title: 'Silence as a signal',     desc: 'Villages with no reports are flagged as potential blackout zones — not assumed safe.' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2 rounded-lg"
              style={{ background: '#0D1B2A', border: '1px solid #243B53' }}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <div>
                <div className="font-medium mb-0.5" style={{ color: '#F1F5F9' }}>{item.title}</div>
                <div style={{ color: '#64748B' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
