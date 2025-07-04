class ApiMonitoringService {
  constructor() {
    this.storageKey = 'crowdpollen_api_monitoring'
    this.initializeStorage()
  }

  initializeStorage() {
    try {
      const existing = localStorage.getItem(this.storageKey)
      if (!existing) {
        const initialData = {
          daily: {},
          hourly: {},
          lastCleanup: Date.now()
        }
        localStorage.setItem(this.storageKey, JSON.stringify(initialData))
      }
    } catch (error) {
      console.warn('Error initializing API monitoring storage:', error)
    }
  }

  getStoredData() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : { daily: {}, hourly: {}, lastCleanup: Date.now() }
    } catch (error) {
      console.warn('Error reading API monitoring data:', error)
      return { daily: {}, hourly: {}, lastCleanup: Date.now() }
    }
  }

  saveData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Error saving API monitoring data:', error)
    }
  }

  cleanupOldData() {
    const data = this.getStoredData()
    const now = Date.now()
    const oneDayAgo = now - (24 * 60 * 60 * 1000)
    const oneHourAgo = now - (60 * 60 * 1000)

    // Clean up daily data older than 7 days
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)
    Object.keys(data.daily).forEach(dateKey => {
      if (parseInt(dateKey) < sevenDaysAgo) {
        delete data.daily[dateKey]
      }
    })

    // Clean up hourly data older than 24 hours
    Object.keys(data.hourly).forEach(hourKey => {
      if (parseInt(hourKey) < oneDayAgo) {
        delete data.hourly[hourKey]
      }
    })

    data.lastCleanup = now
    this.saveData(data)
  }

  recordApiCall(service, endpoint, success = true, responseTime = null, cost = 0) {
    const data = this.getStoredData()
    const now = Date.now()
    const today = new Date().toISOString().split('T')[0]
    const currentHour = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000)

    // Clean up old data periodically
    if (now - data.lastCleanup > (60 * 60 * 1000)) { // Every hour
      this.cleanupOldData()
    }

    // Initialize daily tracking
    if (!data.daily[today]) {
      data.daily[today] = {}
    }
    if (!data.daily[today][service]) {
      data.daily[today][service] = {
        total: 0,
        success: 0,
        errors: 0,
        totalCost: 0,
        avgResponseTime: 0,
        endpoints: {}
      }
    }

    // Initialize hourly tracking
    if (!data.hourly[currentHour]) {
      data.hourly[currentHour] = {}
    }
    if (!data.hourly[currentHour][service]) {
      data.hourly[currentHour][service] = {
        total: 0,
        success: 0,
        errors: 0,
        totalCost: 0,
        endpoints: {}
      }
    }

    // Update daily stats
    const dailyService = data.daily[today][service]
    dailyService.total++
    if (success) {
      dailyService.success++
    } else {
      dailyService.errors++
    }
    dailyService.totalCost += cost

    if (responseTime !== null) {
      const totalResponseTime = dailyService.avgResponseTime * (dailyService.total - 1) + responseTime
      dailyService.avgResponseTime = totalResponseTime / dailyService.total
    }

    if (!dailyService.endpoints[endpoint]) {
      dailyService.endpoints[endpoint] = { total: 0, success: 0, errors: 0 }
    }
    dailyService.endpoints[endpoint].total++
    if (success) {
      dailyService.endpoints[endpoint].success++
    } else {
      dailyService.endpoints[endpoint].errors++
    }

    // Update hourly stats
    const hourlyService = data.hourly[currentHour][service]
    hourlyService.total++
    if (success) {
      hourlyService.success++
    } else {
      hourlyService.errors++
    }
    hourlyService.totalCost += cost

    if (!hourlyService.endpoints[endpoint]) {
      hourlyService.endpoints[endpoint] = { total: 0, success: 0, errors: 0 }
    }
    hourlyService.endpoints[endpoint].total++
    if (success) {
      hourlyService.endpoints[endpoint].success++
    } else {
      hourlyService.endpoints[endpoint].errors++
    }

    this.saveData(data)
  }

  getTodayStats() {
    const data = this.getStoredData()
    const today = new Date().toISOString().split('T')[0]
    return data.daily[today] || {}
  }

  getCurrentHourStats() {
    const data = this.getStoredData()
    const currentHour = Math.floor(Date.now() / (60 * 60 * 1000)) * (60 * 60 * 1000)
    return data.hourly[currentHour] || {}
  }

  getWeeklyStats() {
    const data = this.getStoredData()
    const weeklyStats = {}
    const now = Date.now()
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)

    Object.keys(data.daily).forEach(dateKey => {
      const timestamp = new Date(dateKey).getTime()
      if (timestamp >= sevenDaysAgo) {
        Object.keys(data.daily[dateKey]).forEach(service => {
          if (!weeklyStats[service]) {
            weeklyStats[service] = {
              total: 0,
              success: 0,
              errors: 0,
              totalCost: 0,
              days: 0
            }
          }
          const serviceData = data.daily[dateKey][service]
          weeklyStats[service].total += serviceData.total
          weeklyStats[service].success += serviceData.success
          weeklyStats[service].errors += serviceData.errors
          weeklyStats[service].totalCost += serviceData.totalCost
          weeklyStats[service].days++
        })
      }
    })

    return weeklyStats
  }

  getServiceCosts() {
    return {
      'google-pollen': { perRequest: 0.001, name: 'Google Pollen API' },
      'google-maps': { perRequest: 0.005, name: 'Google Maps API' },
      'google-geolocation': { perRequest: 0.005, name: 'Google Geolocation API' },
      'google-weather': { perRequest: 0.001, name: 'Google Weather API' }
    }
  }

  estimateMonthlyCost() {
    const weeklyStats = this.getWeeklyStats()
    const serviceCosts = this.getServiceCosts()
    let totalMonthlyCost = 0

    Object.keys(weeklyStats).forEach(service => {
      const stats = weeklyStats[service]
      const avgDailyRequests = stats.total / Math.max(stats.days, 1)
      const monthlyRequests = avgDailyRequests * 30
      const costPerRequest = serviceCosts[service]?.perRequest || 0
      totalMonthlyCost += monthlyRequests * costPerRequest
    })

    return {
      totalMonthlyCost,
      breakdown: Object.keys(weeklyStats).map(service => {
        const stats = weeklyStats[service]
        const avgDailyRequests = stats.total / Math.max(stats.days, 1)
        const monthlyRequests = avgDailyRequests * 30
        const costPerRequest = serviceCosts[service]?.perRequest || 0
        const monthlyCost = monthlyRequests * costPerRequest

        return {
          service,
          serviceName: serviceCosts[service]?.name || service,
          avgDailyRequests: Math.round(avgDailyRequests * 100) / 100,
          monthlyRequests: Math.round(monthlyRequests),
          costPerRequest,
          monthlyCost: Math.round(monthlyCost * 100) / 100
        }
      })
    }
  }

  getRecentErrors(hours = 24) {
    const data = this.getStoredData()
    const errors = []
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)

    // Check hourly data for recent errors
    Object.keys(data.hourly).forEach(hourKey => {
      const timestamp = parseInt(hourKey)
      if (timestamp >= cutoff) {
        Object.keys(data.hourly[hourKey]).forEach(service => {
          const serviceData = data.hourly[hourKey][hourKey]
          if (serviceData && serviceData.errors > 0) {
            errors.push({
              timestamp,
              service,
              errors: serviceData.errors,
              total: serviceData.total,
              errorRate: (serviceData.errors / serviceData.total * 100).toFixed(1)
            })
          }
        })
      }
    })

    return errors.sort((a, b) => b.timestamp - a.timestamp)
  }

  exportData() {
    const data = this.getStoredData()
    const todayStats = this.getTodayStats()
    const weeklyStats = this.getWeeklyStats()
    const monthlyCost = this.estimateMonthlyCost()

    return {
      exportDate: new Date().toISOString(),
      rawData: data,
      summary: {
        today: todayStats,
        weekly: weeklyStats,
        monthlyCostEstimate: monthlyCost
      }
    }
  }

  clearAllData() {
    try {
      localStorage.removeItem(this.storageKey)
      this.initializeStorage()
      return true
    } catch (error) {
      console.error('Error clearing API monitoring data:', error)
      return false
    }
  }
}

// Create singleton instance
const apiMonitoringService = new ApiMonitoringService()

export default apiMonitoringService
