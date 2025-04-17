import { Link } from "react-router-dom"
import { FaUtensils, FaRegStar, FaChartLine, FaArrowRight, FaHeart, FaCommentAlt } from "react-icons/fa"
import { MdRestaurantMenu, MdDeliveryDining, MdFeedback } from "react-icons/md"

const Home = () => {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <div className="w-full bg-gradient-to-r from-green-600 to-green-800 text-white py-16 px-4 rounded-lg mb-16">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-5xl font-bold mb-4">Delicious Food, Valuable Feedback</h1>
            <p className="text-xl mb-8 opacity-90">
              Experience our amazing dishes and help us improve by sharing your thoughts. Your feedback shapes our menu!
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/menu"
                className="bg-white text-green-700 px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-100 flex items-center gap-2 transition-all transform hover:translate-y-[-2px]"
              >
                <MdRestaurantMenu size={20} />
                Browse Menu
              </Link>
              <Link
                to="/register"
                className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-white hover:text-green-700 flex items-center gap-2 transition-all transform hover:translate-y-[-2px]"
              >
                Create Account
                <FaArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-72 h-72 bg-white rounded-full overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                alt="Delicious Food" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="w-full max-w-5xl mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md text-center hover:shadow-xl transition-all transform hover:translate-y-[-5px]">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdRestaurantMenu size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Order Food</h3>
            <p className="text-gray-600">Browse our diverse menu and order your favorite dishes with just a few clicks.</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md text-center hover:shadow-xl transition-all transform hover:translate-y-[-5px]">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdDeliveryDining size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Enjoy Your Meal</h3>
            <p className="text-gray-600">Receive your delicious food and savor every bite of our chef's creations.</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md text-center hover:shadow-xl transition-all transform hover:translate-y-[-5px]">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdFeedback size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Share Feedback</h3>
            <p className="text-gray-600">Let us know what you think about your meal to help us improve our offerings.</p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full bg-gray-50 py-16 px-4 mb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose FoodFeedback</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4 items-start">
              <div className="bg-green-100 p-3 rounded-full">
                <FaUtensils className="text-green-600 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Quality Ingredients</h3>
                <p className="text-gray-600">We use only the freshest, highest-quality ingredients in all our dishes.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="bg-green-100 p-3 rounded-full">
                <FaRegStar className="text-green-600 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Customer-Driven Menu</h3>
                <p className="text-gray-600">Our menu evolves based on your feedback and preferences.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="bg-green-100 p-3 rounded-full">
                <FaHeart className="text-green-600 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Made with Love</h3>
                <p className="text-gray-600">Our chefs put their heart and soul into every dish they prepare.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="bg-green-100 p-3 rounded-full">
                <FaChartLine className="text-green-600 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Continuous Improvement</h3>
                <p className="text-gray-600">We're always looking for ways to enhance your dining experience.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="w-full max-w-5xl mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md relative">
            <div className="absolute -top-4 left-6 bg-green-600 text-white p-2 rounded-full">
              <FaCommentAlt />
            </div>
            <div className="pt-4">
              <p className="text-gray-600 italic mb-4">"The pasta was absolutely delicious! I love how they took my feedback and adjusted the seasoning to perfection."</p>
              <p className="font-semibold">- Sarah Johnson</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md relative">
            <div className="absolute -top-4 left-6 bg-green-600 text-white p-2 rounded-full">
              <FaCommentAlt />
            </div>
            <div className="pt-4">
              <p className="text-gray-600 italic mb-4">"I appreciate how the chef personally responded to my feedback. It shows they really care about customer satisfaction."</p>
              <p className="font-semibold">- Michael Brown</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md relative">
            <div className="absolute -top-4 left-6 bg-green-600 text-white p-2 rounded-full">
              <FaCommentAlt />
            </div>
            <div className="pt-4">
              <p className="text-gray-600 italic mb-4">"The new menu items they added based on customer suggestions are amazing! This is truly a customer-focused restaurant."</p>
              <p className="font-semibold">- Emily Davis</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full bg-green-600 text-white py-12 px-4 rounded-lg mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Experience Our Food?</h2>
          <p className="text-xl mb-8 opacity-90">Join our community of food lovers and help shape our menu with your valuable feedback.</p>
          <Link
            to="/menu"
            className="bg-white text-green-700 px-8 py-4 rounded-md text-lg font-bold hover:bg-gray-100 inline-flex items-center gap-2 transition-all transform hover:translate-y-[-2px]"
          >
            Order Now <FaArrowRight />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home
