import sqlite3
from datetime import datetime, timedelta

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from passlib.context import CryptContext
from jose import jwt, JWTError

import os
import urllib.parse

# Initialize the API
app = FastAPI(title="My Music API")

# --- SECURITY SETTINGS ---
# In a real app, this key should be hidden in a .env file, but this is fine for your home lab
SECRET_KEY = "super-secret-elad-music-key-change-me"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # Wristband lasts for 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return username

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In a production app you'd lock this down, but "*" is perfect for home labs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to connect to the database
def get_db_connection():
    conn = sqlite3.connect("library.db")
    # This line is magic: it makes SQLite rows act like Python dictionaries
    conn.row_factory = sqlite3.Row 
    return conn

# --- ENDPOINT: Login (The Front Door) ---
@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, hashed_password FROM users WHERE username = ?", (form_data.username,))
    user = cursor.fetchone()
    conn.close()

    # Note: Because of conn.row_factory, 'user' is a dictionary-like object here
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # If password is correct, generate the VIP wristband
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

# --- ENDPOINT 1: Get the Library (LOCKED!) ---
@app.get("/songs")
def get_all_songs(current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, artist, album_artist, album, track, year, length, thumbnail_path FROM songs ORDER BY artist, album, track")
    songs = cursor.fetchall()
    conn.close()
    return [dict(song) for song in songs]

# --- ENDPOINT 2: Stream the Audio (OPEN) ---
# We leave this open because standard HTML <audio> players don't easily send JWT tokens. 
# They still can't guess the song IDs without logging in first anyway!
@app.get("/stream/{song_id}")
def stream_song(song_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT path FROM songs WHERE id = ?", (song_id,))
    song = cursor.fetchone()
    conn.close()

    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    # Rewrite the host machine path to the Docker volume path
    # DB has: /home/raglaim/obsidian-data/music/...
    # Docker needs: /app/music_files/...
    file_path = song["path"].replace("/home/raglaim/obsidian-data/music", "/app/music_files")

    return FileResponse(file_path)

# --- MOUNTING ---
# Ensure thumbnails are mounted BEFORE the root static files
if not os.path.exists("thumbnails"):
    os.makedirs("thumbnails")

app.mount("/thumbnails", StaticFiles(directory="thumbnails"), name="thumbnails")

# Only mount the root "/" ONCE
app.mount("/", StaticFiles(directory="static", html=True), name="static")