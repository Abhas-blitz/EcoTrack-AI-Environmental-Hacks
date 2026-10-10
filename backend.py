
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from strands import Agent
from strands.models.ollama import OllamaModel

app = FastAPI(title="EcoTrack AI API")

app.add_middleware(
    CORSMiddleware,
    # Vite may use either hostname during local development.
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

model = OllamaModel(
    host="http://localhost:11434",
    model_id="llama3.2:3b",
)

agent = Agent(
    model=model,
    system_prompt=(
        "You are EcoTrack AI, an environmental assistant. "
        "Give practical recycling and waste-disposal advice. "
        "Do not invent local recycling rules."
    ),
)

class Question(BaseModel):
    question: str

@app.get("/")
def home():
    return {"message": "EcoTrack AI API is running"}

@app.post("/ask")
def ask(question: Question):
    answer = agent(question.question)
    return {"answer": str(answer)}
