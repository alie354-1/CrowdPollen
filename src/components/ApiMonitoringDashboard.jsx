import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Activity, 
  Clock, 
  Download,
  RefreshCw,
  Trash2
} from 'lucide-react'
import apiMonitoringService from '../services/apiMonitoringService'

export default function ApiMonitoringDashboard() {
  const [todayStats, setTodayStats] = useState({})
  const [weeklyStats, setWeeklyStats] = useState({})
  const [monthlyCost, setMonthlyCost] = useState({ totalMonthlyCost: 0, breakdown: [] })
  const [recentErrors, setRecentErrors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setIsLoading(true)
    try {
      setTodayStats(apiMonitoringService.getTodayStats())
      setWeeklyStats(apiMonitoringService.getWeeklyStats())
      setMonthlyCost(apiMonitoringService.estimateMonthlyCost())
      setRecentErrors(apiMonitoringService.getRecentErrors(24))
      setLastRefresh(Date.now())
    } catch (error) {
      console.error('Error loading monitoring data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = () => {
    try {
      const data = apiMonitoringService.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `api-monitoring-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export monitoring data')
    }
  }

  const clearData = () => {
    if (confirm('Are you sure you want to clear all API monitoring data? This cannot be undone.')) {
      if (apiMonitoringService.clearAllData()) {
        loadData()
        alert('API monitoring data cleared successfully')
      } else {
        alert('Failed to clear monitoring data')
      }
    }
  }

  const getServiceIcon = (service) => {
    switch (service) {
      case 'google-pollen': return '🌸'
      case 'google-maps': return '🗺️'
      case 'google-geolocation': return '📍'
      case 'google-weather': return '🌤️'
      default: return '🔧'
    }
  }

  const getServiceColor = (service) => {
    switch (service) {
      case 'google-pollen': return 'text-pink-600 bg-pink-50'
      case 'google-maps': return 'text-blue-600 bg-blue-50'
      case 'google-geolocation': return 'text-orange-600 bg-orange-50'
      case 'google-weather': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount)
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "text-blue-600 bg-blue-50" }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )

  const ServiceCard = ({ service, data, isWeekly = false }) => {
    const successRate = data.total > 0 ? ((data.success / data.total) * 100).toFixed(1) : '0'
    const avgDaily = isWeekly ? (data.total / Math.max(data.days || 1, 1)).toFixed(1) : null

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <span className="text-2xl mr-2">{getServiceIcon(service)}</span>
            <div>
              <h4 className="font-medium text-gray-900 capitalize">
                {service.replace('google-', '').replace('-', ' ')}
              </h4>
              <p className="text-sm text-gray-500">
                {isWeekly ? `${data.days || 0} days` : 'Today'}
              </p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceColor(service)}`}>
            {successRate}% success
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Total Requests</p>
            <p className="font-semibold text-gray-900">{data.total}</p>
          </div>
          <div>
            <p className="text-gray-500">Errors</p>
            <p className="font-semibold text-red-600">{data.errors}</p>
          </div>
          {avgDaily && (
            <div>
              <p className="text-gray-500">Avg/Day</p>
              <p className="font-semibold text-gray-900">{avgDaily}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Cost</p>
            <p className="font-semibold text-green-600">{formatCurrency(data.totalCost)}</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-500">Loading monitoring data...</span>
        </div>
      </div>
    )
  }

  const totalTodayRequests = Object.values(todayStats).reduce((sum, service) => sum + service.total, 0)
  const totalTodayErrors = Object.values(todayStats).reduce((sum, service) => sum + service.errors, 0)
  const totalTodayCost = Object.values(todayStats).reduce((sum, service) => sum + service.totalCost, 0)
  const overallSuccessRate = totalTodayRequests > 0 ? (((totalTodayRequests - totalTodayErrors) / totalTodayRequests) * 100).toFixed(1) : '100'

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
            API Monitoring Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {formatTime(lastRefresh)}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadData}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </button>
          <button
            onClick={exportData}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
          <button
            onClick={clearData}
            className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </button>
        </div>
      </div>

      {/* Today's Overview */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Requests"
            value={totalTodayRequests}
            icon={Activity}
            color="text-blue-600 bg-blue-50"
          />
          <StatCard
            title="Success Rate"
            value={`${overallSuccessRate}%`}
            icon={TrendingUp}
            color="text-green-600 bg-green-50"
          />
          <StatCard
            title="Errors"
            value={totalTodayErrors}
            icon={AlertTriangle}
            color="text-red-600 bg-red-50"
          />
          <StatCard
            title="Cost Today"
            value={formatCurrency(totalTodayCost)}
            icon={DollarSign}
            color="text-green-600 bg-green-50"
          />
        </div>

        {/* Today's Services */}
        {Object.keys(todayStats).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(todayStats).map(([service, data]) => (
              <ServiceCard key={service} service={service} data={data} />
            ))}
          </div>
        )}
      </div>

      {/* Weekly Overview */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Overview</h3>
        {Object.keys(weeklyStats).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(weeklyStats).map(([service, data]) => (
              <ServiceCard key={service} service={service} data={data} isWeekly={true} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No weekly data available yet</p>
          </div>
        )}
      </div>

      {/* Monthly Cost Estimate */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Cost Estimate</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                {formatCurrency(monthlyCost.totalMonthlyCost)}
              </h4>
              <p className="text-sm text-gray-500">Estimated monthly cost</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>

          {monthlyCost.breakdown.length > 0 && (
            <div className="space-y-3">
              <h5 className="font-medium text-gray-700">Breakdown by Service</h5>
              {monthlyCost.breakdown.map((item) => (
                <div key={item.service} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{getServiceIcon(item.service)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{item.serviceName}</p>
                      <p className="text-sm text-gray-500">
                        {item.avgDailyRequests}/day avg • {formatCurrency(item.costPerRequest)}/request
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(item.monthlyCost)}</p>
                    <p className="text-sm text-gray-500">{item.monthlyRequests} req/month</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Errors */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Errors (24h)</h3>
        {recentErrors.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {recentErrors.slice(0, 10).map((error, index) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-50 rounded-lg mr-3">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {error.service.replace('google-', '').replace('-', ' ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTime(error.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{error.errors} errors</p>
                    <p className="text-sm text-gray-500">{error.errorRate}% error rate</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-green-50 rounded-lg p-8 text-center">
            <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-green-700 font-medium">No errors in the last 24 hours!</p>
            <p className="text-green-600 text-sm">All APIs are running smoothly</p>
          </div>
        )}
      </div>
    </div>
  )
}
