import sqlite3

# Connect to the main library database
conn = sqlite3.connect("library.db")
cursor = conn.cursor()

# Create the schema with the new volume setting
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    hashed_password TEXT,
    volume REAL DEFAULT 1.0
)
''')

conn.commit()
print("Users table created successfully!")