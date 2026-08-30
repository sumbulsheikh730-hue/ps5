import { useState } from 'react'
import { useApi } from '../hooks/useApi.js'
import { getReports, submitReport } from '../services/api.js'
import {
  LoadingSpinner, ErrorBanner, SeverityBadge, DemoBadge, SectionHeader
} from '../components/SharedComponents.jsx'
import { SOURCE_LABELS, DISASTER_LABELS, formatDateTime, timeAgo } from '../utils/helpers.js'
import { FileText, Send, CheckCircle, XCircle, Copy } from 'lucide-react'

const DISASTER_OPTIONS = Object.keys(DISASTER_LABELS)
const SOURCE_OPTIONS = ['citizen', 'official', 'police', 'social_media', 'satellite', 'sensor']
const SEVERITY_OPTIONS = ['unknown', 'low', 'moderate', 'high', 'critical']

const VILLAGE_IDS = [
  { id: 'VLG001', name: 'Rampur' }, { id: 'VLG002', name: 'Sundarpalli' },
  { id: 'VLG003', name: 'Gopipur' }, { id: 'VLG004', name: 'Krishnanagar' },
  { id: 'VLG005', name: 'Bhubaneswar Tanda' }, { id: 'VLG006', name: 'Mahadevpur' },
  { id: 'VLG007', name: 'Saradhapur' }, { id: 'VLG008', name: 'Tarakpur' },
  { id: 'VLG009', name: 'Chandpur' }, { id: 'VLG010', name: 'Jhillimili' },
  { id: 'VLG011', name: 'Palasdiha' }, { id: 'VLG012', name: 'Kendupalli' },
  { id: 'VLG013', name: 'Kurumundi' }, { id: 'VLG014', name: 'Deogarh Tanda' },
  { id: 'VLG015', name: 'Shilapur' },
]

export default function ReportsPage() {
  const { data: reports, loading, error, refetch } = useApi(getReports)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  const [filterSource, setFilterSource] = useState('all')
  const [filterVerified, setFilterVerified] = useState('all')

  const [form, setForm] = useState({
    village_id: 'VLG001',
    source_type: 'citizen',
    reporter_name: '',
    disaster_types: [],
    description: '',
    severity: 'unknown',
    people_affected: 0,
    urgency: 3,
  })
  const [imageFile, setImageFile] = useState(null)

  const toggleDisasterType = (dt) => {
    setForm(f => ({
      ...f,
      disaster_types: f.disaster_types.includes(dt)
        ? f.disaster_types.filter(x => x !== dt)
        : [...f.disaster_types, dt]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitResult(null)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'disaster_types') fd.append(k, JSON.stringify(v))
        else fd.append(k, v)
      })
      if (imageFile) fd.append('image', imageFile)
      const r = await submitReport(fd)
      setSubmitResult({ success: true, ...r.data })
      refetch()
      setShowForm(false)
      setForm({ village_id: 'VLG001', source_type: 'citizen', reporter_name: '', disaster_types: [], description: '', severity: 'unknown', people_affected: 0, urgency: 3 })
    } catch (e) {
      setSubmitResult({ success: false, message: e?.response?.data?.detail || 'Submission failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = (reports || []).filter(r => {
    if (filterSource !== 'all' && r.source_type !== filterSource) return false
    if (filterVerified === 'verified' && !r.is_verified) return false
    if (filterVerified === 'unverified' && r.is_verified) return false
    return true
  })

  const inputCls = 'w-full bg-[#12263A] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all duration-150'

  return (
    <div className="h-full overflow-y-auto bg-[#07111F] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-slate-50 tracking-tight">Incident Reports</h1>
          <DemoBadge />
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-all duration-150 font-medium shadow-sm"
        >
          <FileText size={14} /> Submit Report
        </button>
      </div>

      {submitResult && (
        <div className={`alert-toast animate-fade-in ${submitResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
          {submitResult.success ? <CheckCircle size={16} className="flex-shrink-0 mt-0.5" /> : <XCircle size={16} className="flex-shrink-0 mt-0.5" />}
          <div>
            <div className="font-semibold text-sm">{submitResult.success ? 'Report Submitted' : 'Error'}</div>
            <div className="text-xs opacity-80 mt-0.5">{submitResult.message}</div>
            {submitResult.success && submitResult.contradictions_found > 0 && (
              <div className="text-xs text-yellow-400 mt-1">⚠ {submitResult.contradictions_found} contradiction(s) detected!</div>
            )}
            {submitResult.success && submitResult.is_duplicate && (
              <div className="text-xs text-orange-400 mt-1">⚠ Possible duplicate report flagged</div>
            )}
          </div>
        </div>
      )}

      {/* Submit form */}
      {showForm && (
        <div className="bg-[#12263A]/90 backdrop-blur-md border border-[#243B53] rounded-xl p-5 shadow-panel animate-fade-in">
          <h3 className="font-semibold text-sm text-slate-100 mb-4">Submit Incident Report</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Village *</label>
                <select
                  value={form.village_id}
                  onChange={e => setForm(f => ({ ...f, village_id: e.target.value }))}
                  className={inputCls}
                >
                  {VILLAGE_IDS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Source Type</label>
                <select
                  value={form.source_type}
                  onChange={e => setForm(f => ({ ...f, source_type: e.target.value }))}
                  className={inputCls}
                >
                  {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]?.label || s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Reporter Name</label>
                <input
                  value={form.reporter_name}
                  onChange={e => setForm(f => ({ ...f, reporter_name: e.target.value }))}
                  placeholder="Anonymous"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Severity</label>
                <select
                  value={form.severity}
                  onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                  className={inputCls}
                >
                  {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Disaster Types</label>
              <div className="flex flex-wrap gap-1.5">
                {DISASTER_OPTIONS.map(d => (
                  <button
                    key={d} type="button"
                    onClick={() => toggleDisasterType(d)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                      form.disaster_types.includes(d)
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {DISASTER_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Description *</label>
              <textarea
                required
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the situation in detail..."
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">People Affected</label>
                <input
                  type="number" min="0"
                  value={form.people_affected}
                  onChange={e => setForm(f => ({ ...f, people_affected: parseInt(e.target.value) || 0 }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Urgency (1-5)</label>
                <input
                  type="range" min="1" max="5"
                  value={form.urgency}
                  onChange={e => setForm(f => ({ ...f, urgency: parseInt(e.target.value) }))}
                  className="w-full accent-red-500 mt-2"
                />
                <div className="text-xs text-slate-500 text-center">{form.urgency}/5</div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Attach Image (optional)</label>
              <input
                type="file" accept="image/*"
                onChange={e => setImageFile(e.target.files[0])}
                className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-600 file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 file:transition-colors file:duration-150"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-lg text-sm transition-all duration-150 font-medium"
              >
                <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors duration-150">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 text-xs">
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
          className="bg-[#12263A] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors">
          <option value="all">All Sources</option>
          {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]?.label}</option>)}
        </select>
        <select value={filterVerified} onChange={e => setFilterVerified(e.target.value)}
          className="bg-[#12263A] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors">
          <option value="all">All Reports</option>
          <option value="verified">Verified Only</option>
          <option value="unverified">Unverified Only</option>
        </select>
        <span className="text-slate-500">{filtered.length} reports</span>
      </div>

      {/* Report list */}
      {loading ? <LoadingSpinner /> : error ? <ErrorBanner error={error} /> : (
        <div className="space-y-2">
          {filtered.map(r => {
            const src = SOURCE_LABELS[r.source_type] || SOURCE_LABELS.unknown
            const relColor = r.reliability_score >= 70 ? 'text-green-400' : r.reliability_score >= 45 ? 'text-yellow-400' : 'text-red-400'
            return (
              <div key={r.id} className={`bg-[#12263A]/70 border rounded-xl p-3.5 transition-all duration-200 hover:border-slate-700/60 hover:bg-[#12263A] data-row ${r.is_duplicate ? 'border-amber-500/20 opacity-60' : 'border-slate-800/50'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`text-xs font-medium ${src.color}`}>{src.icon} {src.label}</span>
                      <SeverityBadge severity={r.severity} />
                      {r.is_verified && <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 font-medium">✓ Verified</span>}
                      {r.is_duplicate && <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">⚠ Duplicate</span>}
                      {r.disaster_types?.map(d => (
                        <span key={d} className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700/60 rounded-full px-2 py-0.5">{DISASTER_LABELS[d] || d}</span>
                      ))}
                    </div>
                    <p className="text-sm text-slate-300 mb-1.5">{r.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span>👤 {r.reporter_name}</span>
                      {r.people_affected > 0 && <span>👥 {r.people_affected?.toLocaleString()} affected</span>}
                      <span>Urgency: {r.urgency}/5</span>
                      <span>🕐 {timeAgo(r.timestamp)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-bold ${relColor}`}>{r.reliability_score?.toFixed(0)}%</div>
                    <div className="text-[10px] text-slate-600">Reliability</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
