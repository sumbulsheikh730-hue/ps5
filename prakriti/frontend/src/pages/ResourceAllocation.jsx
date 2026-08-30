import { useState } from 'react'
import { useApi } from '../hooks/useApi.js'
import {
  getResources, getResourceRecommendations, deployResource, returnResource, simulateWhatIf
} from '../services/api.js'
import {
  LoadingSpinner, ErrorBanner, DemoBadge, SectionHeader, PriorityBadge
} from '../components/SharedComponents.jsx'
import { RESOURCE_ICONS } from '../utils/helpers.js'
import { Truck, Zap, ArrowRight, RotateCcw, AlertCircle } from 'lucide-react'

const VILLAGE_IDS = [
  { id: 'VLG001', name: 'Rampur' }, { id: 'VLG002', name: 'Sundarpalli' },
  { id: 'VLG003', name: 'Gopipur' }, { id: 'VLG004', name: 'Krishnanagar' },
  { id: 'VLG006', name: 'Mahadevpur' }, { id: 'VLG007', name: 'Saradhapur' },
  { id: 'VLG009', name: 'Chandpur' }, { id: 'VLG010', name: 'Jhillimili' },
  { id: 'VLG012', name: 'Kendupalli' },
]

export default function ResourceAllocation() {
  const { data: resources, loading, error, refetch } = useApi(getResources)
  const { data: recommendations, loading: recLoading } = useApi(getResourceRecommendations)
  const [actionMsg, setActionMsg] = useState(null)
  const [deployTarget, setDeployTarget] = useState({})
  const [whatIfResult, setWhatIfResult] = useState(null)
  const [whatIfForm, setWhatIfForm] = useState({ resource_id: '', from_village: '', to_village: '' })
  const [activeTab, setActiveTab] = useState('resources')

  const handleDeploy = async (resourceId) => {
    const vid = deployTarget[resourceId]
    if (!vid) return alert('Select a village first')
    try {
      await deployResource(resourceId, vid)
      setActionMsg(`Resource deployed successfully.`)
      refetch()
    } catch (e) {
      setActionMsg(`Error: ${e?.response?.data?.detail || e.message}`)
    }
  }

  const handleReturn = async (resourceId) => {
    try {
      await returnResource(resourceId)
      setActionMsg('Resource returned to base.')
      refetch()
    } catch (e) {
      setActionMsg(`Error: ${e?.response?.data?.detail || e.message}`)
    }
  }

  const handleWhatIf = async () => {
    try {
      const r = await simulateWhatIf(whatIfForm.resource_id, whatIfForm.from_village || null, whatIfForm.to_village)
      setWhatIfResult(r.data)
    } catch (e) {
      setActionMsg(`Error: ${e?.response?.data?.detail || e.message}`)
    }
  }

  const statusColor = { available: 'text-green-400', deployed: 'text-blue-400', en_route: 'text-yellow-400', maintenance: 'text-gray-400' }
  const typeGroups = resources ? resources.reduce((acc, r) => {
    acc[r.resource_type] = acc[r.resource_type] || []
    acc[r.resource_type].push(r)
    return acc
  }, {}) : {}

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-white">Resource Allocation</h1>
        <DemoBadge />
      </div>

      {actionMsg && (
        <div className="bg-blue-900/30 border border-blue-700/50 rounded p-2 text-xs text-blue-300 flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="text-gray-500 hover:text-white">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {['resources', 'recommendations', 'whatif'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm capitalize transition-colors ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab === 'whatif' ? 'What-If Simulator' : tab}
          </button>
        ))}
      </div>

      {/* Resources tab */}
      {activeTab === 'resources' && (
        loading ? <LoadingSpinner /> : error ? <ErrorBanner error={error} /> : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Available', val: resources?.filter(r => r.status === 'available').length, color: 'text-green-400' },
                { label: 'Deployed', val: resources?.filter(r => r.status === 'deployed').length, color: 'text-blue-400' },
                { label: 'Total', val: resources?.length, color: 'text-gray-300' },
              ].map(s => (
                <div key={s.label} className="bg-gray-900/60 border border-gray-800 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            {Object.entries(typeGroups).map(([type, items]) => (
              <div key={type} className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 capitalize">
                  {RESOURCE_ICONS[type]} {type.replace('_', ' ')} ({items.length})
                </h3>
                <div className="space-y-2">
                  {items.map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-2 bg-gray-950/50 rounded border border-gray-800">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{r.name}</div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`font-medium ${statusColor[r.status] || 'text-gray-400'}`}>● {r.status}</span>
                          <span className="text-gray-600">Cap: {r.capacity}</span>
                          {r.assigned_village_id && <span className="text-blue-400">→ Village {r.assigned_village_id}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.status === 'available' && (
                          <>
                            <select
                              value={deployTarget[r.id] || ''}
                              onChange={e => setDeployTarget(d => ({ ...d, [r.id]: e.target.value }))}
                              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                            >
                              <option value="">Select village</option>
                              {VILLAGE_IDS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                            <button
                              onClick={() => handleDeploy(r.id)}
                              className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs flex items-center gap-1"
                            >
                              <ArrowRight size={11} /> Deploy
                            </button>
                          </>
                        )}
                        {r.status === 'deployed' && (
                          <button
                            onClick={() => handleReturn(r.id)}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center gap-1"
                          >
                            <RotateCcw size={11} /> Return
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Recommendations tab */}
      {activeTab === 'recommendations' && (
        recLoading ? <LoadingSpinner /> : (
          <div className="space-y-3">
            <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-3 text-xs text-blue-400">
              <div className="flex items-center gap-2 font-semibold mb-1"><Zap size={12} /> AI Resource Allocation Engine</div>
              <p className="text-blue-600">These recommendations are generated by the AI priority algorithm. Resources are matched to villages based on priority score, disaster type, and availability.</p>
            </div>
            {(!recommendations || recommendations.length === 0) ? (
              <div className="text-center py-8 text-gray-500">No recommendations generated. All priority villages may already be served.</div>
            ) : recommendations.map((rec, i) => (
              <div key={i} className="bg-gray-900/60 border border-blue-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ArrowRight size={16} className="text-blue-400" />
                    <span className="font-semibold text-sm text-white">{rec.resource_name}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-blue-400">Village {rec.village_id}</span>
                  </div>
                  {rec.priority && <PriorityBadge pclass={rec.priority} />}
                </div>
                <p className="text-xs text-gray-400">{rec.reason}</p>
              </div>
            ))}
          </div>
        )
      )}

      {/* What-If tab */}
      {activeTab === 'whatif' && (
        <div className="space-y-4">
          <div className="bg-purple-900/20 border border-purple-800/40 rounded-lg p-3 text-xs text-purple-400">
            <div className="font-semibold mb-1">Resource What-If Simulator</div>
            <p className="text-purple-600">Simulate what happens if you move a resource from one village to another before actually deploying it.</p>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Resource</label>
                <select
                  value={whatIfForm.resource_id}
                  onChange={e => setWhatIfForm(f => ({ ...f, resource_id: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white"
                >
                  <option value="">Select resource</option>
                  {(resources || []).map(r => <option key={r.id} value={r.id}>{r.name} ({r.status})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">From Village (current)</label>
                <select
                  value={whatIfForm.from_village}
                  onChange={e => setWhatIfForm(f => ({ ...f, from_village: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white"
                >
                  <option value="">Currently undeployed</option>
                  {VILLAGE_IDS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">To Village (target)</label>
                <select
                  value={whatIfForm.to_village}
                  onChange={e => setWhatIfForm(f => ({ ...f, to_village: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white"
                >
                  <option value="">Select target</option>
                  {VILLAGE_IDS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={handleWhatIf}
              disabled={!whatIfForm.resource_id || !whatIfForm.to_village}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 text-white rounded text-sm flex items-center gap-2"
            >
              <Zap size={14} /> Run Simulation
            </button>
          </div>

          {whatIfResult && (
            <div className="bg-gray-900/80 border border-purple-700/40 rounded-lg p-4 space-y-3">
              <h3 className="font-bold text-sm text-purple-300">What-If Analysis: {whatIfResult.resource}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-900/20 border border-red-800/40 rounded p-3">
                  <div className="text-xs font-semibold text-red-300 mb-2">BEFORE</div>
                  <div className="space-y-1 text-xs text-gray-400">
                    {whatIfResult.from_village_id && (
                      <div>
                        <span className="text-gray-500">From Village:</span>{' '}
                        <span className="text-white">{whatIfResult.before.from_class} – Score {whatIfResult.before.from_priority?.toFixed(0)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">To Village:</span>{' '}
                      <span className="text-white">{whatIfResult.before.to_class} – Score {whatIfResult.before.to_priority?.toFixed(0)}</span>
                    </div>
                    <div className="text-gray-500">Resources assigned: {whatIfResult.before.to_assigned.length || 0}</div>
                  </div>
                </div>
                <div className="bg-green-900/20 border border-green-800/40 rounded p-3">
                  <div className="text-xs font-semibold text-green-300 mb-2">AFTER</div>
                  <div className="space-y-1 text-xs text-gray-400">
                    {whatIfResult.from_village_id && (
                      <div className="text-orange-400">{whatIfResult.after.from_impact}</div>
                    )}
                    <div className="text-green-400">{whatIfResult.after.to_impact}</div>
                    <div className="font-semibold text-white mt-1">
                      Response time change: {whatIfResult.after.estimated_response_change_min} min
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-blue-900/20 border border-blue-800/40 rounded p-3 text-xs text-blue-300">
                <span className="font-semibold">AI Recommendation: </span>{whatIfResult.recommendation}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
