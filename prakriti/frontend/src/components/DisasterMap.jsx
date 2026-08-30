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
            className="mt-2 w-full text-xs px-2 py-1 rounded-md transition-colors duration-150"
            style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.30)', color: '#00D4FF' }}
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
    <div
      className={`relative w-full ${mapH} rounded-xl overflow-hidden`}
      style={{ border: '1px solid #243B53' }}
    >
      {/* Map controls */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
        <div
          className="rounded-xl p-2 text-xs space-y-1"
          style={{ background: 'rgba(13,27,42,0.97)', border: '1px solid #243B53' }}
        >
          <div className="font-semibold mb-2" style={{ color: '#94A3B8' }}>Severity Filter</div>
          {['all', 'critical', 'high', 'moderate', 'low'].map(s => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className="block w-full text-left px-2 py-1 rounded transition-all duration-150"
              style={filterSeverity === s
                ? { background: 'rgba(0,212,255,0.15)', color: '#00D4FF', borderLeft: '2px solid #00D4FF' }
                : { color: '#64748B' }
              }
            >
              {s === 'all' ? 'All' : SEVERITY_CONFIG[s].label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowRoads(r => !r)}
          className="px-3 py-1.5 rounded-lg text-xs transition-all duration-150"
          style={showRoads
            ? { background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.30)', color: '#00D4FF' }
            : { background: 'rgba(13,27,42,0.97)', border: '1px solid #243B53', color: '#64748B' }
          }
        >
          {showRoads ? '🛣 Roads ON' : '🛣 Roads OFF'}
        </button>
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-3 left-3 z-[1000] rounded-xl p-2 text-xs space-y-1"
        style={{ background: 'rgba(13,27,42,0.97)', border: '1px solid #243B53' }}
      >
        <div className="font-semibold mb-1" style={{ color: '#94A3B8' }}>Legend</div>
        {Object.entries(SEVERITY_CONFIG).filter(([k]) => k !== 'unknown').map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v.hex }} />
            <span style={{ color: '#64748B' }}>{v.label}</span>
          </div>
        ))}
        <div className="mt-1 pt-1 space-y-1" style={{ borderTop: '1px solid #243B53' }}>
          {Object.entries(ROAD_COLORS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <div className="w-5 h-1 rounded" style={{ backgroundColor: v }} />
              <span className="capitalize" style={{ color: '#64748B' }}>{k}</span>
            </div>
          ))}
        </div>
      </div>

      {vLoading && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center" style={{ background: 'rgba(7,17,31,0.6)' }}>
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
        <div
          className="absolute top-0 right-0 h-full w-80 z-[1001] flex flex-col overflow-hidden"
          style={{ background: '#0D1B2A', borderLeft: '1px solid #243B53' }}
        >
          <div className="flex items-center justify-between p-3" style={{ borderBottom: '1px solid #243B53' }}>
            <div>
              <div className="font-bold" style={{ color: '#F1F5F9' }}>{selected.name}</div>
              <div className="text-xs" style={{ color: '#64748B' }}>{selected.block} Block · {selected.district}</div>
            </div>
            <button
              onClick={() => { setSelected(null); setDetailData(null); setWhyFirst(null) }}
              className="p-1 rounded transition-colors duration-150"
              style={{ color: '#4A5568' }}
              onMouseEnter={e => e.currentTarget.style.color = '#F1F5F9'}
              onMouseLeave={e => e.currentTarget.style.color = '#4A5568'}
            >
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
                <div className="text-xs flex flex-wrap gap-1">
                  {(detailData.disaster_types || []).map(d => (
                    <span
                      key={d}
                      className="px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.20)', color: '#94A3B8' }}
                    >
                      {DISASTER_LABELS[d] || d}
                    </span>
                  ))}
                </div>

                {/* Key numbers */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Population',    val: selected.population?.toLocaleString() },
                    { label: 'At Risk',       val: detailData.people_at_risk?.toLocaleString(), red: true },
                    { label: 'Stranded',      val: detailData.people_stranded?.toLocaleString() },
                    { label: 'Medical Emerg.', val: detailData.medical_emergencies, red: detailData.medical_emergencies > 0 },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg p-2" style={{ background: '#12263A', border: '1px solid #243B53' }}>
                      <div className="text-[10px] mb-0.5" style={{ color: '#4A5568' }}>{item.label}</div>
                      <div
                        className="text-sm font-bold"
                        style={{ color: item.red ? '#FF3B30' : '#F1F5F9' }}
                      >{item.val ?? '—'}</div>
                    </div>
                  ))}
                </div>

                <ConfidenceBar score={detailData.confidence_score} />
                <FogBar score={detailData.information_fog_score} />
                <AccessibilityBar score={detailData.accessibility_score} />

                {/* Communication */}
                {!detailData.has_communication && (
                  <div
                    className="rounded-lg p-2 text-xs"
                    style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.25)', color: '#FF3B30' }}
                  >
                    ⚠ COMMUNICATION BLACKOUT – No recent contact
                  </div>
                )}

                {/* Last update */}
                <div className="text-xs" style={{ color: '#4A5568' }}>
                  Last report: {detailData.last_report_time ? timeAgo(detailData.last_report_time) : 'Unknown'}
                </div>

                {/* Assigned resources */}
                {detailData.assigned_resources?.length > 0 && (
                  <div className="text-xs">
                    <div className="mb-1" style={{ color: '#4A5568' }}>Assigned Resources:</div>
                    {detailData.assigned_resources.map(r => (
                      <span
                        key={r}
                        className="inline-block px-2 py-0.5 rounded-full mr-1 mb-1"
                        style={{ background: 'rgba(48,209,88,0.10)', border: '1px solid rgba(48,209,88,0.25)', color: '#30D158' }}
                      >{r}</span>
                    ))}
                  </div>
                )}

                {/* WHY FIRST button */}
                <button
                  onClick={() => handleWhyFirst(selected.id)}
                  className="w-full py-2 text-xs rounded-lg flex items-center justify-center gap-2 transition-all duration-150"
                  style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,212,255,0.08)'}
                >
                  <HelpCircle size={14} /> WHY THIS VILLAGE FIRST?
                </button>

                {whyFirst && (
                  <div
                    className="rounded-lg p-3 text-xs space-y-2"
                    style={{ background: '#12263A', border: '1px solid rgba(0,212,255,0.20)' }}
                  >
                    <div className="font-bold" style={{ color: '#00D4FF' }}>AI Priority Explanation</div>
                    <div className="italic" style={{ color: '#F1F5F9' }}>"{whyFirst.ai_statement}"</div>
                    <div className="font-semibold mt-2" style={{ color: '#94A3B8' }}>Ranked #{whyFirst.priority_rank} of all villages</div>
                    <ol className="space-y-1 list-decimal list-inside" style={{ color: '#94A3B8' }}>
                      {(whyFirst.explanation || []).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Timeline */}
                {detailData.timeline?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2" style={{ color: '#94A3B8' }}>Incident Timeline</div>
                    <div className="space-y-1">
                      {detailData.timeline.slice(0, 6).map((t, i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <span className="flex-shrink-0" style={{ color: '#4A5568' }}>{formatDateTime(t.time)}</span>
                          <span style={{ color: '#94A3B8' }}>{t.event}</span>
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
