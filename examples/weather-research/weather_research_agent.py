# =========================
# ENV LOADING (MUST BE FIRST)
# =========================
from pathlib import Path
from dotenv import load_dotenv
import os

# Explicitly load .env from the same folder as this file
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path, override=True)

# Fail fast if key is missing
api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    raise RuntimeError(
        "OPENROUTER_API_KEY not loaded. "
        "Make sure .env exists and contains OPENROUTER_API_KEY."
    )

# =========================
# IMPORTS (AFTER ENV LOAD)
# =========================
from bindu.penguin.bindufy import bindufy
from agno.agent import Agent
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.models.openrouter import OpenRouter

# =========================
# AGENT DEFINITION
# =========================
agent = Agent(
    instructions=(
        "You are a weather research assistant. "
        "Find current weather information and 5-day forecasts for cities worldwide. "
        "Use search tools to get real-time data. "
        "Format responses clearly with headings, bullet points, "
        "and include temperatures in both Celsius and Fahrenheit."
    ),
    model=OpenRouter(
        id="openai/gpt-oss-120b",
        api_key=api_key,
    ),
    tools=[DuckDuckGoTools()],
)

# =========================
# BINDU CONFIG
# =========================
config = {
    "author": "bindu.builder@getbindu.com",
    "name": "weather_research_agent",
    "description": "Research agent that provides current weather and 5-day forecasts worldwide",
    "deployment": {
        "url": "http://localhost:3773",
        "expose": True,
    },
     "skills": ["skills/weather-research-skill"],
}

# =========================
# MESSAGE HANDLER
# =========================
def handler(messages: list[dict[str, str]]):
    """
    Process incoming messages and return agent response.
    """
    return agent.run(input=messages)

# =========================
# BINDUFY (REGISTER AGENT)
# =========================
bindufy(config, handler)
