import { useEffect, useRef } from 'react'
import { timeAgo, formatDateTime } from '../utils/helpers.js'
import { Activity, Radio, Satellite, AlertTriangle, Truck, MapPin, Shield, Zap } from 'lucide-react'

const EVENT_CONFIG = {
  report: { icon: Radio, color: 'text-blue-400', bgColor: 'bg-blue-900/30 border-blue-800/50' },
  contradiction: { icon: AlertTriangle, color: 'text-yellow-400', bgColor: 'bg-yellow-900/30 border-yellow-800/50' },
  satellite: { icon: Satellite, color: 'text-cyan-400', bgColor: 'bg-cyan-900/30 border-cyan-800/50' },
  deployment: { icon: Truck, color: 'text-green-400', bgColor: 'bg-green-900/30 border-green-800/50' },
  route: { icon: MapPin, color: 'text-orange-400', bgColor: 'bg-orange-900/30 border-orange-800/50' },
  ai: { icon: Zap, color: 'text-purple-400', bgColor: 'bg-purple-900/30 border-purple-800/50' },
  blackout: { icon: Shield, color: 'text-red-400', bgColor: 'bg-red-900/30 border-red-800/50' },
  medical: { icon: Activity, color: 'text-red-400', bgColor: 'bg-red-900/30 border-red-800/50' },
  simulation: { icon: Zap, color: 'text-green-400', bgColor: 'bg-green-900/30 border-green-800/50' },
  system: { icon: Shield, color: 'text-gray-400', bgColor: 'bg-gray-800/50 border-gray-700/50' },
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
    return <div className="text-sm text-gray-500 p-4 text-center">No activity yet</div>
  }

  return (
    <div className="overflow-y-auto space-y-1.5 pr-1" style={{ maxHeight }}>
      {logs.map((log, idx) => {
        const cfg = EVENT_CONFIG[log.event_type] || EVENT_CONFIG.system
        const Icon = cfg.icon
        const dotCls = SEVERITY_DOT[log.severity] || 'bg-gray-500'

        return (
          <div
            key={log.id || idx}
            className={`flex gap-3 p-2.5 rounded-lg border text-xs ${cfg.bgColor}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              <Icon size={13} className={cfg.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} />
                <span className="font-medium text-gray-200 truncate">{log.title}</span>
              </div>
              {log.body && (
                <p className="text-gray-500 leading-relaxed line-clamp-2">{log.body}</p>
              )}
              <div className="text-gray-600 mt-1">{timeAgo(log.timestamp)}</div>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
