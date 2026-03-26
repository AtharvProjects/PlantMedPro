/**
 * PlantMedPro - Weather Service
 * Fetches weather data from OpenWeather API (free tier).
 * Provides spray recommendations based on weather conditions.
 */

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY ?? 'REPLACE_WITH_YOUR_FREE_API_KEY';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export type WeatherData = {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  city: string;
  sprayCondition: 'Ideal' | 'Moderate' | 'Poor';
  sprayMessage: string;
};

export type MockWeather = WeatherData;

/** Get spray condition based on weather parameters */
function getSprayCondition(
  temp: number,
  wind_speed: number,
  humidity: number
): { condition: WeatherData['sprayCondition']; message: string } {
  // Ideal: temp 15-30°C, wind < 15 km/h, humidity 40-80%
  if (temp >= 15 && temp <= 30 && wind_speed < 4 && humidity >= 40 && humidity <= 80) {
    return { condition: 'Ideal', message: 'Perfect conditions for spraying. Apply now!' };
  }
  // Poor: high wind or extreme temps
  if (wind_speed > 6 || temp > 35 || temp < 10) {
    return { condition: 'Poor', message: 'Avoid spraying. Wait for better conditions.' };
  }
  return { condition: 'Moderate', message: 'Spray possible, but not optimal. Use early morning.' };
}

/**
 * Fetch real weather data from OpenWeather API
 * @param lat Latitude
 * @param lon Longitude
 */
export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  try {
    const response = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error('Weather API error');
    const data = await response.json();

    const wind_speed = data.wind?.speed ?? 0;
    const humidity = data.main?.humidity ?? 60;
    const temp = data.main?.temp ?? 25;
    const { condition, message } = getSprayCondition(temp, wind_speed, humidity);

    return {
      temp: Math.round(temp),
      feels_like: Math.round(data.main?.feels_like ?? temp),
      humidity,
      wind_speed: Math.round(wind_speed * 3.6), // m/s to km/h
      description: data.weather?.[0]?.description ?? 'Clear sky',
      icon: data.weather?.[0]?.icon ?? '01d',
      city: data.name ?? 'Your Location',
      sprayCondition: condition,
      sprayMessage: message,
    };
  } catch {
    // Return mock data on failure (offline fallback)
    return getMockWeather();
  }
}

/** Offline/mock weather data for development */
export function getMockWeather(): WeatherData {
  return {
    temp: 26,
    feels_like: 28,
    humidity: 65,
    wind_speed: 12,
    description: 'Partly cloudy',
    icon: '02d',
    city: 'Nashik',
    sprayCondition: 'Moderate',
    sprayMessage: 'Spray possible. Use early morning before 9 AM.',
  };
}
