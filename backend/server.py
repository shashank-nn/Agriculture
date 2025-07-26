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
    current_price: float
    currency: str = "USD"
    unit: str = "per bushel"
    change_percent: float
    market_trend: str
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