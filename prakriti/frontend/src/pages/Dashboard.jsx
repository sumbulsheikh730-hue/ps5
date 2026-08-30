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
    <div className="h-full overflow-y-auto bg-[#07111F] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">District Emergency Operations Center</h1>
          <div className="flex items-center gap-2 mt-1">
            <DemoBadge />
            <span className="text-xs" style={{ color: '#94A3B8' }}>{summary?.scenario}</span>
          </div>
        </div>
        <div className="text-xs tabular-nums" style={{ color: '#4A5568' }}>Last updated: {summary?.last_updated ? new Date(summary.last_updated).toLocaleTimeString() : '—'}</div>
      </div>

      {sErr && <ErrorBanner error={sErr} />}

      {/* Critical alerts banner */}
      {alerts?.filter(a => a.severity === 'critical').length > 0 && (
        <div
          className="rounded-xl p-3.5"
          style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.20)' }}
        >
          <div className="flex items-center gap-2 font-semibold text-sm mb-2" style={{ color: '#FF6B63' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FF3B30' }} />
            🚨 ACTIVE CRITICAL ALERTS ({alerts.filter(a => a.severity === 'critical').length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {alerts.filter(a => a.severity === 'critical').slice(0, 4).map((a, i) => (
              <div key={i} className="text-xs flex items-start gap-2" style={{ color: 'rgba(255,107,99,0.85)' }}>
                <span style={{ color: '#FF3B30', marginTop: 2 }}>•</span> {a.message}
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
          <div
            className="rounded-xl p-3.5 transition-all duration-200"
            style={{ background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.20)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2" style={{ color: '#FF9F0A' }}>
                <AlertTriangle size={14} />
                <span className="text-sm font-semibold">⚠ {summary.contradictions_detected} Contradictions Detected</span>
              </div>
              <button
                onClick={() => navigate('/contradictions')}
                className="text-xs transition-colors"
                style={{ color: '#FF9F0A' }}
              >View →</button>
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'rgba(255,159,10,0.70)' }}>Conflicting reports require resolution to improve confidence scores.</p>
          </div>
        )}
        {blackoutVillages.length > 0 && (
          <div
            className="rounded-xl p-3.5 transition-all duration-200"
            style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.20)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2" style={{ color: '#FF6B63' }}>
                <Radio size={14} />
                <span className="text-sm font-semibold">⚠ {blackoutVillages.length} Communication Blackout(s)</span>
              </div>
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'rgba(255,107,99,0.75)' }}>
              {blackoutVillages.map(v => v.name).join(', ')} — no recent contact.
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,107,99,0.55)' }}>Absence of reports ≠ safety. Satellite verification recommended.</p>
          </div>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Priority Village List */}
        <div
          className="lg:col-span-2 rounded-xl p-4 shadow-panel"
          style={{ background: 'rgba(18,38,58,0.85)', backdropFilter: 'blur(12px)', border: '1px solid #243B53' }}
        >
          <SectionHeader title="Priority Rescue Ranking" sub="Villages ranked by AI Rescue Priority Score">
            <button
              onClick={() => navigate('/map')}
              className="text-xs flex items-center gap-1 transition-colors"
              style={{ color: '#00D4FF' }}
            >
              <Map size={12} /> View on Map
            </button>
          </SectionHeader>
          {vLoading ? <LoadingSpinner /> : (
            <div className="space-y-2">
              {criticalVillages.map((v, idx) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-default"
                  style={{ background: '#12263A', border: '1px solid rgba(36,59,83,0.8)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#172F46'}
                  onMouseLeave={e => e.currentTarget.style.background = '#12263A'}
                >
                  <div className={`text-lg font-bold w-8 flex-shrink-0`} style={{ color: idx === 0 ? '#FF3B30' : idx === 1 ? '#FF9500' : '#FFD60A' }}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white">{v.name}</span>
                      <SeverityBadge severity={v.severity} />
                      <PriorityBadge pclass={v.rescue_priority_class} />
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                      {v.block} · {v.people_at_risk?.toLocaleString()} at risk · {(v.disaster_types || []).join(', ')}
                      {!v.road_accessible && <span className="ml-2" style={{ color: '#FF6B63' }}>🚫 Road blocked</span>}
                      {!v.has_communication && <span className="ml-2" style={{ color: '#FF6B63' }}>📡 No comms</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-white">{v.rescue_priority_score?.toFixed(0)}</div>
                    <div className="text-[10px]" style={{ color: '#94A3B8' }}>Priority Score</div>
                  </div>
                  <div className="w-24">
                    <div className="text-[10px] mb-1" style={{ color: '#94A3B8' }}>Info Fog</div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(36,59,83,0.6)' }}>
                      <div
                        className="h-full rounded-full fog-bar"
                        style={{
                          width: `${v.information_fog_score}%`,
                          background: v.information_fog_score > 70 ? '#A855F7' : v.information_fog_score > 50 ? '#FF9F0A' : '#FFD60A',
                        }}
                      />
                    </div>
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: v.information_fog_score > 70 ? '#C084FC' : v.information_fog_score > 50 ? '#FFB340' : '#FFE234' }}
                    >
                      {v.information_fog_score?.toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div
          className="rounded-xl p-4 shadow-panel"
          style={{ background: 'rgba(18,38,58,0.85)', backdropFilter: 'blur(12px)', border: '1px solid #243B53' }}
        >
          <SectionHeader title="Live Activity Feed" sub="Real-time EOC updates">
            <button
              onClick={refetchActivity}
              className="text-xs transition-colors"
              style={{ color: '#94A3B8' }}
            >↻ Refresh</button>
          </SectionHeader>
          <ActivityFeed logs={activity || []} maxHeight="480px" />
        </div>
      </div>

      {/* Silence is a Signal section */}
      {blackoutVillages.length > 0 && (
        <div
          className="rounded-xl p-4 shadow-panel"
          style={{ background: 'rgba(18,38,58,0.85)', backdropFilter: 'blur(12px)', border: '1px solid #243B53' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Eye size={15} style={{ color: '#FFD60A' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#FFE234' }}>⚠ SILENCE IS A SIGNAL — Information Blackout Zones</h3>
          </div>
          <p className="text-xs mb-3" style={{ color: '#94A3B8' }}>
            The following villages have no recent communication. <strong style={{ color: '#FFE234' }}>Absence of reports does not indicate safety.</strong>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {blackoutVillages.map(v => (
              <div
                key={v.id}
                className="rounded-xl p-3 transition-all duration-200"
                style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.20)' }}
              >
                <div className="font-semibold text-sm text-white">{v.name}</div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>{v.block} Block</div>
                <div className="text-xs mt-1.5" style={{ color: '#FF6B63' }}>📡 No recent reports</div>
                <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>
                  Last contact: {v.last_report_time ? timeAgo(v.last_report_time) : 'Unknown'}
                </div>
                <div className="text-xs mt-2" style={{ color: 'rgba(255,214,10,0.75)' }}>
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
