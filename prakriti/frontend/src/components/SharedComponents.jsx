import { SEVERITY_CONFIG, PRIORITY_CONFIG, fogColor, fogBg } from '../utils/helpers.js'
import { AlertCircle } from 'lucide-react'

export function SeverityBadge({ severity, size = 'sm' }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.unknown
  const sz = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1'
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${sz} ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
      {cfg.label}
    </span>
  )
}

export function PriorityBadge({ pclass }) {
  const cfg = PRIORITY_CONFIG[pclass] || PRIORITY_CONFIG.P4
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  )
}

export function FogBar({ score, showLabel = true }) {
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[#94A3B8] font-medium uppercase tracking-wider">Information Fog</span>
          <span className={`font-bold ${fogColor(score)}`}>{score?.toFixed(0)}%</span>
        </div>
      )}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(36,59,83,0.6)' }}>
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
  // Uses PRAKRITI confidence color (#00D4FF cyan) at high confidence
  const barColor  = score >= 75 ? 'bg-[#00BFA6]'  : score >= 50 ? 'bg-[#FFD60A]' : 'bg-[#FF3B30]'
  const textColor = score >= 75 ? 'text-[#00BFA6]' : score >= 50 ? 'text-[#FFE234]' : 'text-[#FF6B63]'
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#94A3B8] font-medium uppercase tracking-wider">Evidence Confidence</span>
        <span className={`font-bold ${textColor}`}>{score?.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(36,59,83,0.6)' }}>
        <div className={`h-full rounded-full progress-bar ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export function AccessibilityBar({ score }) {
  const barColor  = score >= 60 ? 'bg-[#30D158]'  : score >= 35 ? 'bg-[#FFD60A]' : 'bg-[#FF3B30]'
  const textColor = score >= 60 ? 'text-[#5EE47C]' : score >= 35 ? 'text-[#FFE234]' : 'text-[#FF6B63]'
  const label     = score >= 70 ? 'Accessible' : score >= 40 ? 'Limited' : score >= 20 ? 'Difficult' : 'Isolated'
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#94A3B8] font-medium uppercase tracking-wider">Accessibility</span>
        <span className={`font-bold ${textColor}`}>{score?.toFixed(0)}/100 – {label}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(36,59,83,0.6)' }}>
        <div className={`h-full rounded-full progress-bar ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export function MetricCard({ title, value, sub, icon: Icon, accent = 'blue', alert = false }) {
  // accent maps to PRAKRITI feature colors
  const accentMap = {
    blue:   { border: 'rgba(0,212,255,0.15)',    iconColor: '#00D4FF',  },
    red:    { border: 'rgba(255,59,48,0.20)',     iconColor: '#FF6B63',  },
    orange: { border: 'rgba(255,149,0,0.20)',     iconColor: '#FFB340',  },
    green:  { border: 'rgba(48,209,88,0.18)',     iconColor: '#5EE47C',  },
    yellow: { border: 'rgba(255,214,10,0.18)',    iconColor: '#FFE234',  },
    purple: { border: 'rgba(168,85,247,0.18)',    iconColor: '#C084FC',  },
    gray:   { border: 'rgba(100,116,139,0.25)',   iconColor: '#94A3B8',  },
  }
  const cls = accentMap[accent] || accentMap.blue
  const borderStyle = alert ? 'rgba(255,59,48,0.25)' : cls.border
  return (
    <div
      className="rounded-xl p-4 shadow-panel transition-all duration-200 hover:shadow-panel-lg"
      style={{
        background: 'rgba(18,38,58,0.80)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${borderStyle}`,
        ...(alert ? { background: 'rgba(255,59,48,0.06)' } : {}),
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#94A3B8' }}>{title}</span>
        {Icon && <Icon size={15} style={{ color: cls.iconColor }} />}
      </div>
      <div className="text-3xl font-bold tracking-tight text-white">{value ?? '—'}</div>
      {sub && <div className="text-xs mt-1.5" style={{ color: '#94A3B8' }}>{sub}</div>}
    </div>
  )
}

export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="flex flex-col items-center gap-2">
        {/* spinner uses PRAKRITI cyan accent */}
        <div
          className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#00D4FF', borderTopColor: 'transparent' }}
        />
        <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>{text}</span>
      </div>
    </div>
  )
}

export function ErrorBanner({ error }) {
  if (!error) return null
  return (
    <div
      className="alert-toast animate-fade-in"
      style={{ background: 'rgba(255,59,48,0.10)', borderColor: 'rgba(255,59,48,0.25)', color: '#FF6B63' }}
    >
      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#FF6B63' }} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm" style={{ color: '#FFA09A' }}>System Error</div>
        <div className="text-xs mt-0.5 opacity-80">{error}</div>
      </div>
    </div>
  )
}

export function DemoBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] rounded-full font-medium tracking-wide"
      style={{ background: 'rgba(255,159,10,0.12)', border: '1px solid rgba(255,159,10,0.25)', color: '#FF9F0A' }}
    >
      DEMO DATA
    </span>
  )
}

export function SectionHeader({ title, sub, children }) {
  return (
    <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid rgba(36,59,83,0.8)' }}>
      <div>
        <h2 className="text-sm font-semibold text-white tracking-tight">{title}</h2>
        {sub && <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{sub}</p>}
      </div>
      {children}
    </div>
  )
}
