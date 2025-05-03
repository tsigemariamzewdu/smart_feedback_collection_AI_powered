"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../services/api"
import toast from "react-hot-toast"

const FeedbackForm = () => {
  const [order, setOrder] = useState(null)
  const [formData, setFormData] = useState({
    items: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedItem, setSelectedItem] = useState(0) // For mobile view

  const { orderId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${orderId}`)
        setOrder(response.data)

        // Initialize item ratings with emoji reactions
        setFormData({
          items: response.data.items.map((item) => ({
            menuItemId: item.menuItem._id,
            name: item.menuItem.name,
            rating: 3, // Default to 3 stars (neutral)
            comment: "",
            image: item.menuItem.image || '/placeholder-food.jpg',
            emojiReaction: "😐" // Default neutral emoji
          })),
        })

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching order:", error)
        toast.error("Failed to load order details")
        navigate("/orders")
      }
    }

    fetchOrder()
  }, [orderId, navigate])

  const handleItemRatingChange = (index, value) => {
    const updatedItems = [...formData.items]
    const rating = Number.parseInt(value)
    
    // Set emoji based on rating
    let emoji;
    if (rating === 1) emoji = "🤮";
    else if (rating === 2) emoji = "😕";
    else if (rating === 3) emoji = "😐";
    else if (rating === 4) emoji = "😋";
    else emoji = "🤩";
    
    updatedItems[index] = {
      ...updatedItems[index],
      rating,
      emojiReaction: emoji
    }
    
    setFormData({
      items: updatedItems
    })
  }

  const handleItemCommentChange = (index, value) => {
    const updatedItems = [...formData.items]
    updatedItems[index].comment = value
    setFormData({
      items: updatedItems
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      await api.post("/feedback", {
        orderId, // Make sure this is passed from props/params
        items: formData.items.map(item => ({
          menuItemId: item.menuItemId,
          rating: item.rating,
          comment: item.comment
        }))
      });
      toast.success("🍽️ Thanks for your tasty feedback!");
      navigate("/orders");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("🔥 Oops, something burned in the kitchen!");
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">🍳</div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Heating up your order details...</p>
        </div>
      </div>
    )
  }

  if (order.feedback) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-green-100">
          <div className="text-6xl mb-4">🥰</div>
          <h1 className="text-2xl font-bold mb-4">Feedback Already Served!</h1>
          <p className="text-gray-600 mb-6">
            You've already shared your thoughts on this delicious order.
          </p>
          <button
            onClick={() => navigate("/orders")}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-all transform hover:scale-105"
          >
            Back to My Orders
          </button>
        </div>
      </div>
    )
  }

  // Emoji rating scale
  const emojiRatings = [
    { emoji: "🤮", label: "Terrible" },
    { emoji: "😕", label: "Meh" },
    { emoji: "😐", label: "Okay" },
    { emoji: "😋", label: "Yummy" },
    { emoji: "🤩", label: "Amazing!" }
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          How was your meal? <span className="text-3xl">🍽️</span>
        </h1>
        <p className="text-gray-600">
          Rate each dish to help our chefs improve their recipes!
        </p>
      </div>

      {/* Mobile item selector */}
      <div className="md:hidden mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Dish to Rate:
        </label>
        <select
          onChange={(e) => setSelectedItem(Number(e.target.value))}
          className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
        >
          {formData.items.map((item, index) => (
            <option key={index} value={index}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Order Summary - Desktop */}
        <div className="hidden md:block md:w-1/3 bg-white p-6 rounded-2xl shadow-md border border-gray-100 h-fit sticky top-4">
          <h2 className="font-bold text-lg mb-4 flex items-center">
            <span className="mr-2">📝</span> Order Summary
          </h2>
          <div className="mb-4">
            <p className="text-sm text-gray-500">Order #</p>
            <p className="font-mono font-medium">
              {order._id.substring(order._id.length - 6).toUpperCase()}
            </p>
          </div>
          
          <h3 className="font-medium mb-2">Your Dishes:</h3>
          <ul className="space-y-3">
            {formData.items.map((item, index) => (
              <li 
                key={index}
                onClick={() => setSelectedItem(index)}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${selectedItem === index ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg mr-3"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = '/placeholder-food.jpg'
                    }}
                  />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.emojiReaction} {item.rating}/5
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Feedback Form */}
        <div className="md:w-2/3">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            {/* Current Item Feedback */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <img 
                  src={formData.items[selectedItem].image} 
                  alt={formData.items[selectedItem].name}
                  className="w-16 h-16 object-cover rounded-xl mr-4"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = '/placeholder-food.jpg'
                  }}
                />
                <div>
                  <h2 className="text-xl font-bold">
                    {formData.items[selectedItem].name}
                  </h2>
                  <div className="text-2xl">
                    {formData.items[selectedItem].emojiReaction}
                  </div>
                </div>
              </div>

              {/* Emoji Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How would you rate this dish?
                </label>
                <div className="flex justify-between">
                  {emojiRatings.map((rating, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleItemRatingChange(selectedItem, i + 1)}
                      className={`flex flex-col items-center p-2 rounded-full transition-all ${formData.items[selectedItem].rating === i + 1 ? 'bg-orange-100 scale-110' : 'hover:bg-gray-50'}`}
                    >
                      <span className="text-3xl mb-1">{rating.emoji}</span>
                      <span className="text-xs text-gray-600">{rating.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label htmlFor={`comment-${selectedItem}`} className="block text-sm font-medium text-gray-700 mb-2">
                  Your thoughts on this dish
                </label>
                <textarea
                  id={`comment-${selectedItem}`}
                  value={formData.items[selectedItem].comment}
                  onChange={(e) => handleItemCommentChange(selectedItem, e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="What did you love? Anything we could improve? (Optional)"
                ></textarea>
              </div>
            </div>

            {/* Navigation for mobile */}
            <div className="md:hidden flex justify-between mb-6">
              <button
                type="button"
                onClick={() => setSelectedItem(Math.max(0, selectedItem - 1))}
                disabled={selectedItem === 0}
                className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
              >
                ← Previous
              </button>
              <span className="self-center text-sm text-gray-500">
                {selectedItem + 1} of {formData.items.length}
              </span>
              <button
                type="button"
                onClick={() => setSelectedItem(Math.min(formData.items.length - 1, selectedItem + 1))}
                disabled={selectedItem === formData.items.length - 1}
                className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
              >
                Next →
              </button>
            </div>

            {/* Submit Button */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/orders")}
                className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium rounded-lg transition-colors"
              >
                Skip Feedback
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-full shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-70 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit All Feedback <span className="ml-2">🚀</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Progress indicator */}
          <div className="mt-6 text-center text-sm text-gray-500">
            {formData.items.filter(item => item.rating !== 3).length} of {formData.items.length} dishes rated
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeedbackForm