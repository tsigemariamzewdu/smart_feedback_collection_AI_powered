"use client"

import { useEffect, useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Bar, Line, Radar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
  PointElement,
  LineElement,
  RadialLinearScale,
} from "chart.js"
import {
  Download,
  TrendingUp,
  TrendingDown,
  Star,
  ChefHat,
  UtensilsCrossed,
  RefreshCw,
  BarChart3,
  Clock,
  Users,
} from "lucide-react"
import api from "../services/api"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
  PointElement,
  LineElement,
  RadialLinearScale,
)

const AdminAnalysis = () => {
  const { isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [dateRange, setDateRange] = useState("30")
  const [refreshing, setRefreshing] = useState(false)

  // Chart color schemes
  const colorSchemes = {
    primary: ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"],
    success: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
    warning: ["#f59e0b", "#fbbf24", "#fcd34d", "#fde68a"],
    danger: ["#ef4444", "#f87171", "#fca5a5", "#fecaca"],
    info: ["#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe"],
  }

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate("/")
      return
    }
    fetchAnalytics()
  }, [isAuthenticated, isAdmin, navigate, dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await api.get(`/feedback/analytics/admin?days=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAnalytics(response.data)
    } catch (error) {
      toast.error("Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
    toast.success("Analytics refreshed!")
  }

  const exportData = () => {
    if (!analytics) return

    const dataStr = JSON.stringify(analytics, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `analytics-${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()

    toast.success("Analytics data exported!")
  }

  // Memoized chart data
  const chartData = useMemo(() => {
    if (!analytics) return {}

    return {
      foodRatings: {
        labels: analytics.foodRatings?.map((f) => f.name) || [],
        datasets: [
          {
            label: "Average Rating",
            data: analytics.foodRatings?.map((f) => f.averageRating) || [],
            backgroundColor: colorSchemes.primary,
            borderColor: colorSchemes.primary[0],
            borderWidth: 2,
            borderRadius: 8,
          },
        ],
      },
      chefPerformance: {
        labels: analytics.chefPerformance?.map((c) => c.chefName) || [],
        datasets: [
          {
            label: "Average Rating",
            data: analytics.chefPerformance?.map((c) => c.averageRating) || [],
            backgroundColor: colorSchemes.success,
            borderColor: colorSchemes.success[0],
            borderWidth: 2,
            borderRadius: 8,
          },
        ],
      },
      trendData: {
        labels: analytics.trends?.map((t) => t.date) || [],
        datasets: [
          {
            label: "Average Rating",
            data: analytics.trends?.map((t) => t.averageRating) || [],
            borderColor: colorSchemes.primary[0],
            backgroundColor: colorSchemes.primary[0] + "20",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Order Count",
            data: analytics.trends?.map((t) => t.orderCount) || [],
            borderColor: colorSchemes.info[0],
            backgroundColor: colorSchemes.info[0] + "20",
            tension: 0.4,
            fill: true,
            yAxisID: "y1",
          },
        ],
      },
      orderVolume: {
        labels: analytics.foodOrders?.map((f) => f.name) || [],
        datasets: [
          {
            label: "Order Count",
            data: analytics.foodOrders?.map((f) => f.orderCount) || [],
            backgroundColor: colorSchemes.info,
            borderColor: colorSchemes.info[0],
            borderWidth: 2,
            borderRadius: 8,
          },
        ],
      },
    }
  }, [analytics])

  if (!isAuthenticated || !isAdmin) return null

  if (loading) {
    return <LoadingSkeleton />
  }

  if (!analytics) {
    return <ErrorState onRetry={fetchAnalytics} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Restaurant Analytics</h1>
              <p className="text-gray-600">Key performance metrics and customer feedback analysis</p>
            </div>

            <div className="flex items-center gap-4 mt-4 lg:mt-0">
              {/* Date Range Filter */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
              </select>

              {/* Action Buttons */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>

              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <MetricCard
            title="Total Reviews"
            value={analytics.totalReviews || 0}
            icon={<Star className="text-yellow-500" />}
            trend={analytics.reviewsTrend || 0}
            color="yellow"
          />
          <MetricCard
            title="Average Rating"
            value={analytics.overallRating?.toFixed(1) || "0.0"}
            icon={<TrendingUp className="text-green-500" />}
            trend={analytics.ratingTrend || 0}
            color="green"
          />
          <MetricCard
            title="Active Chefs"
            value={analytics.activeChefs || 0}
            icon={<ChefHat className="text-blue-500" />}
            trend={analytics.chefsTrend || 0}
            color="blue"
          />
          <MetricCard
            title="Menu Items"
            value={analytics.totalMenuItems || 0}
            icon={<UtensilsCrossed className="text-purple-500" />}
            trend={analytics.menuTrend || 0}
            color="purple"
          />
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Food Performance */}
          <ChartCard title="Top Rated Menu Items" icon={<UtensilsCrossed size={20} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800">Most Popular</h4>
                <p className="text-2xl font-bold text-green-600">{analytics.mostLikedFood?.name}</p>
                <p className="text-sm text-green-600">★ {analytics.mostLikedFood?.averageRating?.toFixed(1)}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <h4 className="font-semibold text-red-800">Needs Improvement</h4>
                <p className="text-2xl font-bold text-red-600">{analytics.mostHatedFood?.name}</p>
                <p className="text-sm text-red-600">★ {analytics.mostHatedFood?.averageRating?.toFixed(1)}</p>
              </div>
            </div>
            <Bar
              data={chartData.foodRatings}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    titleColor: "white",
                    bodyColor: "white",
                    borderColor: colorSchemes.primary[0],
                    borderWidth: 1,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 5,
                    grid: { color: "rgba(0, 0, 0, 0.1)" },
                  },
                  x: {
                    grid: { display: false },
                  },
                },
              }}
            />
          </ChartCard>

          {/* Chef Performance */}
          <ChartCard title="Chef Performance" icon={<ChefHat size={20} />}>
            <Radar
              data={{
                labels: analytics.chefPerformance?.map((c) => c.chefName) || [],
                datasets: [
                  {
                    label: "Performance Rating",
                    data: analytics.chefPerformance?.map((c) => c.averageRating) || [],
                    backgroundColor: colorSchemes.success[0] + "20",
                    borderColor: colorSchemes.success[0],
                    borderWidth: 2,
                    pointBackgroundColor: colorSchemes.success[0],
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: colorSchemes.success[0],
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 5,
                    ticks: { display: false },
                    grid: { color: "rgba(0, 0, 0, 0.1)" },
                  },
                },
              }}
            />
          </ChartCard>

          {/* Order Trends */}
          <ChartCard title="Performance Trends" icon={<TrendingUp size={20} />} className="lg:col-span-2">
            <Line
              data={chartData.trendData}
              options={{
                responsive: true,
                interaction: {
                  mode: "index",
                  intersect: false,
                },
                plugins: {
                  legend: {
                    position: "top",
                  },
                  tooltip: {
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    titleColor: "white",
                    bodyColor: "white",
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                  },
                  y: {
                    type: "linear",
                    display: true,
                    position: "left",
                    max: 5,
                    grid: { color: "rgba(0, 0, 0, 0.1)" },
                  },
                  y1: {
                    type: "linear",
                    display: true,
                    position: "right",
                    grid: { drawOnChartArea: false },
                  },
                },
              }}
            />
          </ChartCard>

          {/* Order Volume */}
          <ChartCard title="Menu Item Popularity" icon={<Users size={20} />} className="lg:col-span-2">
            <Bar
              data={chartData.orderVolume}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    titleColor: "white",
                    bodyColor: "white",
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: "rgba(0, 0, 0, 0.1)" },
                  },
                  x: {
                    grid: { display: false },
                  },
                },
              }}
            />
          </ChartCard>
        </div>
      </div>
    </div>
  )
}

// Metric Card Component
const MetricCard = ({ title, value, icon, trend, color }) => {
  const colorClasses = {
    yellow: "border-yellow-200 bg-yellow-50",
    green: "border-green-200 bg-green-50",
    blue: "border-blue-200 bg-blue-50",
    purple: "border-purple-200 bg-purple-50",
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-6 rounded-xl border-2 ${colorClasses[color]} backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-full bg-white shadow-sm">{icon}</div>
      </div>
      <div className="flex items-center mt-4">
        {trend >= 0 ? (
          <TrendingUp size={16} className="text-green-500 mr-1" />
        ) : (
          <TrendingDown size={16} className="text-red-500 mr-1" />
        )}
        <span className={`text-sm font-medium ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
          {Math.abs(trend)}%
        </span>
        <span className="text-sm text-gray-500 ml-1">vs last period</span>
      </div>
    </motion.div>
  )
}

// Chart Card Component
const ChartCard = ({ title, icon, children, className = "" }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    className={`bg-white rounded-xl shadow-lg p-6 border border-gray-200 ${className}`}
  >
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        {icon}
        {title}
      </h3>
    </div>
    {children}
  </motion.div>
)

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
    <div className="max-w-7xl mx-auto">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-96 bg-gray-300 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

// Error State Component
const ErrorState = ({ onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl mb-4">📊</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Analytics</h3>
      <p className="text-gray-600 mb-6">There was an error loading the analytics data.</p>
      <button
        onClick={onRetry}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
)

export default AdminAnalysis