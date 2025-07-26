import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [location, setLocation] = useState("New York");
  const [weather, setWeather] = useState(null);
  const [cropSuggestions, setCropSuggestions] = useState([]);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [crops, setCrops] = useState([]);

  // Fetch weather and crop suggestions
  const fetchWeatherAndSuggestions = async () => {
    setLoading(true);
    try {
      // Get weather
      const weatherResponse = await axios.post(`${API}/weather`, { location });
      setWeather(weatherResponse.data);

      // Get crop suggestions
      const suggestionsResponse = await axios.post(`${API}/crop-suggestions`, { location });
      setCropSuggestions(suggestionsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  // Ask AI Assistant
  const askAI = async () => {
    if (!aiQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/ai-assistant`, { question: aiQuery });
      setAiResponse(response.data.answer);
    } catch (error) {
      console.error('Error asking AI:', error);
    }
    setLoading(false);
  };

  // Load crops
  const loadCrops = async () => {
    try {
      const response = await axios.get(`${API}/crops`);
      setCrops(response.data);
    } catch (error) {
      console.error('Error loading crops:', error);
    }
  };

  useEffect(() => {
    fetchWeatherAndSuggestions();
    loadCrops();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img 
                src="https://images.unsplash.com/photo-1720071702672-d18c69cb475c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxmYXJtaW5nJTIwdGVjaG5vbG9neXxlbnwwfHx8Z3JlZW58MTc1MzU0NDQyNHww&ixlib=rb-4.1.0&q=85" 
                alt="Agriculture AI" 
                className="h-12 w-12 rounded-full object-cover mr-4"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AgriSmart AI</h1>
                <p className="text-sm text-gray-600">Your AI-Powered Agriculture Assistant</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`${activeTab === "dashboard" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500 hover:text-gray-700"} pb-2`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("crops")}
                className={`${activeTab === "crops" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500 hover:text-gray-700"} pb-2`}
              >
                My Crops
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`${activeTab === "ai" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500 hover:text-gray-700"} pb-2`}
              >
                AI Assistant
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="absolute inset-0">
                <img
                  src="https://images.unsplash.com/photo-1492496913980-501348b61469?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZXxlbnwwfHx8Z3JlZW58MTc1MzU0NDQxN3ww&ixlib=rb-4.1.0&q=85"
                  alt="Agriculture"
                  className="w-full h-full object-cover opacity-20"
                />
              </div>
              <div className="relative px-8 py-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Smart Farming Starts Here
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Get AI-powered crop suggestions based on real-time weather data
                </p>
                
                {/* Location Input */}
                <div className="flex flex-col sm:flex-row gap-4 max-w-md">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter your location"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={fetchWeatherAndSuggestions}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                  >
                    {loading ? "Loading..." : "Get Suggestions"}
                  </button>
                </div>
              </div>
            </div>

            {/* Weather Card */}
            {weather && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">Current Weather</h3>
                  <img
                    src="https://images.unsplash.com/photo-1471289660181-7feae98d61ae?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwzfHxhZ3JpY3VsdHVyZXxlbnwwfHx8Z3JlZW58MTc1MzU0NDQxN3ww&ixlib=rb-4.1.0&q=85"
                    alt="Weather"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{weather.temperature}°C</p>
                    <p className="text-sm text-gray-600">Temperature</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{weather.humidity}%</p>
                    <p className="text-sm text-gray-600">Humidity</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-lg font-semibold text-yellow-600 capitalize">{weather.description}</p>
                    <p className="text-sm text-gray-600">Conditions</p>
                  </div>
                </div>
              </div>
            )}

            {/* Crop Suggestions */}
            {cropSuggestions.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1529313780224-1a12b68bed16?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxhZ3JpY3VsdHVyZXxlbnwwfHx8Z3JlZW58MTc1MzU0NDQxN3ww&ixlib=rb-4.1.0&q=85"
                    alt="Crops"
                    className="h-12 w-12 rounded-full object-cover mr-4"
                  />
                  <h3 className="text-2xl font-bold text-gray-900">Recommended Crops</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cropSuggestions.map((crop, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="text-lg font-semibold text-green-700 mb-2">{crop.crop_name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{crop.reason}</p>
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        {crop.season}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Assistant Tab */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">AI Agriculture Assistant</h3>
              
              {/* Query Input */}
              <div className="space-y-4">
                <textarea
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Ask me anything about farming, crops, weather, soil, pest control..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none h-24"
                />
                <button
                  onClick={askAI}
                  disabled={loading || !aiQuery.trim()}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {loading ? "Thinking..." : "Ask AI"}
                </button>
              </div>

              {/* AI Response */}
              {aiResponse && (
                <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">AI Assistant Response:</h4>
                  <div className="prose text-gray-700 whitespace-pre-wrap">
                    {aiResponse}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Crops Tab */}
        {activeTab === "crops" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">My Crop Records</h3>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Add New Crop
                </button>
              </div>
              
              {crops.length === 0 ? (
                <div className="text-center py-12">
                  <img
                    src="https://images.unsplash.com/photo-1564417947365-8dbc9d0e718e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHw0fHxhZ3JpY3VsdHVyZXxlbnwwfHx8Z3JlZW58MTc1MzU0NDQxN3ww&ixlib=rb-4.1.0&q=85"
                    alt="No crops"
                    className="h-32 w-32 rounded-full object-cover mx-auto mb-4"
                  />
                  <p className="text-gray-500 text-lg">No crops recorded yet. Start by adding your first crop!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {crops.map((crop) => (
                    <div key={crop.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-green-700 mb-2">{crop.crop_name}</h4>
                      <p className="text-sm text-gray-600 mb-1">Location: {crop.location}</p>
                      <p className="text-sm text-gray-600 mb-1">Status: {crop.status}</p>
                      <p className="text-sm text-gray-600">{crop.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p>&copy; 2025 AgriSmart AI. Empowering farmers with AI technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;