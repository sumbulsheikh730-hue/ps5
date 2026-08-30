import { useEffect, useState } from 'react'
import { usePolling } from '../hooks/useApi.js'
import {
  getDashboardSummary, getActivityFeed, getAlerts, getVillages
} from '../services/api.js'
import {
  MetricCard, LoadingSpinner, ErrorBanner, SeverityBadge, PriorityBadge,
  FogBar, DemoBadge, SectionHeader
} from '../components/SharedComponents.jsx'
import ActivityFeed from '../components/ActivityFeed.jsx'
import { SEVERITY_CONFIG, PRIORITY_CONFIG, DISASTER_LABELS, timeAgo } from '../utils/helpers.js'
import {
  Users, AlertTriangle, Shield, CheckCircle, XCircle, Truck,
  Radio, Navigation, Zap, Eye, TrendingUp, Map
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: summary, loading: sLoading, error: sErr } = usePolling(getDashboardSummary, 8000)
  const { data: activity, refetch: refetchActivity } = usePolling(getActivityFeed, 6000)
  const { data: alerts } = usePolling(getAlerts, 10000)
  const { data: villages, loading: vLoading } = usePolling(getVillages, 10000)

  const criticalVillages = (villages || [])
    .filter(v => v.severity === 'critical' || v.severity === 'high')
    .sort((a, b) => (b.rescue_priority_score || 0) - (a.rescue_priority_score || 0))
    .slice(0, 6)

  const blackoutVillages = (villages || []).filter(v => !v.has_communication)

  if (sLoading && !summary) return (
    <div className="h-full flex items-center justify-center">
      <LoadingSpinner text="Loading EOC Dashboard..." />
    </div>
  )

  return (
    <div className="h-full overflow-y-auto bg-[#0a0e1a] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">District Emergency Operations Center</h1>
          <div className="flex items-center gap-2 mt-1">
            <DemoBadge />
            <span className="text-xs text-gray-500">{summary?.scenario}</span>
          </div>
        </div>
        <div className="text-xs text-gray-600">Last updated: {summary?.last_updated ? new Date(summary.last_updated).toLocaleTimeString() : '—'}</div>
      </div>

      {sErr && <ErrorBanner error={sErr} />}

      {/* Critical alerts banner */}
      {alerts?.filter(a => a.severity === 'critical').length > 0 && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            🚨 ACTIVE CRITICAL ALERTS ({alerts.filter(a => a.severity === 'critical').length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {alerts.filter(a => a.severity === 'critical').slice(0, 4).map((a, i) => (
              <div key={i} className="text-xs text-red-300 flex items-start gap-2">
                <span>•</span> {a.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard title="Affected Villages" value={summary?.affected_villages} icon={Map}
          sub={`of ${summary?.total_villages} total`} accent="red" alert={summary?.affected_villages > 0} />
        <MetricCard title="Critical Zones" value={summary?.critical_zones} icon={AlertTriangle}
          sub="Critical + High severity" accent="orange" />
        <MetricCard title="People at Risk" value={summary?.people_at_risk?.toLocaleString()} icon={Users}
          sub="Estimated across all villages" accent="red" alert />
        <MetricCard title="Active Incidents" value={summary?.active_incidents} icon={Radio}
          sub="Currently being tracked" accent="orange" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard title="Verified Reports" value={summary?.verified_reports} icon={CheckCircle}
          sub={`of ${summary?.total_reports} total`} accent="green" />
        <MetricCard title="Unverified Reports" value={summary?.unverified_reports} icon={XCircle}
          sub="Awaiting confirmation" accent="yellow" />
        <MetricCard title="Blocked Roads" value={summary?.blocked_roads} icon={Navigation}
          sub="Flooded or debris blocked" accent="red" />
        <MetricCard title="Available Resources" value={summary?.available_resources} icon={Truck}
          sub={`${summary?.deployed_resources} deployed`} accent="blue" />
      </div>

      {/* Contradiction + Blackout alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(summary?.contradictions_detected || 0) > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle size={14} />
                <span className="text-sm font-semibold">⚠ {summary.contradictions_detected} Contradictions Detected</span>
              </div>
              <button onClick={() => navigate('/contradictions')} className="text-xs text-yellow-300 hover:underline">View →</button>
            </div>
            <p className="text-xs text-yellow-600 mt-1">Conflicting reports require resolution to improve confidence scores.</p>
          </div>
        )}
        {blackoutVillages.length > 0 && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400">
                <Radio size={14} />
                <span className="text-sm font-semibold">⚠ {blackoutVillages.length} Communication Blackout(s)</span>
              </div>
            </div>
            <p className="text-xs text-red-600 mt-1">
              {blackoutVillages.map(v => v.name).join(', ')} — no recent contact.
            </p>
            <p className="text-xs text-red-500 mt-0.5">Absence of reports ≠ safety. Satellite verification recommended.</p>
          </div>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Priority Village List */}
        <div className="lg:col-span-2 bg-gray-900/60 border border-gray-800 rounded-lg p-4">
          <SectionHeader title="Priority Rescue Ranking" sub="Villages ranked by AI Rescue Priority Score">
            <button onClick={() => navigate('/map')} className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              <Map size={12} /> View on Map
            </button>
          </SectionHeader>
          {vLoading ? <LoadingSpinner /> : (
            <div className="space-y-2">
              {criticalVillages.map((v, idx) => (
                <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-950/50 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors">
                  <div className={`text-lg font-bold w-8 flex-shrink-0 ${idx === 0 ? 'text-red-400' : idx === 1 ? 'text-orange-400' : 'text-yellow-400'}`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white">{v.name}</span>
                      <SeverityBadge severity={v.severity} />
                      <PriorityBadge pclass={v.rescue_priority_class} />
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {v.block} · {v.people_at_risk?.toLocaleString()} at risk · {(v.disaster_types || []).join(', ')}
                      {!v.road_accessible && <span className="ml-2 text-red-400">🚫 Road blocked</span>}
                      {!v.has_communication && <span className="ml-2 text-red-400">📡 No comms</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-white">{v.rescue_priority_score?.toFixed(0)}</div>
                    <div className="text-[10px] text-gray-500">Priority Score</div>
                  </div>
                  <div className="w-24">
                    <div className="text-[10px] text-gray-500 mb-1">Info Fog</div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${v.information_fog_score > 70 ? 'bg-red-500' : v.information_fog_score > 50 ? 'bg-orange-500' : 'bg-yellow-500'}`}
                        style={{ width: `${v.information_fog_score}%` }}
                      />
                    </div>
                    <div className={`text-[10px] mt-0.5 ${v.information_fog_score > 70 ? 'text-red-400' : v.information_fog_score > 50 ? 'text-orange-400' : 'text-yellow-400'}`}>
                      {v.information_fog_score?.toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
          <SectionHeader title="Live Activity Feed" sub="Real-time EOC updates">
            <button onClick={refetchActivity} className="text-xs text-gray-500 hover:text-gray-300">↻ Refresh</button>
          </SectionHeader>
          <ActivityFeed logs={activity || []} maxHeight="480px" />
        </div>
      </div>

      {/* Silence is a Signal section */}
      {blackoutVillages.length > 0 && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Eye size={16} className="text-yellow-400" />
            <h3 className="text-sm font-semibold text-yellow-400">⚠ SILENCE IS A SIGNAL — Information Blackout Zones</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            The following villages have no recent communication. <strong className="text-yellow-400">Absence of reports does not indicate safety.</strong>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {blackoutVillages.map(v => (
              <div key={v.id} className="bg-red-900/20 border border-red-800/50 rounded-lg p-3">
                <div className="font-semibold text-sm text-white">{v.name}</div>
                <div className="text-xs text-gray-500">{v.block} Block</div>
                <div className="text-xs text-red-400 mt-1">📡 No recent reports</div>
                <div className="text-xs text-gray-500 mt-1">
                  Last contact: {v.last_report_time ? timeAgo(v.last_report_time) : 'Unknown'}
                </div>
                <div className="text-xs text-yellow-500 mt-2">
                  Recommended: Satellite / drone verification
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
