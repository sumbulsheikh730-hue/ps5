import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useApi } from '../hooks/useApi.js'
import { getVillages, getRoads, getVillage, getWhyFirst } from '../services/api.js'
import { SEVERITY_CONFIG, PRIORITY_CONFIG, DISASTER_LABELS, fogColor, formatDateTime, timeAgo } from '../utils/helpers.js'
import { FogBar, ConfidenceBar, AccessibilityBar, SeverityBadge, PriorityBadge, LoadingSpinner, DemoBadge } from './SharedComponents.jsx'
import { X, Info, AlertTriangle, HelpCircle } from 'lucide-react'

const SEVERITY_RADIUS = { critical: 16, high: 12, moderate: 9, low: 7, unknown: 7 }
const ROAD_COLORS = { open: '#22c55e', blocked: '#ef4444', flooded: '#3b82f6', damaged: '#f97316' }

function VillageMarker({ village, onClick }) {
  const cfg = SEVERITY_CONFIG[village.severity] || SEVERITY_CONFIG.unknown
  const r = SEVERITY_RADIUS[village.severity] || 8
  const pulsing = village.severity === 'critical'

  return (
    <CircleMarker
      center={[village.lat, village.lon]}
      radius={r}
      pathOptions={{
        color: cfg.hex,
        fillColor: cfg.hex,
        fillOpacity: 0.7,
        weight: pulsing ? 3 : 1.5,
        opacity: 1,
      }}
      eventHandlers={{ click: () => onClick(village) }}
    >
      <Popup>
        <div className="text-gray-200 min-w-[180px]">
          <div className="font-bold">{village.name}</div>
          <div className="text-xs text-gray-400">{village.block} Block</div>
          <div className="text-xs mt-1">
            Priority: <span className="font-bold">{village.rescue_priority_class}</span> | Score: {village.rescue_priority_score?.toFixed(0)}
          </div>
          <button
            onClick={() => onClick(village)}
            className="mt-2 w-full text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded"
          >
            View Details
          </button>
        </div>
      </Popup>
    </CircleMarker>
  )
}

export default function DisasterMap({ fullscreen = false }) {
  const { data: villages, loading: vLoading } = useApi(getVillages)
  const { data: roads } = useApi(getRoads)
  const [selected, setSelected] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [whyFirst, setWhyFirst] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showRoads, setShowRoads] = useState(true)
  const [filterSeverity, setFilterSeverity] = useState('all')

  const handleVillageClick = async (village) => {
    setSelected(village)
    setWhyFirst(null)
    setLoadingDetail(true)
    try {
      const r = await getVillage(village.id)
      setDetailData(r.data)
    } catch {}
    setLoadingDetail(false)
  }

  const handleWhyFirst = async (id) => {
    try {
      const r = await getWhyFirst(id)
      setWhyFirst(r.data)
    } catch {}
  }

  const filtered = (villages || []).filter(v =>
    filterSeverity === 'all' || v.severity === filterSeverity
  )

  const mapH = fullscreen ? 'h-full' : 'h-[560px]'

  return (
    <div className={`relative w-full ${mapH} rounded-lg overflow-hidden border border-gray-800`}>
      {/* Map controls */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-2 text-xs space-y-1">
          <div className="font-semibold text-gray-300 mb-2">Severity Filter</div>
          {['all', 'critical', 'high', 'moderate', 'low'].map(s => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`block w-full text-left px-2 py-1 rounded transition-colors ${filterSeverity === s ? 'bg-blue-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
            >
              {s === 'all' ? 'All' : SEVERITY_CONFIG[s].label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowRoads(r => !r)}
          className={`px-3 py-1.5 rounded text-xs border transition-colors ${showRoads ? 'bg-blue-900/60 border-blue-700 text-blue-300' : 'bg-gray-900/95 border-gray-700 text-gray-400'}`}
        >
          {showRoads ? '🛣 Roads ON' : '🛣 Roads OFF'}
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-gray-900/95 border border-gray-700 rounded-lg p-2 text-xs space-y-1">
        <div className="font-semibold text-gray-300 mb-1">Legend</div>
        {Object.entries(SEVERITY_CONFIG).filter(([k]) => k !== 'unknown').map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v.hex }} />
            <span className="text-gray-400">{v.label}</span>
          </div>
        ))}
        <div className="border-t border-gray-700 mt-1 pt-1 space-y-1">
          {Object.entries(ROAD_COLORS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <div className="w-5 h-1 rounded" style={{ backgroundColor: v }} />
              <span className="text-gray-400 capitalize">{k}</span>
            </div>
          ))}
        </div>
      </div>

      {vLoading && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-gray-900/50">
          <LoadingSpinner text="Loading map data..." />
        </div>
      )}

      <MapContainer
        center={[20.93, 85.07]}
        zoom={11}
        className={`w-full ${mapH}`}
        zoomControl={false}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Roads */}
        {showRoads && (roads || []).map(road => (
          <Polyline
            key={road.id}
            positions={[[road.from_lat, road.from_lon], [road.to_lat, road.to_lon]]}
            pathOptions={{
              color: ROAD_COLORS[road.status] || '#6b7280',
              weight: road.road_type === 'national' ? 4 : road.road_type === 'state' ? 3 : 2,
              dashArray: road.status === 'blocked' ? '8, 4' : road.status === 'flooded' ? '4, 4' : null,
              opacity: 0.85,
            }}
          >
            <Popup>
              <div className="text-gray-200 text-xs">
                <div className="font-bold">{road.name}</div>
                <div>Status: <span className="capitalize font-medium" style={{ color: ROAD_COLORS[road.status] }}>{road.status}</span></div>
                <div>Type: {road.road_type}</div>
                <div>Risk: {road.risk_level}</div>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Village markers */}
        {filtered.map(v => (
          <VillageMarker key={v.id} village={v} onClick={handleVillageClick} />
        ))}
      </MapContainer>

      {/* Side panel */}
      {selected && (
        <div className="absolute top-0 right-0 h-full w-80 bg-gray-950/98 border-l border-gray-700 z-[1001] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-gray-800">
            <div>
              <div className="font-bold text-white">{selected.name}</div>
              <div className="text-xs text-gray-500">{selected.block} Block · {selected.district}</div>
            </div>
            <button onClick={() => { setSelected(null); setDetailData(null); setWhyFirst(null) }}
              className="text-gray-500 hover:text-white p-1">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <DemoBadge />

            {loadingDetail ? (
              <LoadingSpinner text="Loading village data..." />
            ) : detailData ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <SeverityBadge severity={detailData.severity} />
                  <PriorityBadge pclass={detailData.rescue_priority_class} />
                </div>

                {/* Disaster types */}
                <div className="text-xs text-gray-400 flex flex-wrap gap-1">
                  {(detailData.disaster_types || []).map(d => (
                    <span key={d} className="bg-gray-800 border border-gray-700 px-2 py-0.5 rounded">
                      {DISASTER_LABELS[d] || d}
                    </span>
                  ))}
                </div>

                {/* Key numbers */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Population', val: selected.population?.toLocaleString() },
                    { label: 'At Risk', val: detailData.people_at_risk?.toLocaleString(), red: true },
                    { label: 'Stranded', val: detailData.people_stranded?.toLocaleString() },
                    { label: 'Medical Emerg.', val: detailData.medical_emergencies, red: detailData.medical_emergencies > 0 },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-900 rounded p-2">
                      <div className="text-[10px] text-gray-500">{item.label}</div>
                      <div className={`text-sm font-bold ${item.red ? 'text-red-400' : 'text-gray-200'}`}>{item.val ?? '—'}</div>
                    </div>
                  ))}
                </div>

                <ConfidenceBar score={detailData.confidence_score} />
                <FogBar score={detailData.information_fog_score} />
                <AccessibilityBar score={detailData.accessibility_score} />

                {/* Communication */}
                {!detailData.has_communication && (
                  <div className="bg-red-900/30 border border-red-700/50 rounded p-2 text-xs text-red-300">
                    ⚠ COMMUNICATION BLACKOUT – No recent contact
                  </div>
                )}

                {/* Last update */}
                <div className="text-xs text-gray-500">
                  Last report: {detailData.last_report_time ? timeAgo(detailData.last_report_time) : 'Unknown'}
                </div>

                {/* Assigned resources */}
                {detailData.assigned_resources?.length > 0 && (
                  <div className="text-xs">
                    <div className="text-gray-500 mb-1">Assigned Resources:</div>
                    {detailData.assigned_resources.map(r => (
                      <span key={r} className="inline-block bg-green-900/40 border border-green-700/50 text-green-300 px-2 py-0.5 rounded mr-1 mb-1">{r}</span>
                    ))}
                  </div>
                )}

                {/* WHY FIRST button */}
                <button
                  onClick={() => handleWhyFirst(selected.id)}
                  className="w-full py-2 text-xs bg-blue-800/60 hover:bg-blue-700/60 border border-blue-600/60 text-blue-300 rounded flex items-center justify-center gap-2 transition-colors"
                >
                  <HelpCircle size={14} /> WHY THIS VILLAGE FIRST?
                </button>

                {whyFirst && (
                  <div className="bg-gray-900 border border-blue-700/40 rounded p-3 text-xs space-y-2">
                    <div className="font-bold text-blue-300">AI Priority Explanation</div>
                    <div className="text-gray-300 italic">"{whyFirst.ai_statement}"</div>
                    <div className="text-gray-400 font-semibold mt-2">Ranked #{whyFirst.priority_rank} of all villages</div>
                    <ol className="space-y-1 text-gray-400 list-decimal list-inside">
                      {(whyFirst.explanation || []).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Timeline */}
                {detailData.timeline?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-400 mb-2">Incident Timeline</div>
                    <div className="space-y-1">
                      {detailData.timeline.slice(0, 6).map((t, i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <span className="text-gray-600 flex-shrink-0">{formatDateTime(t.time)}</span>
                          <span className="text-gray-400">{t.event}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
