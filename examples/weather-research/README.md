# Weather Research Agent

Advanced weather research agent that provides comprehensive weather information, forecasts, and meteorological analysis for any location worldwide.

## 🌤️ Features

### Core Capabilities
- **Real-time Weather Data**: Current conditions with temperature, humidity, wind, visibility
- **Multi-day Forecasting**: 5-day forecasts with confidence levels  
- **Weather Pattern Analysis**: Historical trends and seasonal patterns
- **Travel Recommendations**: Location-based travel advice
- **Severe Weather Alerts**: Automated warnings for extreme conditions
- **Global Coverage**: Weather information for any city worldwide

### 🔧 Technical Features
- **Model**: OpenRouter's `openai/gpt-oss-120b` for advanced reasoning
- **Search Integration**: DuckDuckGo tools for real-time weather data
- **Smart Formatting**: Clear, readable output with proper spacing
- **Error Handling**: Comprehensive validation and graceful fallbacks
- **Skill Integration**: Custom weather research skill included
- **Environment Loading**: Smart API key management with fallback

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- OpenRouter API key (set in `.env` file)
- UV package manager

### Installation & Setup

1. **Clone/Download** this agent directory
2. **Install dependencies**:
   ```bash
   uv sync
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENROUTER_API_KEY
   ```

4. **Run the agent**:
   ```bash
   uv run python weather_research_agent.py
   ```

## 📡 Usage Examples

### Basic Weather Queries
```python
# Direct agent usage
messages = [{"role": "user", "content": "What's the weather like in New York?"}]
```

### Supported Query Types
- **Current Conditions**: "weather in [location]", "current weather [location]"
- **Forecasts**: "forecast for [location]", "5-day forecast [location]"
- **Analysis**: "weather patterns [location]", "analyze weather [location]"
- **Travel**: "travel weather [location]", "weather advice for [location]"

## 🎯 Response Format

The agent provides structured weather information including:

### Current Conditions
- Temperature (Celsius & Fahrenheit)
- Weather conditions & descriptions
- Humidity, wind speed & direction
- Visibility & atmospheric pressure

### Forecast Data
- Multi-day forecasts with confidence levels
- High/low temperatures
- Precipitation probabilities
- Weather condition predictions

### Analysis & Insights
- Historical weather patterns
- Seasonal trends and comparisons
- Climate information for the region
- Travel recommendations based on conditions

## 🔐 Configuration

### Agent Settings
```python
config = {
    "author": "bindu.builder@getbindu.com",
    "name": "weather_research_agent", 
    "description": "Advanced weather research agent providing real-time weather data, forecasts, and meteorological analysis",
    "deployment": {"url": "http://localhost:3773", "expose": True},
    "skills": ["skills/weather-research-skill"]
}
```

### Model Configuration
- **Provider**: OpenRouter
- **Model**: `openai/gpt-oss-120b`
- **API Key**: Loaded from environment variable `OPENROUTER_API_KEY`

## 🛠️ Development

### Project Structure
```
weather-research/
├── weather_research_agent.py    # Main agent implementation
├── .env                     # Environment variables (API keys)
├── skills/                   # Custom skills directory
│   └── weather-research-skill/
│       ├── skill.yaml       # Skill metadata
│       ├── main.py          # Skill implementation
│       └── README.md         # Skill documentation
└── README.md                # This file
```

### Custom Skills
The agent includes a custom weather research skill that provides:
- Enhanced weather data processing
- Structured response formatting
- Comprehensive error handling
- Travel recommendations and analysis

## 🔍 Troubleshooting

### Common Issues

#### API Key Not Found
**Error**: `OPENROUTER_API_KEY not set`
**Solution**: 
1. Copy your OpenRouter API key
2. Add to `.env` file: `OPENROUTER_API_KEY=your_key_here`
3. Restart the agent

#### Environment Loading Issues
**Error**: Agent fails to load environment variables
**Solution**: The agent includes smart fallback mechanisms and debug output to identify issues

### Debug Mode
Enable debug logging by setting environment variable:
```bash
export LOG_LEVEL=DEBUG
uv run python weather_research_agent.py
```

## 📚 API Reference

### Endpoints
When running, the agent exposes these endpoints:
- **POST /message**: Send weather queries
- **GET /agent**: Get agent information
- **GET /health**: Health check endpoint

### Message Format
```json
{
  "messages": [
    {
      "role": "user", 
      "content": "What's the weather like in Tokyo?"
    }
  ]
}
```

## 🤝 Contributing

### Adding New Features
1. Create new skills in `skills/` directory
2. Update agent configuration in `weather_research_agent.py`
3. Add comprehensive documentation
4. Test thoroughly

### Code Standards
- Follow Python PEP 8 guidelines
- Include comprehensive error handling
- Add type hints for all functions
- Document all new features

## 📄 License

This project is part of the Bindu framework and follows the same licensing terms.

## 🆘 Support

For issues and questions:
- Check the [Bindu Documentation](https://docs.getbindu.com)
- Review existing [Issues](https://github.com/getbindu/bindu/issues)
- Join the [Community](https://discord.getbindu.com)

---

**Built with ❤️ using the Bindu Agent Framework**
