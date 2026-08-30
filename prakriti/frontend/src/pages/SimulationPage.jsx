import { useState, useEffect, useRef } from 'react'
import { startSimulation, getSimulationStatus, resetSimulation } from '../services/api.js'
import { DemoBadge } from '../components/SharedComponents.jsx'
import { Play, RotateCcw, CheckCircle, Zap } from 'lucide-react'

const STEPS = [
  { step: 1, label: 'Initial citizen reports arriving', icon: '📨', color: 'text-blue-400' },
  { step: 2, label: 'More reports — contradictions emerging', icon: '⚠', color: 'text-yellow-400' },
  { step: 3, label: 'Police & official confirmations received', icon: '👮', color: 'text-green-400' },
  { step: 4, label: 'Duplicate reports detected & filtered', icon: '🔍', color: 'text-purple-400' },
  { step: 5, label: 'Contradiction analysis running', icon: '⚡', color: 'text-orange-400' },
  { step: 6, label: 'Satellite imagery received — evidence fusion', icon: '🛰', color: 'text-cyan-400' },
  { step: 7, label: 'AI damage assessment processing', icon: '🤖', color: 'text-blue-400' },
  { step: 8, label: 'Information Fog scores calculated', icon: '🌫', color: 'text-gray-400' },
  { step: 9, label: 'Population at risk estimated', icon: '👥', color: 'text-orange-400' },
  { step: 10, label: 'Rescue priority ranking computed', icon: '🎯', color: 'text-red-400' },
  { step: 11, label: 'Resource allocation engine running', icon: '🚣', color: 'text-green-400' },
  { step: 12, label: 'Route intelligence updated — EOC ready', icon: '🛣', color: 'text-blue-400' },
]

const SCENARIO = [
  { block: 'Kalindi Block', event: 'Flood + Road Blockage', villages: ['Rampur (CRITICAL)', 'Sundarpalli (HIGH)'], color: 'border-blue-700/40 bg-blue-900/10' },
  { block: 'Nayagarh Block', event: 'Building Collapse + Medical Emergency', villages: ['Krishnanagar (CRITICAL)', 'Mahadevpur (HIGH)'], color: 'border-red-700/40 bg-red-900/10' },
  { block: 'Baghmundi Block', event: 'Landslide + Communication Loss', villages: ['Jhillimili (CRITICAL)', 'Kendupalli (HIGH)'], color: 'border-orange-700/40 bg-orange-900/10' },
  { block: 'Paharpur Block', event: 'Information Blackout — No contact', villages: ['Kurumundi (UNKNOWN)', 'Shilapur (BLACKOUT)'], color: 'border-yellow-700/40 bg-yellow-900/10' },
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
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-white">Disaster Simulation Mode</h1>
        <DemoBadge />
      </div>

      {/* Intro */}
      <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-4 text-sm text-blue-300">
        <div className="flex items-center gap-2 font-bold text-white mb-2">
          <Zap size={16} className="text-blue-400" />
          PRAKRITI Live Demo Simulation
        </div>
        <p className="text-blue-400 mb-3">
          Click <strong>"RUN DISASTER SIMULATION"</strong> to automatically simulate a realistic multi-block disaster in Suvarnapur district.
          Watch the EOC Dashboard update live as reports arrive, contradictions are detected, AI analyses run, and resources are allocated.
        </p>
        <p className="text-xs text-blue-600">
          ⚠ This simulation uses entirely fictional data. All village names, numbers and events are for demonstration purposes only.
        </p>
      </div>

      {/* Scenario Overview */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">Scenario: Suvarnapur Multi-Hazard Event</h3>
        <div className="grid grid-cols-2 gap-3">
          {SCENARIO.map((s, i) => (
            <div key={i} className={`rounded-lg border p-3 text-xs ${s.color}`}>
              <div className="font-bold text-gray-200 mb-1">{s.block}</div>
              <div className="text-orange-400 mb-2">⚡ {s.event}</div>
              <div className="space-y-0.5">
                {s.villages.map(v => <div key={v} className="text-gray-400">• {v}</div>)}
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
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-colors ${
            status.running
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-green-700 hover:bg-green-600 text-white shadow-lg shadow-green-900/50'
          }`}
        >
          {status.running ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Simulation Running...</>
          ) : (
            <><Play size={16} /> RUN DISASTER SIMULATION</>
          )}
        </button>

        <button
          onClick={handleReset}
          disabled={status.running}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg text-sm"
        >
          <RotateCcw size={14} /> Reset Demo Data
        </button>
      </div>

      {startMsg && (
        <div className="bg-green-900/30 border border-green-700/50 rounded p-3 text-xs text-green-300">
          {startMsg}
        </div>
      )}
      {resetMsg && (
        <div className="bg-blue-900/30 border border-blue-700/50 rounded p-3 text-xs text-blue-300">
          {resetMsg}
        </div>
      )}

      {/* Progress */}
      {(status.running || isComplete || status.step > 0) && (
        <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-200">
              {status.running ? '⚡ Simulation in Progress' : isComplete ? '✅ Simulation Complete' : 'Simulation Progress'}
            </h3>
            <span className="text-lg font-bold text-white">{status.progress_pct}%</span>
          </div>

          {/* Overall progress bar */}
          <div className="h-2 bg-gray-800 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${status.progress_pct}%` }}
            />
          </div>

          {/* Step list */}
          <div className="space-y-2">
            {STEPS.map(s => {
              const done = status.step > s.step
              const active = status.step === s.step && status.running
              const pending = status.step < s.step

              return (
                <div
                  key={s.step}
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                    active ? 'bg-green-900/30 border border-green-700/40' :
                    done ? 'bg-gray-800/30' :
                    'opacity-40'
                  }`}
                >
                  <div className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-xs ${
                    done ? 'bg-green-700' : active ? 'bg-blue-700 animate-pulse' : 'bg-gray-700'
                  }`}>
                    {done ? <CheckCircle size={12} className="text-white" /> : s.step}
                  </div>
                  <span className={`text-sm ${active ? 'text-green-300 font-medium' : done ? 'text-gray-400' : 'text-gray-600'}`}>
                    {s.icon} {s.label}
                  </span>
                  {active && <span className="ml-auto text-xs text-green-400 animate-pulse">Running...</span>}
                  {done && <span className="ml-auto text-xs text-gray-600">Done</span>}
                </div>
              )
            })}
          </div>

          {isComplete && (
            <div className="mt-4 bg-green-900/20 border border-green-700/40 rounded p-3 text-sm text-green-300">
              ✅ Simulation complete! Visit the <strong>EOC Dashboard</strong> and <strong>Live Map</strong> to see the updated results.
              Resources have been automatically deployed. Check the Activity Feed for the full event timeline.
            </div>
          )}
        </div>
      )}

      {/* What happens explanation */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">What the Simulation Demonstrates</h3>
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
          {[
            { icon: '📨', title: 'Fragmented reports', desc: 'Reports arrive from citizens, police, officials and social media — many conflicting.' },
            { icon: '🔍', title: 'Duplicate detection', desc: 'AI identifies likely duplicate reports from same source clusters.' },
            { icon: '⚠', title: 'Contradiction radar', desc: 'Conflicting severity claims are flagged and reliability weights applied.' },
            { icon: '🛰', title: 'Satellite evidence fusion', desc: 'SAR imagery confirms flood extent, overriding unreliable citizen claims.' },
            { icon: '🌫', title: 'Information Fog scoring', desc: 'Each village gets a Fog Score — high fog = high uncertainty = verification needed.' },
            { icon: '🎯', title: 'Explainable priority ranking', desc: 'AI ranks all villages with transparent reasons — "Why this village first?"' },
            { icon: '🚣', title: 'Resource allocation', desc: 'Resources auto-deployed to highest-priority villages based on disaster type.' },
            { icon: '📡', title: 'Silence as a signal', desc: 'Villages with no reports are flagged as potential blackout zones — not assumed safe.' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-gray-950/50 rounded">
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <div>
                <div className="text-gray-300 font-medium">{item.title}</div>
                <div className="text-gray-500">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
