# Use a lightweight Python image
FROM python:3.11-slim

# Create a directory for the app
WORKDIR /app

# Copy your requirements and install them
# (We'll create this file in the next step)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your Python code and your static frontend folder
COPY main.py .
COPY library.db .
COPY static/ ./static/

# Expose the port FastAPI runs on
EXPOSE 8000

# Start the server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]