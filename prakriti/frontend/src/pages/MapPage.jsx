import DisasterMap from '../components/DisasterMap.jsx'
import { DemoBadge } from '../components/SharedComponents.jsx'

export default function MapPage() {
  return (
    <div className="h-full flex flex-col p-3 gap-2">
      <div className="flex items-center gap-3 flex-shrink-0">
        <h1 className="text-base font-bold text-white">Live Disaster Map</h1>
        <DemoBadge />
        <span className="text-xs text-gray-500">Suvarnapur District · Click a village for details</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <DisasterMap fullscreen />
      </div>
    </div>
  )
}
