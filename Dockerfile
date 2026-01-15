# 1. Use a slim version of Python as the base image
FROM python:3.12-slim

# 2. Set the working directory inside the container
WORKDIR /app


# Install system dependencies + git
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*
# 4. Copy and install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of your application code
COPY . .

# 6. Tell Docker which port the container listens on
EXPOSE 8000

# 7. Start the FastAPI server using uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]