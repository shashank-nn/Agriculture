from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import httpx
import json
from openai import AsyncOpenAI
import random
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# External API clients
openai_client = AsyncOpenAI(api_key=os.environ['OPENAI_API_KEY'])
OPENWEATHER_API_KEY = os.environ['OPENWEATHER_API_KEY']

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class WeatherData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location: str
    temperature: float
    humidity: float
    description: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CropSuggestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    crop_name: str
    reason: str
    season: str
    location: str
    weather_condition: str

class AIQuery(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    answer: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CropRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    crop_name: str
    planting_date: datetime
    expected_harvest: datetime
    location: str
    notes: str
    status: str = "planted"

class YieldPrediction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    crop_name: str
    predicted_yield: float
    confidence_score: float
    factors: Dict[str, Any]
    location: str
    prediction_date: datetime = Field(default_factory=datetime.utcnow)

class MarketPrice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    commodity: str
    current_price_usd: float
    current_price_inr: float
    currency_usd: str = "USD"
    currency_inr: str = "INR"
    unit: str = "per bushel"
    change_percent: float
    market_trend: str
    exchange_rate: float = 83.5  # USD to INR conversion rate
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class SoilAnalysis(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ph_level: float
    nitrogen: float
    phosphorus: float
    potassium: float
    organic_matter: float
    soil_type: str
    health_score: float
    recommendations: List[str]
    location: str
    analysis_date: datetime = Field(default_factory=datetime.utcnow)

# Request models
class LocationRequest(BaseModel):
    location: str

class AIQueryRequest(BaseModel):
    question: str

class CropRecordRequest(BaseModel):
    crop_name: str
    planting_date: datetime
    expected_harvest: datetime
    location: str
    notes: str

class YieldPredictionRequest(BaseModel):
    crop_name: str
    location: str
    planting_date: datetime
    field_size: float  # in acres

class SoilAnalysisRequest(BaseModel):
    ph_level: float
    nitrogen: float
    phosphorus: float
    potassium: float
    organic_matter: float
    soil_type: str
    location: str

# API Routes
@api_router.get("/")
async def root():
    return {"message": "AI Agriculture Assistant API"}

@api_router.post("/weather", response_model=WeatherData)
async def get_weather(request: LocationRequest):
    try:
        async with httpx.AsyncClient() as client:
            url = f"http://api.openweathermap.org/data/2.5/weather?q={request.location}&appid={OPENWEATHER_API_KEY}&units=metric"
            response = await client.get(url)
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Weather data not found")
            
            weather_data = response.json()
            
            weather = WeatherData(
                location=request.location,
                temperature=weather_data['main']['temp'],
                humidity=weather_data['main']['humidity'],
                description=weather_data['weather'][0]['description']
            )
            
            # Save to database
            await db.weather_data.insert_one(weather.dict())
            return weather
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching weather: {str(e)}")

@api_router.post("/crop-suggestions")
async def get_crop_suggestions(request: LocationRequest):
    try:
        # First get weather data
        weather_response = await get_weather(request)
        
        # Generate crop suggestions using OpenAI
        prompt = f"""
        Based on the current weather conditions in {request.location}:
        - Temperature: {weather_response.temperature}°C
        - Humidity: {weather_response.humidity}%
        - Weather: {weather_response.description}
        
        Suggest 3-5 crops that would be suitable for planting now. Consider the season, climate, and weather conditions.
        Return your response as a JSON array with objects containing: crop_name, reason, season.
        """
        
        completion = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert agricultural advisor. Provide practical crop suggestions based on weather and location data."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        # Parse OpenAI response
        suggestions_text = completion.choices[0].message.content
        
        # Try to extract JSON from the response
        try:
            if '```json' in suggestions_text:
                json_start = suggestions_text.find('```json') + 7
                json_end = suggestions_text.find('```', json_start)
                suggestions_text = suggestions_text[json_start:json_end].strip()
            
            suggestions_data = json.loads(suggestions_text)
            
            suggestions = []
            for item in suggestions_data:
                suggestion = CropSuggestion(
                    crop_name=item.get('crop_name', ''),
                    reason=item.get('reason', ''),
                    season=item.get('season', ''),
                    location=request.location,
                    weather_condition=weather_response.description
                )
                suggestions.append(suggestion)
                # Save to database
                await db.crop_suggestions.insert_one(suggestion.dict())
            
            return suggestions
            
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return [CropSuggestion(
                crop_name="General crops suitable for current weather",
                reason=suggestions_text,
                season="Current season",
                location=request.location,
                weather_condition=weather_response.description
            )]
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating crop suggestions: {str(e)}")

@api_router.post("/ai-assistant", response_model=AIQuery)
async def ask_ai_assistant(request: AIQueryRequest):
    try:
        completion = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert agricultural advisor with deep knowledge of farming, crop management, weather patterns, soil health, pest control, and modern farming techniques. Provide helpful, practical advice for farmers."},
                {"role": "user", "content": request.question}
            ],
            temperature=0.7
        )
        
        answer = completion.choices[0].message.content
        
        query = AIQuery(
            question=request.question,
            answer=answer
        )
        
        # Save to database
        await db.ai_queries.insert_one(query.dict())
        return query
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing AI query: {str(e)}")

@api_router.post("/crops", response_model=CropRecord)
async def add_crop_record(request: CropRecordRequest):
    crop_record = CropRecord(**request.dict())
    await db.crop_records.insert_one(crop_record.dict())
    return crop_record

@api_router.get("/crops", response_model=List[CropRecord])
async def get_crop_records():
    records = await db.crop_records.find().to_list(1000)
    return [CropRecord(**record) for record in records]

@api_router.get("/recent-queries", response_model=List[AIQuery])
async def get_recent_queries():
    queries = await db.ai_queries.find().sort("timestamp", -1).limit(10).to_list(10)
    return [AIQuery(**query) for query in queries]

# Market Price Data (Mock implementation for MVP)
COMMODITY_PRICES = {
    "corn": {"base_price": 5.85, "unit": "per bushel", "trend": "stable"},
    "wheat": {"base_price": 7.20, "unit": "per bushel", "trend": "rising"},
    "soybeans": {"base_price": 13.45, "unit": "per bushel", "trend": "falling"},
    "rice": {"base_price": 14.50, "unit": "per cwt", "trend": "stable"},
    "cotton": {"base_price": 0.68, "unit": "per lb", "trend": "rising"},
    "tomatoes": {"base_price": 1.25, "unit": "per lb", "trend": "stable"},
    "potatoes": {"base_price": 0.55, "unit": "per lb", "trend": "falling"},
    "onions": {"base_price": 0.45, "unit": "per lb", "trend": "stable"}
}

@api_router.get("/market-prices")
async def get_market_prices():
    """Get current market prices for agricultural commodities"""
    try:
        prices = []
        for commodity, data in COMMODITY_PRICES.items():
            # Simulate price fluctuations
            base_price = data["base_price"]
            fluctuation = random.uniform(-0.15, 0.15)  # ±15% fluctuation
            current_price = base_price * (1 + fluctuation)
            change_percent = fluctuation * 100
            
            market_price = MarketPrice(
                commodity=commodity,
                current_price=round(current_price, 2),
                unit=data["unit"],
                change_percent=round(change_percent, 2),
                market_trend=data["trend"]
            )
            prices.append(market_price)
            
            # Save to database
            await db.market_prices.insert_one(market_price.dict())
        
        return prices
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching market prices: {str(e)}")

@api_router.post("/yield-prediction", response_model=YieldPrediction)
async def predict_yield(request: YieldPredictionRequest):
    """Predict crop yield based on various factors"""
    try:
        # Get weather data for location
        weather_response = await get_weather(LocationRequest(location=request.location))
        
        # Generate comprehensive yield prediction using AI
        prompt = f"""
        As an agricultural expert, predict the crop yield for the following scenario:
        
        Crop: {request.crop_name}
        Location: {request.location}
        Field Size: {request.field_size} acres
        Planting Date: {request.planting_date}
        Current Weather:
        - Temperature: {weather_response.temperature}°C
        - Humidity: {weather_response.humidity}%
        - Conditions: {weather_response.description}
        
        Consider factors like:
        - Climate suitability
        - Seasonal timing
        - Weather patterns
        - Historical yields
        - Field size efficiency
        
        Provide a realistic yield prediction in tons per acre and a confidence score (0-100).
        Also explain the key factors affecting this prediction.
        
        Return as JSON with: predicted_yield_per_acre, confidence_score, key_factors (as array)
        """
        
        completion = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert agricultural scientist specializing in yield prediction models. Provide accurate, data-driven predictions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        # Parse AI response
        ai_response = completion.choices[0].message.content
        
        try:
            if '```json' in ai_response:
                json_start = ai_response.find('```json') + 7
                json_end = ai_response.find('```', json_start)
                ai_response = ai_response[json_start:json_end].strip()
            
            prediction_data = json.loads(ai_response)
            
            yield_per_acre = prediction_data.get('predicted_yield_per_acre', 2.5)
            total_yield = yield_per_acre * request.field_size
            confidence = prediction_data.get('confidence_score', 75.0)
            factors = {
                "weather_impact": f"Temperature {weather_response.temperature}°C, Humidity {weather_response.humidity}%",
                "seasonal_timing": f"Planting date: {request.planting_date}",
                "field_size": f"{request.field_size} acres",
                "key_factors": prediction_data.get('key_factors', []),
                "location_suitability": request.location
            }
            
        except json.JSONDecodeError:
            # Fallback calculation
            base_yields = {
                "corn": 3.2, "wheat": 2.8, "soybeans": 2.1, "rice": 4.5,
                "tomatoes": 15.0, "potatoes": 20.0, "cotton": 0.8
            }
            yield_per_acre = base_yields.get(request.crop_name.lower(), 2.5)
            total_yield = yield_per_acre * request.field_size
            confidence = 70.0
            factors = {
                "weather_impact": f"Temperature {weather_response.temperature}°C",
                "field_size": f"{request.field_size} acres",
                "ai_analysis": ai_response[:200]
            }
        
        prediction = YieldPrediction(
            crop_name=request.crop_name,
            predicted_yield=round(total_yield, 2),
            confidence_score=confidence,
            factors=factors,
            location=request.location
        )
        
        # Save to database
        await db.yield_predictions.insert_one(prediction.dict())
        return prediction
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting yield: {str(e)}")

@api_router.post("/soil-analysis", response_model=SoilAnalysis)
async def analyze_soil(request: SoilAnalysisRequest):
    """Analyze soil health and provide recommendations"""
    try:
        # Generate comprehensive soil analysis using AI
        prompt = f"""
        As a soil science expert, analyze the following soil test results and provide recommendations:
        
        Soil Test Results:
        - pH Level: {request.ph_level}
        - Nitrogen (N): {request.nitrogen} ppm
        - Phosphorus (P): {request.phosphorus} ppm  
        - Potassium (K): {request.potassium} ppm
        - Organic Matter: {request.organic_matter}%
        - Soil Type: {request.soil_type}
        - Location: {request.location}
        
        Analyze:
        1. Overall soil health score (0-100)
        2. Nutrient deficiencies or excesses
        3. pH recommendations
        4. Specific fertilizer recommendations
        5. Organic matter improvements
        6. Best crops for this soil
        
        Return as JSON with: health_score, detailed_recommendations (array of strings)
        """
        
        completion = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert soil scientist with deep knowledge of soil chemistry, fertility, and crop nutrition. Provide practical, actionable recommendations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        ai_response = completion.choices[0].message.content
        
        try:
            if '```json' in ai_response:
                json_start = ai_response.find('```json') + 7
                json_end = ai_response.find('```', json_start)
                ai_response = ai_response[json_start:json_end].strip()
            
            analysis_data = json.loads(ai_response)
            health_score = analysis_data.get('health_score', 0)
            recommendations = analysis_data.get('detailed_recommendations', [])
            
        except json.JSONDecodeError:
            # Fallback analysis based on standard ranges
            health_score = 50  # Base score
            recommendations = []
            
            # pH analysis
            if request.ph_level < 6.0:
                recommendations.append("Soil is acidic. Add lime to raise pH to 6.0-7.0 range.")
                health_score -= 15
            elif request.ph_level > 7.5:
                recommendations.append("Soil is alkaline. Consider sulfur amendment to lower pH.")
                health_score -= 10
            else:
                recommendations.append("pH level is optimal for most crops.")
                health_score += 15
            
            # Nutrient analysis
            if request.nitrogen < 20:
                recommendations.append("Nitrogen deficiency detected. Apply nitrogen-rich fertilizer or compost.")
                health_score -= 10
            elif request.nitrogen > 50:
                recommendations.append("High nitrogen levels. Monitor to prevent nutrient runoff.")
                health_score += 10
            
            if request.phosphorus < 15:
                recommendations.append("Phosphorus is low. Apply bone meal or phosphate fertilizer.")
                health_score -= 8
            elif request.phosphorus > 50:
                recommendations.append("Phosphorus levels are excellent.")
                health_score += 8
            
            if request.potassium < 100:
                recommendations.append("Potassium deficiency. Apply potash or wood ash.")
                health_score -= 12
            elif request.potassium > 200:
                recommendations.append("Good potassium levels for strong plant growth.")
                health_score += 12
            
            # Organic matter analysis
            if request.organic_matter < 2:
                recommendations.append("Low organic matter. Add compost, manure, or cover crops.")
                health_score -= 15
            elif request.organic_matter > 4:
                recommendations.append("Excellent organic matter content supports soil health.")
                health_score += 20
            
            # Ensure health score is within bounds
            health_score = max(0, min(100, health_score))
        
        analysis = SoilAnalysis(
            ph_level=request.ph_level,
            nitrogen=request.nitrogen,
            phosphorus=request.phosphorus,
            potassium=request.potassium,
            organic_matter=request.organic_matter,
            soil_type=request.soil_type,
            health_score=health_score,
            recommendations=recommendations,
            location=request.location
        )
        
        # Save to database
        await db.soil_analyses.insert_one(analysis.dict())
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing soil: {str(e)}")

@api_router.get("/yield-history")
async def get_yield_history():
    """Get historical yield predictions"""
    try:
        history = await db.yield_predictions.find().sort("prediction_date", -1).limit(20).to_list(20)
        return [YieldPrediction(**prediction) for prediction in history]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching yield history: {str(e)}")

@api_router.get("/soil-history")
async def get_soil_history():
    """Get soil analysis history"""
    try:
        history = await db.soil_analyses.find().sort("analysis_date", -1).limit(20).to_list(20)
        return [SoilAnalysis(**analysis) for analysis in history]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching soil history: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()