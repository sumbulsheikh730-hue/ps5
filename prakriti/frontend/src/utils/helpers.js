// Shared utility helpers

export const SEVERITY_CONFIG = {
  critical: { color: 'text-red-400', bg: 'bg-red-900/40', border: 'border-red-700/50', dot: 'bg-red-500', label: '🔴 Critical', hex: '#ef4444' },
  high:     { color: 'text-orange-400', bg: 'bg-orange-900/40', border: 'border-orange-700/50', dot: 'bg-orange-500', label: '🟠 High', hex: '#f97316' },
  moderate: { color: 'text-yellow-400', bg: 'bg-yellow-900/40', border: 'border-yellow-700/50', dot: 'bg-yellow-500', label: '🟡 Moderate', hex: '#eab308' },
  low:      { color: 'text-green-400', bg: 'bg-green-900/40', border: 'border-green-700/50', dot: 'bg-green-500', label: '🟢 Low', hex: '#22c55e' },
  unknown:  { color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-600', dot: 'bg-gray-500', label: '⬜ Unknown', hex: '#6b7280' },
}

export const PRIORITY_CONFIG = {
  P1: { color: 'text-red-400', bg: 'bg-red-900/40', border: 'border-red-600', label: 'P1 – Immediate Rescue' },
  P2: { color: 'text-orange-400', bg: 'bg-orange-900/40', border: 'border-orange-600', label: 'P2 – Urgent' },
  P3: { color: 'text-yellow-400', bg: 'bg-yellow-900/40', border: 'border-yellow-600', label: 'P3 – Required' },
  P4: { color: 'text-green-400', bg: 'bg-green-900/40', border: 'border-green-600', label: 'P4 – Monitor' },
}

export const SOURCE_LABELS = {
  citizen: { label: 'Citizen', color: 'text-blue-300', icon: '👤' },
  official: { label: 'Official', color: 'text-green-300', icon: '🏛' },
  police: { label: 'Police', color: 'text-blue-400', icon: '👮' },
  social_media: { label: 'Social Media', color: 'text-purple-300', icon: '📱' },
  satellite: { label: 'Satellite', color: 'text-cyan-300', icon: '🛰' },
  sensor: { label: 'Sensor', color: 'text-teal-300', icon: '📡' },
  unknown: { label: 'Unknown', color: 'text-gray-400', icon: '❓' },
}

export const DISASTER_LABELS = {
  flood: '🌊 Flood',
  landslide: '⛰ Landslide',
  cyclone: '🌀 Cyclone',
  earthquake: '🔺 Earthquake',
  building_collapse: '🏚 Collapse',
  fire: '🔥 Fire',
  road_failure: '🛣 Road Failure',
  industrial: '🏭 Industrial',
}

export const RESOURCE_ICONS = {
  boat: '🚣',
  ambulance: '🚑',
  medical_team: '⚕',
  excavator: '🔧',
  rescue_personnel: '👷',
  relief_truck: '🚛',
}

export function fogColor(score) {
  if (score >= 70) return 'text-red-400'
  if (score >= 50) return 'text-orange-400'
  if (score >= 30) return 'text-yellow-400'
  return 'text-green-400'
}

export function fogBg(score) {
  if (score >= 70) return 'bg-red-500'
  if (score >= 50) return 'bg-orange-500'
  if (score >= 30) return 'bg-yellow-500'
  return 'bg-green-500'
}

export function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  } catch { return ts }
}

export function formatDateTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return ts }
}

export function timeAgo(ts) {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
