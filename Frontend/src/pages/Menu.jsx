"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"

const Menu = () => {
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [cart, setCart] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [customizingItem, setCustomizingItem] = useState(null)
  const [specialRequest, setSpecialRequest] = useState("")
  const [removedIngredients, setRemovedIngredients] = useState([])

  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await api.get("/menu")
        setMenuItems(response.data)
        const uniqueCategories = [...new Set(response.data.map((item) => item.category))]
        setCategories(uniqueCategories)
        setIsLoading(false)
      } catch (error) {
        toast.error("Failed to load menu items")
        setIsLoading(false)
      }
    }

    fetchMenu()
  }, [])

  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem._id === item._id)

    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem._id === item._id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      )
    } else {
      setCart([
        ...cart,
        {
          ...item,
          quantity: 1,
          removedIngredients: [],
          specialRequest: ""
        }
      ])
    }

    toast.success(`Added ${item.name} to cart`)
  }

  const addCustomizedToCart = () => {
    if (!customizingItem) return

    const customizedItem = {
      ...customizingItem,
      quantity: 1,
      removedIngredients,
      specialRequest
    }

    const existingIndex = cart.findIndex(item => item._id === customizedItem._id)

    if (existingIndex >= 0) {
      setCart(cart.map((item, index) => index === existingIndex ? customizedItem : item))
    } else {
      setCart([...cart, customizedItem])
    }

    setCustomizingItem(null)
    setRemovedIngredients([])
    setSpecialRequest("")
    toast.success(`Added customized ${customizingItem.name} to cart`)
  }

  const removeFromCart = (itemId) => {
    setCart(cart.filter((item) => item._id !== itemId))
  }

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return
    setCart(cart.map((item) => (item._id === itemId ? { ...item, quantity: newQuantity } : item)))
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const placeOrder = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to place an order")
      navigate("/login")
      return
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty")
      return
    }

    setIsPlacingOrder(true)

    try {
      const orderData = {
        items: cart.map((item) => ({
          menuItem: item._id,
          quantity: item.quantity,
          priceAtOrder: item.price,
          removedIngredients: item.removedIngredients || [],
          specialRequest: item.specialRequest || ""
        })),
        total: calculateTotal(),
      }

      const response = await api.post("/orders", orderData)

      if (response.data.success) {
        toast.success("Order placed successfully!")
        setCart([])
        navigate(`/orders/${response.data.orderId}`)
      } else {
        throw new Error(response.data.message || "Failed to place order")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to place order")
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const toggleIngredient = (ingredient) => {
    setRemovedIngredients(prev =>
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    )
  }

  const filteredItems =
    selectedCategory === "all" ? menuItems : menuItems.filter((item) => item.category === selectedCategory)

  if (isLoading) {
    return <div className="text-center py-8">Loading menu...</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4">
      {customizingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Customize {customizingItem.name}</h3>

            <div className="mb-4">
              <label className="block font-medium mb-2">Special Instructions</label>
              <textarea
                className="w-full p-2 border rounded"
                placeholder="E.g. No salt, extra sauce..."
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
              />
            </div>

            {customizingItem.ingredients?.length > 0 && (
              <div className="mb-4">
                <label className="block font-medium mb-2">Remove Ingredients</label>
                <div className="space-y-2">
                  {customizingItem.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`ing-${index}`}
                        checked={!removedIngredients.includes(ingredient)}
                        onChange={() => toggleIngredient(ingredient)}
                        className="mr-2"
                      />
                      <label htmlFor={`ing-${index}`}>{ingredient}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setCustomizingItem(null)
                  setRemovedIngredients([])
                  setSpecialRequest("")
                }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={addCustomizedToCart}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold mb-6">Our Menu</h1>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full ${
              selectedCategory === "all" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-800"
            }`}
          >
            All
          </button>

          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === category ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-800"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map((item) => (
            <div key={item._id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="h-48 rounded-md mb-4 overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "https://via.placeholder.com/300x200?text=No+Image"
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                    No Image Available
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>

              {item.ingredients?.length > 0 && (
                <p className="text-xs text-gray-500 mb-2">
                  Ingredients: {item.ingredients.join(", ")}
                </p>
              )}

              <div className="flex justify-between items-center mt-4">
                <span className="font-bold">${item.price.toFixed(2)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => addToCart(item)}
                    className="bg-orange-600 text-white px-3 py-1 rounded-md hover:bg-orange-700 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setCustomizingItem(item)
                      setRemovedIngredients([])
                      setSpecialRequest("")
                    }}
                    className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-md hover:bg-orange-200 transition-colors"
                  >
                    Customize
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md h-fit sticky top-4">
        <h2 className="text-xl font-bold mb-4">Your Order</h2>

        {cart.length === 0 ? (
          <p className="text-gray-500">Your cart is empty</p>
        ) : (
          <>
            <div className="divide-y">
              {cart.map((item) => (
                <div key={item._id} className="py-3">
                  <div className="flex justify-between">
                    <h4 className="font-medium">{item.name}</h4>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>

                  <div className="flex items-center mt-1">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="bg-gray-200 text-gray-800 w-6 h-6 rounded-full hover:bg-gray-300 transition-colors"
                    >
                      -
                    </button>
                    <span className="mx-2">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="bg-gray-200 text-gray-800 w-6 h-6 rounded-full hover:bg-gray-300 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {item.removedIngredients?.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Removed: {item.removedIngredients.join(", ")}
                    </p>
                  )}

                  {item.specialRequest && (
                    <p className="text-xs text-gray-500 mt-1">
                      Note: {item.specialRequest}
                    </p>
                  )}

                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="text-red-500 text-sm mt-1 hover:text-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>

              <button
                onClick={placeOrder}
                disabled={isPlacingOrder}
                className="w-full bg-orange-600 text-white py-2 rounded-md mt-4 hover:bg-orange-700 disabled:bg-orange-400 transition-colors"
              >
                {isPlacingOrder ? "Processing..." : "Place Order"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Menu
