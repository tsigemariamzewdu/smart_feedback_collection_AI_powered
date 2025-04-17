"use client"

import { useState, useEffect } from "react"
import api from "../services/api"
import toast from "react-hot-toast"

const ChefDashboard = () => {
  const [feedbacks, setFeedbacks] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [selectedItem, setSelectedItem] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalFeedbacks: 0,
    averageRating: 0,
    itemStats: {},
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all feedback
        const feedbackResponse = await api.get("/feedback")
        setFeedbacks(feedbackResponse.data)

        // Fetch menu items
        const menuResponse = await api.get("/menu")
        setMenuItems(menuResponse.data)

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast.error("Failed to load dashboard data")
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Calculate statistics based on feedbacks
    if (feedbacks.length > 0) {
      const totalFeedbacks = feedbacks.length
      const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0)
      const averageRating = totalRating / totalFeedbacks

      // Calculate per-item statistics
      const itemStats = {}

      feedbacks.forEach((feedback) => {
        feedback.items.forEach((item) => {
          if (!itemStats[item.menuItemId]) {
            itemStats[item.menuItemId] = {
              name: item.name,
              totalRating: 0,
              count: 0,
              comments: [],
            }
          }

          itemStats[item.menuItemId].totalRating += item.rating
          itemStats[item.menuItemId].count += 1

          if (item.comment) {
            itemStats[item.menuItemId].comments.push({
              rating: item.rating,
              comment: item.comment,
              date: feedback.createdAt,
            })
          }
        })
      })

      // Calculate average ratings for each item
      Object.keys(itemStats).forEach((itemId) => {
        const item = itemStats[itemId]
        item.averageRating = item.totalRating / item.count
      })

      setStats({
        totalFeedbacks,
        averageRating,
        itemStats,
      })
    }
  }, [feedbacks])

  const filteredFeedbacks =
    selectedItem === "all"
      ? feedbacks
      : feedbacks.filter((feedback) => feedback.items.some((item) => item.menuItemId === selectedItem))

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading dashboard...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Chef Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Total Feedback</h2>
          <p className="text-3xl font-bold">{stats.totalFeedbacks}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Average Rating</h2>
          <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}/5</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Most Rated Item</h2>
          {Object.keys(stats.itemStats).length > 0 ? (
            <p className="text-xl font-bold">
              {Object.values(stats.itemStats).sort((a, b) => b.count - a.count)[0]?.name || "N/A"}
            </p>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Item Ratings</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Item</th>
                <th className="text-center py-3 px-4">Average Rating</th>
                <th className="text-center py-3 px-4">Feedback Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(stats.itemStats)
                .sort((a, b) => b.averageRating - a.averageRating)
                .map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 px-4">{item.name}</td>
                    <td className="text-center py-3 px-4">{item.averageRating.toFixed(1)}/5</td>
                    <td className="text-center py-3 px-4">{item.count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Feedback History</h2>

        <div className="mb-4">
          <label htmlFor="itemFilter" className="block text-gray-700 mb-2">
            Filter by Item:
          </label>
          <select
            id="itemFilter"
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Items</option>
            {menuItems.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {filteredFeedbacks.length === 0 ? (
          <p className="text-gray-500">No feedback available for the selected filter.</p>
        ) : (
          <div className="space-y-4">
            {filteredFeedbacks.map((feedback) => (
              <div key={feedback._id} className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex justify-between mb-2">
                  <div>
                    <span className="font-medium">Order #{feedback.order.substring(feedback.order.length - 6)}</span>
                    <span className="text-gray-500 ml-2">{formatDate(feedback.createdAt)}</span>
                  </div>
                  <div className="font-bold">{feedback.rating}/5</div>
                </div>

                {feedback.comment && <p className="text-gray-700 mb-3">{feedback.comment}</p>}

                <div className="border-t pt-3">
                  <h3 className="font-medium mb-2">Item Feedback:</h3>
                  <ul className="space-y-2">
                    {feedback.items.map((item, index) => (
                      <li key={index} className="text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{item.name}</span>
                          <span>{item.rating}/5</span>
                        </div>
                        {item.comment && <p className="text-gray-600 mt-1">{item.comment}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChefDashboard
