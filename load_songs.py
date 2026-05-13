import os
import sqlite3
import re
from mutagen.easyid3 import EasyID3
from mutagen.mp3 import MP3
from mutagen.id3 import ID3 # <-- NEW: Needed for extracting images

# --- 0. FOLDER SETUP ---
# Create a directory to hold the extracted cover art
THUMBNAIL_DIR = "thumbnails"
os.makedirs(THUMBNAIL_DIR, exist_ok=True)

# --- 1. DATABASE SETUP ---
conn = sqlite3.connect("library.db")
cursor = conn.cursor()

# Updated schema: Added 'thumbnail_path' column
cursor.execute('''
CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE,
    title TEXT,
    album_artist TEXT,
    artist TEXT,
    album TEXT,
    track TEXT,
    year TEXT,
    length INTEGER,
    thumbnail_path TEXT 
)
''')
conn.commit()

# --- 2. DIRECTORY SCANNER ---
root_dir = "/home/raglaim/obsidian-data/music"

for dirpath, dirnames, filenames in os.walk(root_dir):
    for f in filenames:
        if f.endswith(".mp3"):
            full_path = os.path.join(dirpath, f)
            
            try:
                # Load text tags and audio info
                audio_tags = EasyID3(full_path)
                audio_file = MP3(full_path)

                title = audio_tags.get('title', ['Unknown'])[0]
                album_artist = audio_tags.get('albumartist', ['Unknown'])[0]
                artist_string = ", ".join(audio_tags.get('artist', ['Unknown']))
                album = audio_tags.get('album', ['Unknown'])[0]
                track = audio_tags.get('tracknumber', ['Unknown'])[0]
                year = audio_tags.get('date', ['Unknown'])[0]
                length = round(audio_file.info.length) 
                
                # --- 3. EXTRACT THUMBNAIL ---
                thumbnail_path = None
                
                # We load the raw ID3 tags to look for the APIC (Attached Picture) frame
                raw_tags = ID3(full_path)
                
                # Look for the cover art frame
                apic_frame = None
                for key in raw_tags.keys():
                    if key.startswith('APIC'):
                        apic_frame = raw_tags[key]
                        break
                
                if apic_frame:
                    # Create a safe filename based on the album name so we don't have illegal characters like '/'
                    safe_album_name = re.sub(r'[\\/*?:"<>|]', "", album)
                    if safe_album_name.strip() == "":
                         safe_album_name = "Unknown_Album"
                         
                    image_filename = f"{safe_album_name}.jpg"
                    local_image_path = os.path.join(THUMBNAIL_DIR, image_filename)
                    
                    # Only write the image file if we haven't already extracted it for this album
                    if not os.path.exists(local_image_path):
                        with open(local_image_path, 'wb') as img:
                            img.write(apic_frame.data)
                    
                    # Save the relative path for the database
                    thumbnail_path = f"/{THUMBNAIL_DIR}/{image_filename}"

                # --- 4. DATABASE INSERTION ---
                cursor.execute('''
                INSERT OR REPLACE INTO songs 
                (path, title, album_artist, artist, album, track, year, length, thumbnail_path)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (full_path, title, album_artist, artist_string, album, track, year, length, thumbnail_path))
                
                print(f"Added to DB: {title} by {artist_string} | Art: {'Yes' if thumbnail_path else 'No'}")

            except Exception as e:
                print(f"Could not read/save {f}: {e}")

# --- 5. SAVE AND CLOSE ---
conn.commit()
conn.close()
print("🎉 Library scan complete! Database and thumbnails created.")