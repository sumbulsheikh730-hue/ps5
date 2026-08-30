// Shared utility helpers

// ── Severity config — exact PRAKRITI hex palette ──────────
export const SEVERITY_CONFIG = {
  critical: {
    color:  'text-[#FF6B63]',
    bg:     'bg-[#FF3B30]/12',
    border: 'border-[#FF3B30]/25',
    dot:    'bg-[#FF3B30]',
    label:  '🔴 Critical',
    hex:    '#FF3B30',
  },
  high: {
    color:  'text-[#FFB340]',
    bg:     'bg-[#FF9500]/12',
    border: 'border-[#FF9500]/25',
    dot:    'bg-[#FF9500]',
    label:  '🟠 High',
    hex:    '#FF9500',
  },
  moderate: {
    color:  'text-[#FFE234]',
    bg:     'bg-[#FFD60A]/12',
    border: 'border-[#FFD60A]/25',
    dot:    'bg-[#FFD60A]',
    label:  '🟡 Moderate',
    hex:    '#FFD60A',
  },
  low: {
    color:  'text-[#5EE47C]',
    bg:     'bg-[#30D158]/12',
    border: 'border-[#30D158]/25',
    dot:    'bg-[#30D158]',
    label:  '🟢 Low',
    hex:    '#30D158',
  },
  unknown: {
    color:  'text-slate-400',
    bg:     'bg-slate-500/10',
    border: 'border-slate-500/20',
    dot:    'bg-slate-500',
    label:  '⬜ Unknown',
    hex:    '#64748B',
  },
}

// ── Priority config ────────────────────────────────────────
export const PRIORITY_CONFIG = {
  P1: { color: 'text-[#FF6B63]', bg: 'bg-[#FF3B30]/12', border: 'border-[#FF3B30]/25', label: 'P1 – Immediate Rescue' },
  P2: { color: 'text-[#FFB340]', bg: 'bg-[#FF9500]/12', border: 'border-[#FF9500]/25', label: 'P2 – Urgent' },
  P3: { color: 'text-[#FFE234]', bg: 'bg-[#FFD60A]/12', border: 'border-[#FFD60A]/25', label: 'P3 – Required' },
  P4: { color: 'text-[#5EE47C]', bg: 'bg-[#30D158]/12', border: 'border-[#30D158]/25', label: 'P4 – Monitor' },
}

// ── Source labels ──────────────────────────────────────────
export const SOURCE_LABELS = {
  citizen:      { label: 'Citizen',      color: 'text-[#00D4FF]',  icon: '👤' },
  official:     { label: 'Official',     color: 'text-[#00BFA6]',  icon: '🏛'  },
  police:       { label: 'Police',       color: 'text-[#60A5FA]',  icon: '👮' },
  social_media: { label: 'Social Media', color: 'text-[#A855F7]',  icon: '📱' },
  satellite:    { label: 'Satellite',    color: 'text-[#00D4FF]',  icon: '🛰'  },
  sensor:       { label: 'Sensor',       color: 'text-[#00BFA6]',  icon: '📡' },
  unknown:      { label: 'Unknown',      color: 'text-slate-400',  icon: '❓' },
}

// ── Disaster labels ────────────────────────────────────────
export const DISASTER_LABELS = {
  flood:             '🌊 Flood',
  landslide:         '⛰ Landslide',
  cyclone:           '🌀 Cyclone',
  earthquake:        '🔺 Earthquake',
  building_collapse: '🏚 Collapse',
  fire:              '🔥 Fire',
  road_failure:      '🛣 Road Failure',
  industrial:        '🏭 Industrial',
}

// ── Resource icons ─────────────────────────────────────────
export const RESOURCE_ICONS = {
  boat:             '🚣',
  ambulance:        '🚑',
  medical_team:     '⚕',
  excavator:        '🔧',
  rescue_personnel: '👷',
  relief_truck:     '🚛',
}

// ── Information Fog color helpers ──────────────────────────
// Uses PRAKRITI fog color (#A855F7) at high uncertainty,
// grading through amber → yellow → green as fog clears
export function fogColor(score) {
  if (score >= 70) return 'text-[#C084FC]'   // high fog – purple
  if (score >= 50) return 'text-[#FFB340]'   // medium – amber
  if (score >= 30) return 'text-[#FFE234]'   // low – yellow
  return 'text-[#5EE47C]'                    // clear – green
}

export function fogBg(score) {
  if (score >= 70) return 'bg-[#A855F7]'     // purple
  if (score >= 50) return 'bg-[#FF9F0A]'     // amber
  if (score >= 30) return 'bg-[#FFD60A]'     // yellow
  return 'bg-[#30D158]'                      // green
}

// ── Date formatting ────────────────────────────────────────
export function formatTime(ts) {
  if (!ts) return '—'
  try { return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }
  catch { return ts }
}

export function formatDateTime(ts) {
  if (!ts) return '—'
  try { return new Date(ts).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return ts }
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
