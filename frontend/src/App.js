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
  
  // New state for enhanced features
  const [marketPrices, setMarketPrices] = useState([]);
  const [yieldPrediction, setYieldPrediction] = useState(null);
  const [soilAnalysis, setSoilAnalysis] = useState(null);
  const [yieldForm, setYieldForm] = useState({
    crop_name: "corn",
    location: "New York",
    planting_date: new Date().toISOString().split('T')[0],
    field_size: 10
  });
  const [soilForm, setSoilForm] = useState({
    ph_level: 6.5,
    nitrogen: 25,
    phosphorus: 20,
    potassium: 150,
    organic_matter: 3.0,
    soil_type: "Loamy",
    location: "New York"
  });

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

  // Fetch market prices
  const fetchMarketPrices = async () => {
    try {
      const response = await axios.get(`${API}/market-prices`);
      setMarketPrices(response.data);
    } catch (error) {
      console.error('Error fetching market prices:', error);
    }
  };

  // Predict yield
  const predictYield = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/yield-prediction`, {
        ...yieldForm,
        planting_date: new Date(yieldForm.planting_date).toISOString()
      });
      setYieldPrediction(response.data);
    } catch (error) {
      console.error('Error predicting yield:', error);
    }
    setLoading(false);
  };

  // Analyze soil
  const analyzeSoil = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/soil-analysis`, soilForm);
      setSoilAnalysis(response.data);
    } catch (error) {
      console.error('Error analyzing soil:', error);
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
    fetchMarketPrices();
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
                <h1 className="text-2xl font-bold text-gray-900">AgriSmart AI Pro</h1>
                <p className="text-sm text-gray-600">Complete Farm Management & Analytics Platform</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-6">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`${activeTab === "dashboard" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500 hover:text-gray-700"} pb-2 px-2`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("yield")}
                className={`${activeTab === "yield" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500 hover:text-gray-700"} pb-2 px-2`}
              >
                Yield Prediction
              </button>
              <button
                onClick={() => setActiveTab("market")}
                className={`${activeTab === "market" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500 hover:text-gray-700"} pb-2 px-2`}
              >
                Market Prices
              </button>
              <button
                onClick={() => setActiveTab("soil")}
                className={`${activeTab === "soil" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500 hover:text-gray-700"} pb-2 px-2`}
              >
                Soil Analysis
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`${activeTab === "ai" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500 hover:text-gray-700"} pb-2 px-2`}
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
                  Advanced Farm Analytics & AI
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Complete farm management with AI-powered insights, yield predictions, market analysis & soil health monitoring
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
                    {loading ? "Loading..." : "Update Data"}
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
                  <h3 className="text-2xl font-bold text-gray-900">AI Crop Recommendations</h3>
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

        {/* Yield Prediction Tab */}
        {activeTab === "yield" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">🌾 AI Yield Prediction</h3>
              
              {/* Yield Prediction Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Crop Type</label>
                  <select
                    value={yieldForm.crop_name}
                    onChange={(e) => setYieldForm({...yieldForm, crop_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="corn">Corn</option>
                    <option value="wheat">Wheat</option>
                    <option value="soybeans">Soybeans</option>
                    <option value="rice">Rice</option>
                    <option value="tomatoes">Tomatoes</option>
                    <option value="potatoes">Potatoes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={yieldForm.location}
                    onChange={(e) => setYieldForm({...yieldForm, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Planting Date</label>
                  <input
                    type="date"
                    value={yieldForm.planting_date}
                    onChange={(e) => setYieldForm({...yieldForm, planting_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Field Size (acres)</label>
                  <input
                    type="number"
                    value={yieldForm.field_size}
                    onChange={(e) => setYieldForm({...yieldForm, field_size: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <button
                onClick={predictYield}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {loading ? "Calculating..." : "Predict Yield"}
              </button>

              {/* Yield Prediction Results */}
              {yieldPrediction && (
                <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">📈 Yield Prediction Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <p className="text-3xl font-bold text-green-600">{yieldPrediction.predicted_yield}</p>
                      <p className="text-sm text-gray-600">Total Tons</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <p className="text-3xl font-bold text-blue-600">{yieldPrediction.confidence_score}%</p>
                      <p className="text-sm text-gray-600">Confidence</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <p className="text-xl font-bold text-purple-600">{yieldPrediction.crop_name}</p>
                      <p className="text-sm text-gray-600">Crop Type</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Key Factors:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Weather: {yieldPrediction.factors.weather_impact}</li>
                      <li>• Field Size: {yieldPrediction.factors.field_size}</li>
                      <li>• Timing: {yieldPrediction.factors.seasonal_timing}</li>
                      <li>• Location: {yieldPrediction.factors.location_suitability}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market Prices Tab */}
        {activeTab === "market" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">💰 Agricultural Market Prices</h3>
                <button
                  onClick={fetchMarketPrices}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Refresh Prices
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {marketPrices.map((price, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 capitalize">{price.commodity}</h4>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        price.market_trend === 'rising' ? 'bg-green-100 text-green-800' :
                        price.market_trend === 'falling' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {price.market_trend}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      ${price.current_price}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{price.unit}</div>
                    <div className={`text-sm font-medium ${
                      price.change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {price.change_percent >= 0 ? '↗' : '↘'} {Math.abs(price.change_percent).toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>

              {marketPrices.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Click "Refresh Prices" to load current market data</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Soil Analysis Tab */}
        {activeTab === "soil" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">🌱 Soil Health Analysis</h3>
              
              {/* Soil Analysis Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">pH Level</label>
                  <input
                    type="number"
                    step="0.1"
                    value={soilForm.ph_level}
                    onChange={(e) => setSoilForm({...soilForm, ph_level: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="6.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nitrogen (ppm)</label>
                  <input
                    type="number"
                    value={soilForm.nitrogen}
                    onChange={(e) => setSoilForm({...soilForm, nitrogen: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phosphorus (ppm)</label>
                  <input
                    type="number"
                    value={soilForm.phosphorus}
                    onChange={(e) => setSoilForm({...soilForm, phosphorus: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Potassium (ppm)</label>
                  <input
                    type="number"
                    value={soilForm.potassium}
                    onChange={(e) => setSoilForm({...soilForm, potassium: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organic Matter (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={soilForm.organic_matter}
                    onChange={(e) => setSoilForm({...soilForm, organic_matter: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="3.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Soil Type</label>
                  <select
                    value={soilForm.soil_type}
                    onChange={(e) => setSoilForm({...soilForm, soil_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Clay">Clay</option>
                    <option value="Loamy">Loamy</option>
                    <option value="Sandy">Sandy</option>
                    <option value="Silty">Silty</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={soilForm.location}
                  onChange={(e) => setSoilForm({...soilForm, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Farm location"
                />
              </div>
              
              <button
                onClick={analyzeSoil}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {loading ? "Analyzing..." : "Analyze Soil"}
              </button>

              {/* Soil Analysis Results */}
              {soilAnalysis && (
                <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-yellow-50 rounded-lg">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">🌱 Soil Health Report</h4>
                  
                  {/* Health Score */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="text-center p-6 bg-white rounded-full shadow-lg">
                      <div className="text-4xl font-bold text-green-600">{soilAnalysis.health_score}</div>
                      <div className="text-sm text-gray-600">Health Score</div>
                    </div>
                  </div>

                  {/* Soil Parameters */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="font-bold text-blue-600">{soilAnalysis.ph_level}</div>
                      <div className="text-xs text-gray-600">pH Level</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="font-bold text-green-600">{soilAnalysis.nitrogen}</div>
                      <div className="text-xs text-gray-600">Nitrogen</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="font-bold text-orange-600">{soilAnalysis.phosphorus}</div>
                      <div className="text-xs text-gray-600">Phosphorus</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="font-bold text-purple-600">{soilAnalysis.potassium}</div>
                      <div className="text-xs text-gray-600">Potassium</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="font-bold text-yellow-600">{soilAnalysis.organic_matter}%</div>
                      <div className="text-xs text-gray-600">Organic Matter</div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="font-semibold mb-3 text-gray-900">📋 AI Recommendations:</h5>
                    <div className="space-y-2">
                      {soilAnalysis.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          <span className="text-sm text-gray-700">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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