from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import sqlite3
import os
import shutil
from datetime import datetime

app = FastAPI(title="Wildlife Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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
            longitude REAL,
            image_path TEXT  -- NEW COLUMN!
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.post("/api/sightings/")
async def log_sighting(
    species: str = Form(...),
    count: int = Form(...),
    notes: str = Form(""),
    timestamp: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: UploadFile = File(None) 
):
    image_path = None

    if image:
        filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{image.filename}"
        file_location = f"uploads/{filename}"
        
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(image.file, file_object)
            
        image_path = f"http://127.0.0.1:8000/uploads/{filename}"

    conn = sqlite3.connect("tracker.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sightings (species, count, notes, timestamp, latitude, longitude, image_path) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (species, count, notes, timestamp, latitude, longitude, image_path))
    conn.commit()
    conn.close()
    
    return {"message": "Sighting saved to database!"}

@app.get("/api/sightings/")
async def get_sightings():
    conn = sqlite3.connect("tracker.db")
    conn.row_factory = sqlite3.Row 
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sightings")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]