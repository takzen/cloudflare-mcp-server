import { z } from "zod";

// ============================================================================
// EXISTING TOOLS
// ============================================================================

// MCP Tool: Get current weather
const getWeatherTool = {
  name: "getWeather",
  description: "Fetches current weather for the specified city",
  inputSchema: z.object({
    city: z.string(),
  }),
  async handler(input: { city: string }, apiKey: string) {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        input.city
      )}&appid=${apiKey}&units=metric`
    );
    const data = await res.json();

    if (!res.ok) return { error: data.message };

    return {
      city: data.name,
      temp: data.main.temp,
      description: data.weather[0].description,
    };
  },
};

// MCP Tool: Get 5-day forecast
const getForecastTool = {
  name: "getForecast",
  description: "Fetches 5-day weather forecast for the specified city",
  inputSchema: z.object({
    city: z.string(),
  }),
  async handler(input: { city: string }, apiKey: string) {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
        input.city
      )}&appid=${apiKey}&units=metric`
    );
    const data = await res.json();

    if (!res.ok) return { error: data.message };

    // Extract forecast every 24 hours (every 8 records of 3h intervals)
    const forecast = data.list
      .filter((_: any, i: number) => i % 8 === 0)
      .map((item: any) => ({
        date: item.dt_txt,
        temp: item.main.temp,
        description: item.weather[0].description,
      }));

    return {
      city: data.city.name,
      forecast,
    };
  },
};

// ============================================================================
// NEW TOOLS
// ============================================================================

// MCP Tool: Get air quality index
const getAirQualityTool = {
  name: "getAirQuality",
  description: "Fetches current air quality index (AQI) for the specified city",
  inputSchema: z.object({
    city: z.string(),
  }),
  async handler(input: { city: string }, apiKey: string) {
    // First, get city coordinates using geocoding API
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        input.city
      )}&limit=1&appid=${apiKey}`
    );
    const geoData = await geoRes.json();
    
    if (!geoData.length) return { error: "City not found" };
    
    const { lat, lon } = geoData[0];
    
    // Fetch air pollution data using coordinates
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
    );
    const data = await res.json();
    
    if (!res.ok) return { error: data.message };
    
    // AQI scale: 1 = Good, 2 = Fair, 3 = Moderate, 4 = Poor, 5 = Very Poor
    const aqi = data.list[0].main.aqi;
    const aqiDescriptions = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
    
    return {
      city: input.city,
      aqi,
      quality: aqiDescriptions[aqi - 1],
      components: {
        co: data.list[0].components.co,      // Carbon monoxide
        no2: data.list[0].components.no2,    // Nitrogen dioxide
        o3: data.list[0].components.o3,      // Ozone
        pm2_5: data.list[0].components.pm2_5, // Fine particles
        pm10: data.list[0].components.pm10,   // Coarse particles
      },
    };
  },
};

// MCP Tool: Get detailed weather information
const getDetailedWeatherTool = {
  name: "getDetailedWeather",
  description: "Fetches detailed weather including feels like, humidity, wind, pressure, and sunrise/sunset times",
  inputSchema: z.object({
    city: z.string(),
  }),
  async handler(input: { city: string }, apiKey: string) {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        input.city
      )}&appid=${apiKey}&units=metric`
    );
    const data = await res.json();

    if (!res.ok) return { error: data.message };

    return {
      city: data.name,
      country: data.sys.country,
      temperature: {
        current: data.main.temp,
        feelsLike: data.main.feels_like,
        min: data.main.temp_min,
        max: data.main.temp_max,
      },
      weather: {
        main: data.weather[0].main,
        description: data.weather[0].description,
      },
      wind: {
        speed: data.wind.speed, // m/s
        direction: data.wind.deg, // degrees
      },
      humidity: data.main.humidity, // %
      pressure: data.main.pressure, // hPa
      visibility: data.visibility, // meters
      clouds: data.clouds.all, // %
      sun: {
        sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
        sunset: new Date(data.sys.sunset * 1000).toISOString(),
      },
    };
  },
};

// MCP Tool: Compare weather in multiple cities
const compareWeatherTool = {
  name: "compareWeather",
  description: "Compares current weather between multiple cities (max 5 cities)",
  inputSchema: z.object({
    cities: z.array(z.string()).min(2).max(5),
  }),
  async handler(input: { cities: string[] }, apiKey: string) {
    // Fetch weather for all cities in parallel
    const promises = input.cities.map(async (city) => {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          city
        )}&appid=${apiKey}&units=metric`
      );
      const data = await res.json();
      
      if (!res.ok) return { city, error: data.message };
      
      return {
        city: data.name,
        temp: data.main.temp,
        feelsLike: data.main.feels_like,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
      };
    });
    
    const results = await Promise.all(promises);
    
    return {
      comparison: results,
      count: results.length,
    };
  },
};

// MCP Tool: Get weather alerts
const getWeatherAlertsTool = {
  name: "getWeatherAlerts",
  description: "Fetches weather alerts and warnings for the specified city (One Call API required)",
  inputSchema: z.object({
    city: z.string(),
  }),
  async handler(input: { city: string }, apiKey: string) {
    // First, get city coordinates
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        input.city
      )}&limit=1&appid=${apiKey}`
    );
    const geoData = await geoRes.json();
    
    if (!geoData.length) return { error: "City not found" };
    
    const { lat, lon } = geoData[0];
    
    // Fetch alerts using One Call API 3.0
    // Note: This requires a subscription to One Call API
    const res = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily&appid=${apiKey}`
    );
    const data = await res.json();
    
    if (!res.ok) return { error: data.message };
    
    return {
      city: input.city,
      alerts: data.alerts || [],
      hasAlerts: (data.alerts?.length || 0) > 0,
    };
  },
};

// ============================================================================
// MCP SERVER
// ============================================================================

export default {
  async fetch(request: Request, env: any) {
    try {
      const req = await request.json();
      const { tool, input } = req;

      // Route to appropriate tool handler
      if (tool === "getWeather") {
        const parsed = getWeatherTool.inputSchema.parse(input);
        const result = await getWeatherTool.handler(parsed, env.OPENWEATHER_API_KEY);
        return new Response(JSON.stringify(result), { status: 200 });
      }

      if (tool === "getForecast") {
        const parsed = getForecastTool.inputSchema.parse(input);
        const result = await getForecastTool.handler(parsed, env.OPENWEATHER_API_KEY);
        return new Response(JSON.stringify(result), { status: 200 });
      }

      if (tool === "getAirQuality") {
        const parsed = getAirQualityTool.inputSchema.parse(input);
        const result = await getAirQualityTool.handler(parsed, env.OPENWEATHER_API_KEY);
        return new Response(JSON.stringify(result), { status: 200 });
      }

      if (tool === "getDetailedWeather") {
        const parsed = getDetailedWeatherTool.inputSchema.parse(input);
        const result = await getDetailedWeatherTool.handler(parsed, env.OPENWEATHER_API_KEY);
        return new Response(JSON.stringify(result), { status: 200 });
      }

      if (tool === "compareWeather") {
        const parsed = compareWeatherTool.inputSchema.parse(input);
        const result = await compareWeatherTool.handler(parsed, env.OPENWEATHER_API_KEY);
        return new Response(JSON.stringify(result), { status: 200 });
      }

      if (tool === "getWeatherAlerts") {
        const parsed = getWeatherAlertsTool.inputSchema.parse(input);
        const result = await getWeatherAlertsTool.handler(parsed, env.OPENWEATHER_API_KEY);
        return new Response(JSON.stringify(result), { status: 200 });
      }

      return new Response(JSON.stringify({ error: "Tool not found" }), { status: 404 });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
  },
};