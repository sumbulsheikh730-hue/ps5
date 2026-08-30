import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

api.interceptors.response.use(
  r => r,
  err => {
    console.error('API Error:', err?.response?.data || err.message)
    return Promise.reject(err)
  }
)

export const getDashboardSummary = () => api.get('/dashboard/summary')
export const getActivityFeed = (limit = 20) => api.get(`/dashboard/activity?limit=${limit}`)
export const getAlerts = () => api.get('/dashboard/alerts')
export const getAnalytics = () => api.get('/dashboard/analytics')

export const getVillages = () => api.get('/villages')
export const getVillage = (id) => api.get(`/villages/${id}`)
export const getWhyFirst = (id) => api.get(`/villages/${id}/why-first`)

export const getReports = (villageId) => api.get(villageId ? `/reports?village_id=${villageId}` : '/reports')
export const getContradictions = () => api.get('/reports/contradictions')
export const submitReport = (formData) => api.post('/reports', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

export const getResources = () => api.get('/resources')
export const getResourceRecommendations = () => api.get('/resources/recommendations')
export const deployResource = (resourceId, villageId) =>
  api.post(`/resources/${resourceId}/deploy?village_id=${villageId}`)
export const returnResource = (resourceId) => api.post(`/resources/${resourceId}/return`)
export const simulateWhatIf = (resourceId, fromVillageId, toVillageId) =>
  api.post(`/resources/simulate-whatif?resource_id=${resourceId}&from_village_id=${fromVillageId || ''}&to_village_id=${toVillageId}`)

export const getRoads = () => api.get('/routes')
export const getRecommendedRoutes = (vehicleType, targetVillage) =>
  api.get(`/routes/recommended?vehicle_type=${vehicleType}${targetVillage ? `&target_village_id=${targetVillage}` : ''}`)

export const assessDamage = (formData) => api.post('/ai/assess-damage', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const compareBeforeAfter = (formData) => api.post('/ai/compare-before-after', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

export const startSimulation = () => api.post('/simulation/start')
export const getSimulationStatus = () => api.get('/simulation/status')
export const resetSimulation = () => api.post('/simulation/reset')

export default api
