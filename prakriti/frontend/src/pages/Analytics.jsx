import { useApi } from '../hooks/useApi.js'
import { getAnalytics } from '../services/api.js'
import { LoadingSpinner, ErrorBanner, DemoBadge } from '../components/SharedComponents.jsx'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'

const DARK_TOOLTIP = {
  contentStyle: { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' },
  labelStyle: { color: '#9ca3af' },
}

const SEVERITY_COLORS = { critical: '#ef4444', high: '#f97316', moderate: '#eab308', low: '#22c55e', unknown: '#6b7280' }
const SOURCE_COLORS = { satellite: '#06b6d4', official: '#22c55e', police: '#3b82f6', citizen: '#8b5cf6', social_media: '#ec4899', sensor: '#14b8a6' }
const PRIORITY_COLORS = { P1: '#ef4444', P2: '#f97316', P3: '#eab308', P4: '#22c55e' }

const CHART_LABELS = {
  flood: 'Flood', landslide: 'Landslide', cyclone: 'Cyclone',
  building_collapse: 'Collapse', road_failure: 'Road Fail.', earthquake: 'Earthquake',
}

export default function Analytics() {
  const { data, loading, error } = useApi(getAnalytics)

  if (loading) return <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="p-4"><ErrorBanner error={error} /></div>
  if (!data) return null

  const severityData = Object.entries(data.severity_distribution || {}).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1), value: v, fill: SEVERITY_COLORS[k]
  })).filter(d => d.value > 0)

  const disasterData = Object.entries(data.disaster_type_distribution || {}).map(([k, v]) => ({
    name: CHART_LABELS[k] || k, count: v
  }))

  const populationData = Object.entries(data.population_at_risk_by_block || {}).map(([k, v]) => ({
    block: k, population: v
  }))

  const fogData = (data.information_fog_scores || []).map(f => ({
    name: f.village.length > 10 ? f.village.slice(0, 10) + '…' : f.village,
    fog: Math.round(f.fog)
  }))

  const priorityData = Object.entries(data.priority_distribution || {}).map(([k, v]) => ({
    name: k, value: v, fill: PRIORITY_COLORS[k]
  })).filter(d => d.value > 0)

  const sourceData = Object.entries(data.report_source_distribution || {}).map(([k, v]) => ({
    name: k.replace('_', ' '), value: v, fill: SOURCE_COLORS[k] || '#6b7280'
  }))

  const verifiedData = [
    { name: 'Verified', value: data.verified_vs_unverified?.verified || 0, fill: '#22c55e' },
    { name: 'Unverified', value: data.verified_vs_unverified?.unverified || 0, fill: '#ef4444' },
  ]

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-white">Analytics & Intelligence Overview</h1>
        <DemoBadge />
      </div>

      {/* Row 1: Severity + Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Severity Distribution" sub="Active incidents by severity level">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {severityData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip {...DARK_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Rescue Priority Distribution" sub="Villages by priority class">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                {priorityData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip {...DARK_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Disaster types + Population */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Disasters by Type" sub="Number of affected villages per disaster type">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={disasterData} margin={{ bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Population at Risk by Block" sub="Estimated people at risk per administrative block">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={populationData} margin={{ bottom: 20 }}>
              <XAxis dataKey="block" tick={{ fill: '#9ca3af', fontSize: 11 }} angle={-20} textAnchor="end" />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip {...DARK_TOOLTIP} formatter={v => v?.toLocaleString()} />
              <Bar dataKey="population" fill="#f97316" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Information Fog + Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Information Fog Score" sub="Higher = more uncertainty about situation (top 10 villages)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fogData} layout="vertical" margin={{ left: 60, right: 20 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} width={70} />
              <Tooltip {...DARK_TOOLTIP} formatter={v => `${v}%`} />
              <Bar dataKey="fog" radius={[0, 3, 3, 0]}>
                {fogData.map((d, i) => <Cell key={i} fill={d.fog >= 70 ? '#ef4444' : d.fog >= 50 ? '#f97316' : '#eab308'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Reports by Source" sub="Distribution of report sources">
          <div className="grid grid-cols-2 gap-2 h-full">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                  {sourceData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip {...DARK_TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col justify-center gap-1">
              {sourceData.map(s => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.fill }} />
                  <span className="text-gray-400 capitalize">{s.name}</span>
                  <span className="ml-auto text-gray-300 font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Row 4: Verified vs Unverified */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="Verified vs Unverified Reports" sub="Report verification status">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={verifiedData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label={({ name, value }) => `${name}: ${value}`}>
                {verifiedData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip {...DARK_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="md:col-span-2 bg-gray-900/60 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Evidence Confidence vs Fog Score</h3>
          <p className="text-xs text-gray-500 mb-3">
            High fog + low confidence = areas needing immediate satellite/ground verification.
            Low fog + high confidence = well-documented situation.
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { label: 'Best documented', desc: 'Rampur – Satellite + Police + Citizen confirmation', conf: '91%', fog: '22%' },
              { label: 'Highest uncertainty', desc: 'Shilapur – No reports at all (information blackout)', conf: '0%', fog: '95%' },
              { label: 'Contradiction zone', desc: 'Krishnanagar – Conflicting claims active', conf: '72%', fog: '48%' },
              { label: 'Remote/silent zone', desc: 'Kurumundi – Partial dropped call only', conf: '18%', fog: '88%' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-950 rounded p-3">
                <div className="text-gray-300 font-semibold mb-1">{item.label}</div>
                <div className="text-gray-500">{item.desc}</div>
                <div className="flex gap-3 mt-2">
                  <span className="text-green-400">Conf: {item.conf}</span>
                  <span className="text-orange-400">Fog: {item.fog}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, sub, children }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      {sub && <p className="text-xs text-gray-500 mb-3">{sub}</p>}
      {children}
    </div>
  )
}
