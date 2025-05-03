"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../services/api"
import toast from "react-hot-toast"

const FeedbackForm = () => {
  const [order, setOrder] = useState(null)
  const [formData, setFormData] = useState({
    rating: 5,
    comment: "",
    items: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { orderId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${orderId}`)
        setOrder(response.data)

        // Initialize item ratings
        setFormData((prev) => ({
          ...prev,
          items: response.data.items.map((item) => ({
            menuItemId: item.menuItem._id,
            name: item.menuItem.name,
            rating: 5,
            comment: "",
          })),
        }))

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching order:", error)
        toast.error("Failed to load order details")
        navigate("/orders")
      }
    }

    fetchOrder()
  }, [orderId, navigate])

  const handleRatingChange = (e) => {
    setFormData({
      ...formData,
      rating: Number.parseInt(e.target.value),
    })
  }

  const handleCommentChange = (e) => {
    setFormData({
      ...formData,
      comment: e.target.value,
    })
  }

  const handleItemRatingChange = (index, value) => {
    const updatedItems = [...formData.items]
    updatedItems[index].rating = Number.parseInt(value)
    setFormData({
      ...formData,
      items: updatedItems,
    })
  }

  const handleItemCommentChange = (index, value) => {
    const updatedItems = [...formData.items]
    updatedItems[index].comment = value
    setFormData({
      ...formData,
      items: updatedItems,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await api.post("/feedback", formData)
      toast.success("Thank you for your feedback!")
      navigate("/orders")
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast.error("Failed to submit feedback")
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (order.feedback) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8">
        <h1 className="text-2xl font-bold mb-4">Feedback Already Submitted</h1>
        <p className="text-gray-600 mb-6">You have already provided feedback for this order.</p>
        <button
          onClick={() => navigate("/orders")}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Back to Orders
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Share Your Feedback</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-2">Order #{order._id.substring(order._id.length - 6)}</h2>
        <ul className="mb-4">
          {order.items.map((item, index) => (
            <li key={index} className="py-2">
              {item.quantity} x {item.menuItem.name}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Overall Experience</h2>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">How would you rate your overall experience?</label>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <label key={num} className="flex items-center">
                  <input
                    type="radio"
                    name="rating"
                    value={num}
                    checked={formData.rating === num}
                    onChange={handleRatingChange}
                    className="mr-1"
                  />
                  {num}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="comment" className="block text-gray-700 mb-2">
              Additional Comments
            </label>
            <textarea
              id="comment"
              value={formData.comment}
              onChange={handleCommentChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Tell us more about your experience..."
            ></textarea>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Item Feedback</h2>

          {formData.items.map((item, index) => (
            <div key={index} className="border-b pb-4 mb-4 last:border-0">
              <h3 className="font-medium mb-2">{item.name}</h3>

              <div className="mb-3">
                <label className="block text-gray-700 mb-2">How would you rate this item?</label>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <label key={num} className="flex items-center">
                      <input
                        type="radio"
                        name={`item-rating-${index}`}
                        value={num}
                        checked={item.rating === num}
                        onChange={(e) => handleItemRatingChange(index, e.target.value)}
                        className="mr-1"
                      />
                      {num}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Comments about this item</label>
                <textarea
                  value={item.comment}
                  onChange={(e) => handleItemCommentChange(index, e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="What did you like or dislike about this item?"
                ></textarea>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default FeedbackForm
