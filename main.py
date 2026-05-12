from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(title="Wildlife Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Sighting(BaseModel):
    species_or_name: str
    latitude: float
    longitude: float
    notes: str | None = None
    timestamp: datetime = datetime.now()

sightings_db = []

@app.post("/api/sightings/")
async def log_sighting(sighting: Sighting):
    sightings_db.append(sighting)
    return {"message": "Sighting logged successfully!", "data": sighting}

@app.get("/api/sightings/")
async def get_sightings():
    return sightings_db
