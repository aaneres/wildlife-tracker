from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3

app = FastAPI(title="Wildlife Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Automatically create the SQLite database file if it doesn't exist
def init_db():
    conn = sqlite3.connect("tracker.db")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sightings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            species TEXT,
            count INTEGER,
            notes TEXT,
            timestamp TEXT,
            latitude REAL,
            longitude REAL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# 2. Update our data model to match the new React form
class Sighting(BaseModel):
    species: str
    count: int
    notes: str = ""
    timestamp: str
    latitude: float
    longitude: float

# 3. Write data to the permanent database
@app.post("/api/sightings/")
async def log_sighting(sighting: Sighting):
    conn = sqlite3.connect("tracker.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sightings (species, count, notes, timestamp, latitude, longitude) 
        VALUES (?, ?, ?, ?, ?, ?)
    """, (sighting.species, sighting.count, sighting.notes, sighting.timestamp, sighting.latitude, sighting.longitude))
    conn.commit()
    conn.close()
    
    return {"message": "Sighting saved to database!"}

# 4. Fetch data from the database
@app.get("/api/sightings/")
async def get_sightings():
    conn = sqlite3.connect("tracker.db")
    # This row_factory makes the database return dictionaries instead of plain tuples
    conn.row_factory = sqlite3.Row 
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM sightings")
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]
