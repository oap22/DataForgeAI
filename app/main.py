from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .schemas import URLData

app = FastAPI()

# IMPORTANT: This allows your Chrome Extension to send data to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your extension ID
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.post("/process_url")
async def process_url(item: URLData):
    
    return {"status": "received"}
