import { useState, useCallback } from 'react'
import { useApi } from '../hooks/useApi.js'
import {
  getHITLRecommendations,
  generateHITLRecommendations,
  approveHITL,
  rejectHITL,
  reassessHITL,
  getHITLAudit,
} from '../services/api.js'
import { LoadingSpinner, ErrorBanner, DemoBadge, SeverityBadge, PriorityBadge } from '../components/SharedComponents.jsx'
import {
  CheckCircle, XCircle, RefreshCw, UserCheck, AlertTriangle,
  ChevronDown, ChevronUp, ClipboardList, Zap, Shield, Eye
} from 'lucide-react'

// ── PRAKRITI token constants ──────────────────────────────────────────────────
const C = {
  bg:       '#07111F',
  surface:  '#0D1B2A',
  card:     '#12263A',
  elevated: '#172F46',
  border:   '#243B53',
  text:     '#F1F5F9',
  muted:    '#94A3B8',
  dim:      '#64748B',
  faint:    '#4A5568',
  cyan:     '#00D4FF',
  teal:     '#00BFA6',
  green:    '#30D158',
  amber:    '#FF9500',
  red:      '#FF3B30',
  yellow:   '#FFD60A',
  violet:   '#8B5CF6',
}

const STATUS_CONFIG = {
  pending:     { label: 'Awaiting Decision', color: C.amber,  bg: 'rgba(255,149,0,0.10)',  border: 'rgba(255,149,0,0.30)' },
  approved:    { label: 'Approved',          color: C.green,  bg: 'rgba(48,209,88,0.10)',  border: 'rgba(48,209,88,0.30)' },
  rejected:    { label: 'Rejected',          color: C.red,    bg: 'rgba(255,59,48,0.10)',  border: 'rgba(255,59,48,0.30)' },
  reassessing: { label: 'Reassessing…',      color: C.cyan,   bg: 'rgba(0,212,255,0.10)',  border: 'rgba(0,212,255,0.30)' },
}

const PRIORITY_COLORS = { P1: C.red, P2: C.amber, P3: C.yellow, P4: C.teal }

// ── Small shared pieces ───────────────────────────────────────────────────────

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

function ScorePill({ value, label, color }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-lg" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <span className="text-lg font-bold tabular-nums" style={{ color }}>{value?.toFixed(0)}</span>
      <span className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: C.dim }}>{label}</span>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, color = C.cyan }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={15} style={{ color }} />
      <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>{title}</h3>
    </div>
  )
}

// ── Decision Modal ─────────────────────────────────────────────────────────────

function DecisionModal({ rec, mode, onClose, onDone }) {
  const [officerName, setOfficerName] = useState('District Officer')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isApprove = mode === 'approve'

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isApprove) {
        await approveHITL(rec.id, officerName, note)
      } else {
        await rejectHITL(rec.id, officerName, note)
      }
      onDone()
    } catch (e) {
      setError(e?.response?.data?.detail || 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(7,17,31,0.85)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          {isApprove
            ? <CheckCircle size={20} style={{ color: C.green }} />
            : <XCircle    size={20} style={{ color: C.red }} />
          }
          <div>
            <div className="font-bold" style={{ color: C.text }}>
              {isApprove ? 'Approve Recommendation' : 'Reject Recommendation'}
            </div>
            <div className="text-xs" style={{ color: C.dim }}>{rec.village_name}</div>
          </div>
        </div>

        {/* AI action summary */}
        <div className="rounded-lg p-3 text-sm" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: C.dim }}>AI Recommended Action</div>
          <div style={{ color: C.text }}>{rec.ai_action}</div>
        </div>

        {/* Officer name */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: C.muted }}>Officer Name</label>
          <input
            value={officerName}
            onChange={e => setOfficerName(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: C.muted }}>
            {isApprove ? 'Note (optional)' : 'Reason for rejection *'}
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder={isApprove ? 'Any additional notes…' : 'State why this recommendation is being rejected…'}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
          />
        </div>

        {error && (
          <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(255,59,48,0.08)', border: `1px solid rgba(255,59,48,0.25)`, color: C.red }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleSubmit}
            disabled={loading || (!isApprove && !note.trim())}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-40"
            style={isApprove
              ? { background: 'rgba(48,209,88,0.15)', border: `1px solid rgba(48,209,88,0.35)`, color: C.green }
              : { background: 'rgba(255,59,48,0.15)', border: `1px solid rgba(255,59,48,0.35)`, color: C.red }
            }
          >
            {loading ? <LoadingSpinner size="sm" /> : isApprove ? <><CheckCircle size={14} /> Confirm Approval</> : <><XCircle size={14} /> Confirm Rejection</>}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm transition-all duration-150"
            style={{ background: C.elevated, border: `1px solid ${C.border}`, color: C.muted }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Single Recommendation Card ─────────────────────────────────────────────────

function RecommendationCard({ rec, onAction }) {
  const [expanded, setExpanded] = useState(rec.status === 'pending')
  const [reassessing, setReassessing] = useState(false)

  const handleReassess = async () => {
    setReassessing(true)
    try {
      await reassessHITL(rec.id)
      onAction()
    } catch {}
    setReassessing(false)
  }

  const pColor = PRIORITY_COLORS[rec.priority_class] || C.muted
  const isPending = rec.status === 'pending' || rec.status === 'reassessing'

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        style={{ borderBottom: expanded ? `1px solid ${C.border}` : 'none' }}
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Priority class badge */}
          <div
            className="w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: `${pColor}18`, border: `1px solid ${pColor}44`, color: pColor }}
          >
            {rec.priority_class}
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate" style={{ color: C.text }}>{rec.village_name}</div>
            <div className="text-xs truncate mt-0.5" style={{ color: C.dim }}>
              {(rec.disaster_types || []).join(', ') || 'No disaster type'} · {rec.people_at_risk?.toLocaleString()} at risk
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <StatusPill status={rec.status} />
          {expanded ? <ChevronUp size={14} style={{ color: C.dim }} /> : <ChevronDown size={14} style={{ color: C.dim }} />}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Score row */}
          <div className="flex gap-3">
            <ScorePill value={rec.priority_score} label="Priority" color={pColor} />
            <ScorePill value={rec.confidence_score} label="Confidence" color={C.teal} />
            <ScorePill value={rec.fog_score} label="Info Fog" color={rec.fog_score >= 70 ? C.red : rec.fog_score >= 40 ? C.amber : C.green} />
            <ScorePill value={rec.people_at_risk} label="At Risk" color={C.text} />
          </div>

          {/* AI Recommended Action */}
          <div>
            <SectionHeader icon={Zap} title="AI Recommended Action" color={C.cyan} />
            <div
              className="rounded-lg p-3 text-sm"
              style={{ background: 'rgba(0,212,255,0.06)', border: `1px solid rgba(0,212,255,0.20)` }}
            >
              <div style={{ color: C.text }}>{rec.ai_action}</div>
            </div>
          </div>

          {/* AI Reasoning — explainability */}
          {rec.ai_reasoning?.length > 0 && (
            <div>
              <SectionHeader icon={Eye} title="Why This Village?" color={C.violet} />
              <ol className="space-y-1.5 list-none">
                {rec.ai_reasoning.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                      style={{ background: `${C.violet}22`, color: C.violet }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ color: C.muted }}>{reason}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Recommended Resources */}
          {rec.recommended_resources?.length > 0 && (
            <div>
              <SectionHeader icon={Shield} title="Resources to Deploy" color={C.teal} />
              <div className="flex flex-wrap gap-2">
                {rec.recommended_resources.map((r, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(0,191,166,0.10)', border: `1px solid rgba(0,191,166,0.25)`, color: C.teal }}
                  >
                    {r.name} <span style={{ color: C.dim }}>({r.type})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Officer decision record (if decided) */}
          {(rec.status === 'approved' || rec.status === 'rejected') && (
            <div>
              <SectionHeader icon={UserCheck} title="Officer Decision" color={C.amber} />
              <div className="rounded-lg p-3 space-y-1" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: C.dim }}>Officer:</span>
                  <span style={{ color: C.text }}>{rec.officer_name || '—'}</span>
                </div>
                {rec.officer_note && (
                  <div className="flex items-start gap-2 text-sm">
                    <span style={{ color: C.dim }} className="flex-shrink-0">Note:</span>
                    <span style={{ color: C.muted }}>{rec.officer_note}</span>
                  </div>
                )}
                {rec.decided_at && (
                  <div className="text-xs" style={{ color: C.faint }}>
                    Decided: {new Date(rec.decided_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {rec.reassessment_count > 0 && (
            <div className="text-xs" style={{ color: C.faint }}>
              Reassessed {rec.reassessment_count} time{rec.reassessment_count > 1 ? 's' : ''}
            </div>
          )}

          {/* Action buttons — only for pending/reassessing */}
          {isPending && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onAction('approve', rec)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150"
                style={{ background: 'rgba(48,209,88,0.12)', border: `1px solid rgba(48,209,88,0.30)`, color: C.green }}
              >
                <CheckCircle size={14} /> Approve
              </button>
              <button
                onClick={() => onAction('reject', rec)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150"
                style={{ background: 'rgba(255,59,48,0.10)', border: `1px solid rgba(255,59,48,0.28)`, color: C.red }}
              >
                <XCircle size={14} /> Reject
              </button>
              <button
                onClick={handleReassess}
                disabled={reassessing}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all duration-150 disabled:opacity-40"
                style={{ background: 'rgba(0,212,255,0.08)', border: `1px solid rgba(0,212,255,0.22)`, color: C.cyan }}
              >
                {reassessing ? <RefreshCw size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                Reassess
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Audit Trail panel ─────────────────────────────────────────────────────────

function AuditPanel() {
  const { data, loading, error, refetch } = useApi(getHITLAudit)

  if (loading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>
  if (error) return <ErrorBanner error={error} />
  if (!data) return null

  const { counts, records } = data

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Pending',  val: counts.pending,  color: C.amber },
          { label: 'Approved', val: counts.approved, color: C.green },
          { label: 'Rejected', val: counts.rejected, color: C.red },
          { label: 'Total',    val: data.total,      color: C.cyan },
        ].map(item => (
          <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="text-2xl font-bold tabular-nums" style={{ color: item.color }}>{item.val}</div>
            <div className="text-xs mt-0.5" style={{ color: C.dim }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Records */}
      <div className="space-y-2">
        {records.length === 0 && (
          <div className="text-center py-8 text-sm" style={{ color: C.dim }}>No decisions recorded yet.</div>
        )}
        {records.map(r => (
          <div
            key={r.id}
            className="flex items-start gap-4 rounded-xl px-4 py-3"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <StatusPill status={r.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm" style={{ color: C.text }}>{r.village_name}</span>
                <span className="text-xs font-bold" style={{ color: PRIORITY_COLORS[r.priority_class] || C.muted }}>{r.priority_class}</span>
              </div>
              <div className="text-xs truncate mt-0.5" style={{ color: C.dim }}>{r.ai_action}</div>
              {r.officer_name && (
                <div className="text-xs mt-1" style={{ color: C.faint }}>
                  {r.officer_name}{r.officer_note ? ` – "${r.officer_note}"` : ''}
                </div>
              )}
            </div>
            <div className="text-xs flex-shrink-0 text-right" style={{ color: C.faint }}>
              {r.decided_at ? new Date(r.decided_at).toLocaleString() : new Date(r.created_at).toLocaleString()}
              {r.reassessment_count > 0 && (
                <div style={{ color: C.cyan }}>{r.reassessment_count}× reassessed</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HITLPage() {
  const [activeTab, setActiveTab] = useState('recommendations')
  const [filterStatus, setFilterStatus] = useState('all')
  const [modal, setModal] = useState(null)  // { mode: 'approve'|'reject', rec }
  const [generating, setGenerating] = useState(false)
  const [genMsg, setGenMsg] = useState(null)

  const fetchRecs = useCallback(
    () => getHITLRecommendations(filterStatus === 'all' ? null : filterStatus),
    [filterStatus]
  )
  const { data: recs, loading, error, refetch } = useApi(fetchRecs)

  const handleGenerate = async () => {
    setGenerating(true)
    setGenMsg(null)
    try {
      const r = await generateHITLRecommendations()
      setGenMsg(`${r.data.created} new AI recommendation${r.data.created !== 1 ? 's' : ''} generated.`)
      refetch()
    } catch (e) {
      setGenMsg(e?.response?.data?.detail || 'Generation failed')
    }
    setGenerating(false)
  }

  const handleModalDone = () => {
    setModal(null)
    refetch()
  }

  const handleCardAction = (mode, rec) => {
    if (mode === 'approve' || mode === 'reject') {
      setModal({ mode, rec })
    } else {
      // reassess — card handles it internally, just refetch after
      refetch()
    }
  }

  const pendingCount = (recs || []).filter(r => r.status === 'pending').length

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4" style={{ background: C.bg }}>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold" style={{ color: C.text }}>Human-in-the-Loop Command</h1>
              <DemoBadge />
            </div>
            <p className="text-xs mt-0.5" style={{ color: C.dim }}>
              AI recommends. The officer decides. Every action is explained and audited.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-40"
          style={{ background: 'rgba(0,212,255,0.12)', border: `1px solid rgba(0,212,255,0.30)`, color: C.cyan }}
        >
          {generating
            ? <RefreshCw size={14} className="animate-spin" />
            : <Zap size={14} />
          }
          {generating ? 'Generating…' : 'Generate AI Recommendations'}
        </button>
      </div>

      {/* HITL flow diagram */}
      <div
        className="rounded-xl px-5 py-3 flex items-center gap-0 overflow-x-auto"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}
      >
        {[
          { label: 'Reports', color: C.cyan },
          { label: 'AI Analysis', color: C.cyan },
          { label: 'Contradiction Detection', color: C.amber },
          { label: 'Info Fog Score', color: C.violet },
          { label: 'Rescue Priority', color: C.red },
          { label: 'Resource Recommendation', color: C.teal },
          { label: '👨‍✈️ Officer Decision', color: C.green, highlight: true },
          { label: 'Final Action', color: C.text },
        ].map((step, i, arr) => (
          <div key={i} className="flex items-center flex-shrink-0">
            <div
              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${step.highlight ? 'font-bold' : ''}`}
              style={step.highlight
                ? { background: 'rgba(48,209,88,0.15)', border: `1px solid rgba(48,209,88,0.40)`, color: step.color }
                : { color: step.color }
              }
            >
              {step.label}
            </div>
            {i < arr.length - 1 && (
              <span className="mx-1.5 text-xs" style={{ color: C.faint }}>→</span>
            )}
          </div>
        ))}
      </div>

      {/* Generating feedback */}
      {genMsg && (
        <div
          className="rounded-lg p-3 text-sm"
          style={{ background: 'rgba(0,212,255,0.07)', border: `1px solid rgba(0,212,255,0.22)`, color: C.cyan }}
        >
          {genMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        {[
          { id: 'recommendations', label: 'Recommendations', icon: AlertTriangle },
          { id: 'audit', label: 'Audit Trail', icon: ClipboardList },
        ].map(tab => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-150"
              style={active
                ? { background: 'rgba(0,212,255,0.12)', color: C.cyan, border: `1px solid rgba(0,212,255,0.25)` }
                : { color: C.dim }
              }
            >
              <tab.icon size={13} />
              {tab.label}
              {tab.id === 'recommendations' && pendingCount > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: C.amber, color: '#000' }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Recommendations tab ── */}
      {activeTab === 'recommendations' && (
        <div className="space-y-3">
          {/* Filter row */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: C.dim }}>Filter:</span>
            {['all', 'pending', 'approved', 'rejected'].map(s => {
              const active = filterStatus === s
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 capitalize"
                  style={active
                    ? { background: 'rgba(0,212,255,0.15)', color: C.cyan, border: `1px solid rgba(0,212,255,0.30)` }
                    : { color: C.dim, border: `1px solid ${C.border}` }
                  }
                >
                  {s}
                </button>
              )
            })}
            <button
              onClick={refetch}
              className="ml-auto p-1.5 rounded-lg transition-all duration-150"
              style={{ color: C.dim, border: `1px solid ${C.border}` }}
              title="Refresh"
            >
              <RefreshCw size={12} />
            </button>
          </div>

          {loading && <div className="flex justify-center py-8"><LoadingSpinner /></div>}
          {error && <ErrorBanner error={error} />}

          {!loading && !error && (recs || []).length === 0 && (
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <Zap size={32} className="mx-auto mb-3" style={{ color: C.faint }} />
              <div className="text-sm font-medium mb-1" style={{ color: C.muted }}>No recommendations yet</div>
              <div className="text-xs mb-4" style={{ color: C.faint }}>
                Click "Generate AI Recommendations" to run the AI pipeline and produce actionable suggestions for all active incidents.
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
                style={{ background: 'rgba(0,212,255,0.12)', border: `1px solid rgba(0,212,255,0.30)`, color: C.cyan }}
              >
                <Zap size={13} /> Generate Now
              </button>
            </div>
          )}

          {(recs || []).map(rec => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              onAction={(mode, r) => mode ? handleCardAction(mode, r) : refetch()}
            />
          ))}
        </div>
      )}

      {/* ── Audit tab ── */}
      {activeTab === 'audit' && <AuditPanel />}

      {/* ── Decision Modal ── */}
      {modal && (
        <DecisionModal
          rec={modal.rec}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onDone={handleModalDone}
        />
      )}
    </div>
  )
}
