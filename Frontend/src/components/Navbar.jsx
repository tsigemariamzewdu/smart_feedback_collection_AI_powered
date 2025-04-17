"use client"

import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const Navbar = () => {
  const { isAuthenticated, isChef, logout } = useAuth()

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800">
              FoodFeedback
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/menu" className="text-gray-600 hover:text-gray-900">
              Menu
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/orders" className="text-gray-600 hover:text-gray-900">
                  My Orders
                </Link>

                {isChef && (
                  <Link to="/chef-dashboard" className="text-gray-600 hover:text-gray-900">
                    Chef Dashboard
                  </Link>
                )}

                <button onClick={logout} className="text-gray-600 hover:text-gray-900">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900">
                  Login
                </Link>
                <Link to="/register" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
