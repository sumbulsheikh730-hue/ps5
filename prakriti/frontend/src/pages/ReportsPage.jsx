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

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-white">Incident Reports</h1>
          <DemoBadge />
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
        >
          <FileText size={14} /> Submit Report
        </button>
      </div>

      {submitResult && (
        <div className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${submitResult.success ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-red-900/30 border-red-700 text-red-300'}`}>
          {submitResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <div>
            <div className="font-medium">{submitResult.success ? 'Report Submitted' : 'Error'}</div>
            <div className="text-xs opacity-80">{submitResult.message}</div>
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
        <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-sm text-white mb-4">Submit Incident Report</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Village *</label>
                <select
                  value={form.village_id}
                  onChange={e => setForm(f => ({ ...f, village_id: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {VILLAGE_IDS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Source Type</label>
                <select
                  value={form.source_type}
                  onChange={e => setForm(f => ({ ...f, source_type: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]?.label || s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Reporter Name</label>
                <input
                  value={form.reporter_name}
                  onChange={e => setForm(f => ({ ...f, reporter_name: e.target.value }))}
                  placeholder="Anonymous"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Severity</label>
                <select
                  value={form.severity}
                  onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Disaster Types</label>
              <div className="flex flex-wrap gap-2">
                {DISASTER_OPTIONS.map(d => (
                  <button
                    key={d} type="button"
                    onClick={() => toggleDisasterType(d)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${form.disaster_types.includes(d) ? 'bg-blue-700 border-blue-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                  >
                    {DISASTER_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Description *</label>
              <textarea
                required
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the situation in detail..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">People Affected</label>
                <input
                  type="number" min="0"
                  value={form.people_affected}
                  onChange={e => setForm(f => ({ ...f, people_affected: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Urgency (1-5)</label>
                <input
                  type="range" min="1" max="5"
                  value={form.urgency}
                  onChange={e => setForm(f => ({ ...f, urgency: parseInt(e.target.value) }))}
                  className="w-full accent-red-500 mt-2"
                />
                <div className="text-xs text-gray-500 text-center">{form.urgency}/5</div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Attach Image (optional)</label>
              <input
                type="file" accept="image/*"
                onChange={e => setImageFile(e.target.files[0])}
                className="text-xs text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-gray-600 file:bg-gray-800 file:text-gray-300 hover:file:bg-gray-700"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 text-white rounded text-sm transition-colors"
              >
                <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 text-xs">
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300">
          <option value="all">All Sources</option>
          {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]?.label}</option>)}
        </select>
        <select value={filterVerified} onChange={e => setFilterVerified(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300">
          <option value="all">All Reports</option>
          <option value="verified">Verified Only</option>
          <option value="unverified">Unverified Only</option>
        </select>
        <span className="text-gray-500">{filtered.length} reports</span>
      </div>

      {/* Report list */}
      {loading ? <LoadingSpinner /> : error ? <ErrorBanner error={error} /> : (
        <div className="space-y-2">
          {filtered.map(r => {
            const src = SOURCE_LABELS[r.source_type] || SOURCE_LABELS.unknown
            const relColor = r.reliability_score >= 70 ? 'text-green-400' : r.reliability_score >= 45 ? 'text-yellow-400' : 'text-red-400'
            return (
              <div key={r.id} className={`bg-gray-900/60 border rounded-lg p-3 ${r.is_duplicate ? 'border-orange-800/50 opacity-60' : 'border-gray-800'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-medium ${src.color}`}>{src.icon} {src.label}</span>
                      <SeverityBadge severity={r.severity} />
                      {r.is_verified && <span className="text-xs text-green-400 border border-green-700/50 rounded px-1.5 py-0.5">✓ Verified</span>}
                      {r.is_duplicate && <span className="text-xs text-orange-400 border border-orange-700/50 rounded px-1.5 py-0.5">⚠ Duplicate</span>}
                      {r.disaster_types?.map(d => (
                        <span key={d} className="text-xs text-gray-500 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5">{DISASTER_LABELS[d] || d}</span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-300 mb-1">{r.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>👤 {r.reporter_name}</span>
                      {r.people_affected > 0 && <span>👥 {r.people_affected?.toLocaleString()} affected</span>}
                      <span>Urgency: {r.urgency}/5</span>
                      <span>🕐 {timeAgo(r.timestamp)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-bold ${relColor}`}>{r.reliability_score?.toFixed(0)}%</div>
                    <div className="text-[10px] text-gray-600">Reliability</div>
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
