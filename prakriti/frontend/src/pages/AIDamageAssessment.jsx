import { useState, useRef } from 'react'
import { assessDamage, compareBeforeAfter } from '../services/api.js'
import { LoadingSpinner, DemoBadge } from '../components/SharedComponents.jsx'
import { Upload, Zap, Image, AlertTriangle, Eye } from 'lucide-react'

const CONFIDENCE_COLOR = (c) => c >= 0.75 ? 'text-green-400' : c >= 0.5 ? 'text-yellow-400' : 'text-red-400'
const CLASS_COLORS = {
  completely_collapsed: 'bg-red-950/40 border-red-600/40 text-red-300',
  partially_damaged: 'bg-orange-950/40 border-orange-600/40 text-orange-300',
  flooded: 'bg-blue-950/40 border-blue-600/40 text-blue-300',
  waterlogged: 'bg-cyan-950/40 border-cyan-600/40 text-cyan-300',
  blocked_road: 'bg-yellow-950/40 border-yellow-600/40 text-yellow-300',
  damaged_bridge: 'bg-orange-950/40 border-orange-600/40 text-orange-300',
  vehicles_in_danger: 'bg-purple-950/40 border-purple-600/40 text-purple-300',
  unaffected: 'bg-green-950/40 border-green-600/40 text-green-300',
}

export default function AIDamageAssessment() {
  const [activeTab, setActiveTab] = useState('single')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [context, setContext] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [beforeFile, setBeforeFile] = useState(null)
  const [afterFile, setAfterFile] = useState(null)
  const [beforePreview, setBeforePreview] = useState(null)
  const [afterPreview, setAfterPreview] = useState(null)
  const [compareResult, setCompareResult] = useState(null)
  const [compareLoading, setCompareLoading] = useState(false)

  const handleFileSelect = (f) => {
    setFile(f)
    if (f) setPreview(URL.createObjectURL(f))
  }

  const handleAssess = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('image', file)
      if (context) fd.append('disaster_context', context)
      const r = await assessDamage(fd)
      setResult(r.data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Assessment failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCompare = async () => {
    if (!beforeFile || !afterFile) return
    setCompareLoading(true)
    setCompareResult(null)
    try {
      const fd = new FormData()
      fd.append('before', beforeFile)
      fd.append('after', afterFile)
      const r = await compareBeforeAfter(fd)
      setCompareResult(r.data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Comparison failed')
    } finally {
      setCompareLoading(false)
    }
  }

  const selectCls = 'w-full bg-[#111726] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 transition-colors'

  return (
    <div className="h-full overflow-y-auto bg-[#07111F] p-4 space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-white tracking-tight">AI Damage Assessment</h1>
        <DemoBadge />
        <span className="px-2.5 py-0.5 text-xs rounded-full bg-blue-950/40 border border-blue-700/30 text-blue-400 font-medium">Demo Inference Mode</span>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-yellow-400">
        <div className="flex items-center gap-2 font-semibold mb-1"><AlertTriangle size={12} /> Demo AI Notice</div>
        <p className="text-yellow-600/90">
          This system uses a <strong>realistic simulation layer</strong> for image analysis. Results are deterministic based on filename and do not represent actual satellite/drone analysis.
          The architecture is modular — real YOLO/SAR model weights can be integrated via AI_MODE=real in backend settings.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-slate-800/80">
        <button onClick={() => setActiveTab('single')} className={`px-4 py-2.5 text-sm transition-all duration-150 ${activeTab === 'single' ? 'border-b-2 border-blue-500 text-blue-400 font-medium' : 'text-slate-500 hover:text-slate-300'}`}>
          Single Image Assessment
        </button>
        <button onClick={() => setActiveTab('compare')} className={`px-4 py-2.5 text-sm transition-all duration-150 ${activeTab === 'compare' ? 'border-b-2 border-blue-500 text-blue-400 font-medium' : 'text-slate-500 hover:text-slate-300'}`}>
          Before / After Comparison
        </button>
      </div>

      {activeTab === 'single' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Upload */}
            <div className="bg-[#12263A]/85 backdrop-blur-md border border-[#243B53] rounded-xl p-4 shadow-panel space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">Upload Image</h3>
              <div
                className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-200"
                onDrop={e => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]) }}
                onDragOver={e => e.preventDefault()}
                onClick={() => document.getElementById('file-input').click()}
              >
                {preview ? (
                  <img src={preview} alt="preview" className="max-h-48 mx-auto object-contain rounded-lg" />
                ) : (
                  <div className="text-slate-500">
                    <Upload size={30} className="mx-auto mb-2.5 opacity-40" />
                    <p className="text-sm font-medium text-slate-400">Drop image here or click to upload</p>
                    <p className="text-xs mt-1 text-slate-600">Satellite, drone, or ground photo</p>
                  </div>
                )}
                <input id="file-input" type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e.target.files[0])} />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Disaster Context (optional)</label>
                <select
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  className={selectCls}
                >
                  <option value="">Auto-detect</option>
                  <option value="flood">Flood</option>
                  <option value="landslide">Landslide</option>
                  <option value="building_collapse">Building Collapse</option>
                </select>
              </div>

              <button
                onClick={handleAssess}
                disabled={!file || loading}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600/20 hover:bg-blue-600/30 disabled:bg-slate-700/40 border border-blue-500/30 disabled:border-slate-700/40 text-blue-300 disabled:text-slate-600 rounded-lg text-sm transition-all duration-150 font-medium"
              >
                <Zap size={14} /> {loading ? 'Analyzing...' : 'Run AI Assessment'}
              </button>
            </div>

            {/* Results */}
            <div className="bg-[#12263A]/85 backdrop-blur-md border border-[#243B53] rounded-xl p-4 shadow-panel">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Assessment Results</h3>
              {loading && <LoadingSpinner text="AI analysis in progress..." />}
              {error && <div className="text-red-400 text-sm p-3 bg-red-950/20 rounded-xl border border-red-700/30">{error}</div>}
              {result && !loading && (
                <div className="space-y-3 animate-fade-in">
                  <div className="bg-yellow-950/25 border border-yellow-600/25 rounded-lg p-2.5 text-xs text-yellow-500/90">
                    {result.disclaimer}
                  </div>

                  {/* Primary classification */}
                  <div className={`rounded-xl p-3 border text-sm ${CLASS_COLORS[result.primary_classification] || 'bg-slate-800/60 border-slate-700 text-slate-300'}`}>
                    <div className="text-[10px] uppercase font-bold opacity-70 mb-1 tracking-wider">Primary Classification</div>
                    <div className="font-bold text-base">{result.primary_label}</div>
                    <div className="text-xs opacity-80 mt-1">Overall confidence: {(result.overall_confidence * 100).toFixed(0)}%</div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/60 rounded-lg p-2.5">
                      <div className="text-slate-500">Affected Area</div>
                      <div className="font-bold text-orange-400 mt-0.5">{result.estimated_affected_area_pct}%</div>
                    </div>
                    <div className="bg-slate-950/60 rounded-lg p-2.5">
                      <div className="text-slate-500">Damaged Structures</div>
                      <div className="font-bold text-red-400 mt-0.5">~{result.estimated_damaged_structures}</div>
                    </div>
                  </div>

                  {/* All detections */}
                  <div>
                    <div className="text-xs text-slate-500 mb-2 font-medium">All Detections:</div>
                    <div className="space-y-1">
                      {result.detections?.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className={`flex-1 px-2.5 py-1.5 rounded-lg border ${CLASS_COLORS[d.class] || 'bg-slate-800/60 border-slate-700 text-slate-300'}`}>
                            {d.label}
                          </div>
                          <div className={`w-12 text-right font-bold ${CONFIDENCE_COLOR(d.confidence)}`}>
                            {(d.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-slate-950/60 rounded-xl p-3 text-xs text-slate-400">
                    <div className="font-semibold text-slate-300 mb-1">Summary</div>
                    <p>{result.summary}</p>
                  </div>

                  {/* Recommendation */}
                  <div className="bg-blue-950/25 border border-blue-700/30 rounded-xl p-3 text-xs text-blue-300">
                    <div className="font-semibold mb-1">Recommended Action</div>
                    <p>{result.recommendation}</p>
                  </div>
                </div>
              )}
              {!result && !loading && !error && (
                <div className="text-center py-12 text-slate-600">
                  <Eye size={30} className="mx-auto mb-3 opacity-25" />
                  <p className="font-medium text-slate-500">Upload an image and run assessment</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'compare' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Before Disaster', file: beforeFile, preview: beforePreview, setFile: setBeforeFile, setPreview: setBeforePreview, id: 'before-input' },
              { label: 'After Disaster', file: afterFile, preview: afterPreview, setFile: setAfterFile, setPreview: setAfterPreview, id: 'after-input' },
            ].map(({ label, file: f, preview: p, setFile: sf, setPreview: sp, id }) => (
              <div key={id} className="bg-[#12263A]/85 backdrop-blur-md border border-[#243B53] rounded-xl p-4 shadow-panel">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">{label}</h3>
                <div
                  className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-200"
                  onClick={() => document.getElementById(id).click()}
                >
                  {p ? (
                    <img src={p} alt={label} className="max-h-40 mx-auto object-contain rounded-lg" />
                  ) : (
                    <div className="text-slate-500">
                      <Image size={22} className="mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-medium text-slate-400">Click to upload {label.toLowerCase()} image</p>
                    </div>
                  )}
                  <input id={id} type="file" accept="image/*" className="hidden"
                    onChange={e => { sf(e.target.files[0]); sp(URL.createObjectURL(e.target.files[0])) }} />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleCompare}
            disabled={!beforeFile || !afterFile || compareLoading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600/20 hover:bg-blue-600/30 disabled:bg-slate-700/40 border border-blue-500/30 disabled:border-slate-700/40 text-blue-300 disabled:text-slate-600 rounded-lg text-sm transition-all duration-150 font-medium"
          >
            <Zap size={14} /> {compareLoading ? 'Comparing...' : 'Run Before/After Comparison'}
          </button>

          {compareLoading && <LoadingSpinner text="Analyzing change detection..." />}

          {compareResult && (
            <div className="bg-[#111726]/90 backdrop-blur-md border border-blue-500/20 rounded-xl p-4 space-y-4 shadow-panel animate-fade-in">
              <div className="text-xs text-yellow-500/90 bg-yellow-950/25 border border-yellow-700/30 rounded-lg p-2.5">{compareResult.disclaimer}</div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-950/20 border border-green-700/25 rounded-xl p-3">
                  <div className="text-xs text-slate-500">Before Damage</div>
                  <div className="text-xl font-bold text-green-400 mt-0.5">{compareResult.before_damage_estimate}%</div>
                </div>
                <div className="bg-red-950/20 border border-red-700/25 rounded-xl p-3">
                  <div className="text-xs text-slate-500">After Damage</div>
                  <div className="text-xl font-bold text-red-400 mt-0.5">{compareResult.after_damage_estimate}%</div>
                </div>
                <div className="bg-orange-950/20 border border-orange-700/25 rounded-xl p-3">
                  <div className="text-xs text-slate-500">Damage Increase</div>
                  <div className="text-xl font-bold text-orange-400 mt-0.5">+{compareResult.change_percentage}%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 rounded-xl p-3">
                  <div className="text-slate-500 mb-1">Structures Before</div>
                  <div className="font-bold text-slate-100">{compareResult.structures_before}</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-3">
                  <div className="text-slate-500 mb-1">Structures Damaged</div>
                  <div className="font-bold text-red-400">{compareResult.structures_damaged_after}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-400 font-semibold">Key Changes Detected:</div>
                {compareResult.key_changes?.map((c, i) => (
                  <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">•</span> {c}
                  </div>
                ))}
              </div>

              <div className="bg-slate-950/60 rounded-xl p-3 text-xs text-slate-400">
                <div className="font-semibold text-slate-300 mb-1">Analysis Summary</div>
                {compareResult.summary}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
