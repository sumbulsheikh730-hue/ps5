import { useState } from 'react'
import { useApi } from '../hooks/useApi.js'
import { getContradictions } from '../services/api.js'
import { LoadingSpinner, ErrorBanner, DemoBadge, SectionHeader } from '../components/SharedComponents.jsx'
import { SOURCE_LABELS, formatDateTime, timeAgo } from '../utils/helpers.js'
import { AlertTriangle, CheckCircle, XCircle, Shield } from 'lucide-react'

export default function ContradictionRadar() {
  const { data: contradictions, loading, error } = useApi(getContradictions)
  const [expanded, setExpanded] = useState(null)

  if (loading) return <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>

  return (
    <div className="h-full overflow-y-auto bg-[#07111F] p-4 space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-white tracking-tight">⚠ Contradiction Radar</h1>
        <DemoBadge />
        <span className="text-xs text-slate-500">{contradictions?.length || 0} active contradictions</span>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-yellow-400">
        <div className="flex items-center gap-2 font-semibold mb-1">
          <AlertTriangle size={13} /> Why this matters
        </div>
        <p className="text-yellow-600/90">
          Contradictory reports prevent accurate assessment. PRAKRITI automatically detects conflicting claims
          and uses source reliability weights to determine which report is more credible. Contradictions increase
          the Information Fog score and reduce evidence confidence.
        </p>
      </div>

      {error && <ErrorBanner error={error} />}

      {(!contradictions || contradictions.length === 0) ? (
        <div className="text-center py-12 text-slate-500">
          <CheckCircle size={32} className="mx-auto mb-3 text-green-600 opacity-40" />
          <div className="font-medium">No unresolved contradictions at this time.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {contradictions.map((c, idx) => {
            const isOpen = expanded === c.id
            const confidence = c.current_confidence

            return (
              <div
                key={c.id}
                className={`bg-[#111726]/80 backdrop-blur-md border rounded-xl overflow-hidden shadow-panel transition-all duration-200 ${
                  c.is_resolved ? 'border-emerald-500/20 opacity-60' : 'border-amber-500/20 hover:border-amber-500/30'
                }`}
              >
                {/* Header */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-800/20 transition-colors duration-150"
                  onClick={() => setExpanded(isOpen ? null : c.id)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <AlertTriangle size={13} className="text-yellow-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-sm font-bold text-yellow-400">⚠ CONTRADICTION DETECTED</span>
                      <span className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700/60 rounded-full px-2 py-0.5">
                        Type: {c.contradiction_type?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500">Village: {c.village_id}</span>
                      {c.is_resolved && <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">✓ Resolved</span>}
                    </div>

                    {/* Two claims side by side */}
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="bg-blue-950/25 border border-blue-700/30 rounded-lg p-2.5">
                        <div className="text-[10px] text-blue-400 font-bold mb-1 tracking-wider">CLAIM A</div>
                        <p className="text-xs text-slate-300">{c.claim_a}</p>
                      </div>
                      <div className="bg-red-950/25 border border-red-700/30 rounded-lg p-2.5">
                        <div className="text-[10px] text-red-400 font-bold mb-1 tracking-wider">CLAIM B</div>
                        <p className="text-xs text-slate-300">{c.claim_b}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-slate-100">{confidence?.toFixed(0)}%</div>
                    <div className="text-[10px] text-slate-500">Confidence in<br />dominant report</div>
                  </div>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-800/50 pt-3">
                    {/* Evidence analysis */}
                    <div className="bg-[#12263A] rounded-xl p-3 border border-slate-800/40">
                      <div className="text-xs font-semibold text-slate-300 mb-2">Evidence Analysis</div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-slate-500 mb-1.5">Source reliability weights:</div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Report A source</span>
                              <span className="text-blue-400 font-medium">Medium–High</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Report B source</span>
                              <span className="text-orange-400 font-medium">Low–Medium</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 mb-1.5">Current status:</div>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full progress-bar"
                                style={{ width: `${confidence}%` }}
                              />
                            </div>
                            <span className="text-blue-400 font-bold">{confidence?.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Suggested action */}
                    <div className="bg-blue-950/25 border border-blue-700/30 rounded-lg p-3">
                      <div className="text-xs font-semibold text-blue-300 mb-1">
                        <Shield size={11} className="inline mr-1" />
                        Suggested Action
                      </div>
                      <p className="text-xs text-slate-300">{c.suggested_action}</p>
                    </div>

                    <div className="text-xs text-slate-600 flex gap-4">
                      <span>Detected: {timeAgo(c.detected_at)}</span>
                      <span>Status: {c.is_resolved ? '✓ Resolved' : '⚠ Unresolved'}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
