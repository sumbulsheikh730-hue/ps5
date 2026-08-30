import DisasterMap from '../components/DisasterMap.jsx'
import { DemoBadge } from '../components/SharedComponents.jsx'

export default function MapPage() {
  return (
    <div className="h-full flex flex-col p-3 gap-2" style={{ background: '#07111F' }}>
      <div className="flex items-center gap-3 flex-shrink-0">
        <h1 className="text-base font-bold" style={{ color: '#F1F5F9' }}>Live Disaster Map</h1>
        <DemoBadge />
        <span className="text-xs" style={{ color: '#64748B' }}>Suvarnapur District · Click a village for details</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <DisasterMap fullscreen />
      </div>
    </div>
  )
}
