import { useEffect, useRef } from 'react'
import { timeAgo, formatDateTime } from '../utils/helpers.js'
import { Activity, Radio, Satellite, AlertTriangle, Truck, MapPin, Shield, Zap } from 'lucide-react'

const EVENT_CONFIG = {
  report:        { icon: Radio,          color: 'text-blue-400',    bgColor: 'bg-blue-500/8   border-blue-500/15' },
  contradiction: { icon: AlertTriangle,  color: 'text-amber-400',   bgColor: 'bg-amber-500/8  border-amber-500/15' },
  satellite:     { icon: Satellite,      color: 'text-cyan-400',    bgColor: 'bg-cyan-500/8   border-cyan-500/15' },
  deployment:    { icon: Truck,          color: 'text-emerald-400', bgColor: 'bg-emerald-500/8 border-emerald-500/15' },
  route:         { icon: MapPin,         color: 'text-orange-400',  bgColor: 'bg-orange-500/8 border-orange-500/15' },
  ai:            { icon: Zap,            color: 'text-purple-400',  bgColor: 'bg-purple-500/8 border-purple-500/15' },
  blackout:      { icon: Shield,         color: 'text-red-400',     bgColor: 'bg-red-500/8    border-red-500/15' },
  medical:       { icon: Activity,       color: 'text-red-400',     bgColor: 'bg-red-500/8    border-red-500/15' },
  simulation:    { icon: Zap,            color: 'text-emerald-400', bgColor: 'bg-emerald-500/8 border-emerald-500/15' },
  system:        { icon: Shield,         color: 'text-slate-400',   bgColor: 'bg-slate-800/20 border-slate-700/20' },
}

const SEVERITY_DOT = {
  critical: 'bg-red-500 animate-pulse',
  high: 'bg-orange-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
}

export default function ActivityFeed({ logs = [], maxHeight = '420px' }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  if (!logs.length) {
    return <div className="text-sm text-slate-500 p-4 text-center font-medium">No activity yet</div>
  }

  return (
    <div className="overflow-y-auto space-y-1.5 pr-1" style={{ maxHeight }}>
      {logs.map((log, idx) => {
        const cfg = EVENT_CONFIG[log.event_type] || EVENT_CONFIG.system
        const Icon = cfg.icon
        const dotCls = SEVERITY_DOT[log.severity] || 'bg-slate-500'

        return (
          <div
            key={log.id || idx}
            className={`flex gap-2.5 p-2.5 rounded-xl border text-xs transition-all duration-200 hover:bg-slate-800/20 ${cfg.bgColor}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              <Icon size={12} className={cfg.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} />
                <span className="font-semibold text-slate-200 truncate">{log.title}</span>
              </div>
              {log.body && (
                <p className="text-slate-500 leading-relaxed line-clamp-2 text-[11px]">{log.body}</p>
              )}
              <div className="text-slate-600 mt-1 text-[10px]">{timeAgo(log.timestamp)}</div>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
