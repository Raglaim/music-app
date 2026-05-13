import sqlite3
from passlib.context import CryptContext

# Set up the password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_user():
    print("=== Create New User Account ===")
    username = input("Enter new username: ")
    password = input("Enter temporary password: ")
    
    # Scramble the password
    hashed_password = pwd_context.hash(password)
    
    try:
        # Connect to the main library database
        conn = sqlite3.connect("library.db")
        cursor = conn.cursor()
        
        # Insert the new user
        cursor.execute("INSERT INTO users (username, hashed_password) VALUES (?, ?)", (username, hashed_password))
        conn.commit()
        conn.close()
        
        print(f"\n✅ Success! User '{username}' has been created.")
        
    except sqlite3.IntegrityError:
        print(f"\n❌ Error: The username '{username}' already exists. Try a different name.")
    except Exception as e:
        print(f"\n❌ An error occurred: {e}")

if __name__ == "__main__":
    create_user()