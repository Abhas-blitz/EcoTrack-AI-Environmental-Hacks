
from strands import Agent
from strands.models.ollama import OllamaModel

model = OllamaModel(
    host="http://localhost:11434",
    model_id="llama3.2:3b",
)

agent = Agent(
    model=model,
    system_prompt=(
        "You are EcoTrack AI, an environmental assistant. "
        "Give practical waste management and recycling advice."
    ),
)

response = agent("Suggest three ways to reduce plastic waste.")
print(response)
