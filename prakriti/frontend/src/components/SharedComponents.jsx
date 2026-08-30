import { SEVERITY_CONFIG, PRIORITY_CONFIG, fogColor, fogBg } from '../utils/helpers.js'

export function SeverityBadge({ severity, size = 'sm' }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.unknown
  const sz = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
  return (
    <span className={`rounded-full font-medium ${sz} ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
      {cfg.label}
    </span>
  )
}

export function PriorityBadge({ pclass }) {
  const cfg = PRIORITY_CONFIG[pclass] || PRIORITY_CONFIG.P4
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  )
}

export function FogBar({ score, showLabel = true }) {
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Information Fog</span>
          <span className={`font-bold ${fogColor(score)}`}>{score?.toFixed(0)}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full fog-bar ${fogBg(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <div className={`text-xs mt-1 ${fogColor(score)}`}>
          {score >= 70 ? 'Very High Uncertainty' : score >= 50 ? 'High Uncertainty' : score >= 30 ? 'Moderate' : 'Low Uncertainty'}
        </div>
      )}
    </div>
  )
}

export function ConfidenceBar({ score }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  const textColor = score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">Evidence Confidence</span>
        <span className={`font-bold ${textColor}`}>{score?.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export function AccessibilityBar({ score }) {
  const color = score >= 60 ? 'bg-green-500' : score >= 35 ? 'bg-yellow-500' : 'bg-red-500'
  const textColor = score >= 60 ? 'text-green-400' : score >= 35 ? 'text-yellow-400' : 'text-red-400'
  const label = score >= 70 ? 'Accessible' : score >= 40 ? 'Limited' : score >= 20 ? 'Difficult' : 'Isolated'
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">Accessibility</span>
        <span className={`font-bold ${textColor}`}>{score?.toFixed(0)}/100 – {label}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export function MetricCard({ title, value, sub, icon: Icon, accent = 'blue', alert = false }) {
  const accentMap = {
    blue: 'border-blue-800/50 text-blue-400',
    red: 'border-red-800/50 text-red-400',
    orange: 'border-orange-800/50 text-orange-400',
    green: 'border-green-800/50 text-green-400',
    yellow: 'border-yellow-800/50 text-yellow-400',
    purple: 'border-purple-800/50 text-purple-400',
    gray: 'border-gray-700 text-gray-400',
  }
  const cls = accentMap[accent] || accentMap.blue
  return (
    <div className={`bg-gray-900/60 border rounded-lg p-4 ${alert ? 'border-red-700/60 bg-red-900/10' : cls.split(' ')[0]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wide">{title}</span>
        {Icon && <Icon size={16} className={cls.split(' ')[1]} />}
      </div>
      <div className={`text-2xl font-bold ${cls.split(' ')[1]}`}>{value ?? '—'}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}

export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center h-32 text-gray-500">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">{text}</span>
      </div>
    </div>
  )
}

export function ErrorBanner({ error }) {
  if (!error) return null
  return (
    <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-lg p-3 text-sm">
      ⚠ {error}
    </div>
  )
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-amber-900/40 border border-amber-700/40 text-amber-400">
      DEMO DATA
    </span>
  )
}

export function SectionHeader({ title, sub, children }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-gray-100">{title}</h2>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}
