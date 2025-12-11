
import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind } from 'lucide-react';

interface WeatherData {
    temperature: number;
    condition: string; // 'Clear', 'Cloudy', 'Rain', etc.
    windSpeed: number;
}

export const WeatherWidget: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Weather (Open-Meteo API - No Key Required)
    // Defaulting to New York (40.7128, -74.0060) as seen in previous PDF context
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const lat = 40.7128;
                const lon = -74.0060;
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`
                );
                const data = await response.json();

                // Map WMO Weather Codes to conditions
                const code = data.current.weather_code;
                let condition = 'Clear';
                if (code >= 1 && code <= 3) condition = 'Cloudy';
                if (code >= 45 && code <= 48) condition = 'Fog';
                if (code >= 51 && code <= 67) condition = 'Rain';
                if (code >= 71 && code <= 77) condition = 'Snow';
                if (code >= 80 && code <= 82) condition = 'Rain';
                if (code >= 95 && code <= 99) condition = 'Storm';

                setWeather({
                    temperature: Math.round(data.current.temperature_2m),
                    condition,
                    windSpeed: Math.round(data.current.wind_speed_10m)
                });
            } catch (error) {
                console.error("Failed to fetch weather:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
        // Refresh weather every 30 mins
        const weatherTimer = setInterval(fetchWeather, 30 * 60 * 1000);
        return () => clearInterval(weatherTimer);
    }, []);

    const getWeatherIcon = (condition: string) => {
        switch (condition) {
            case 'Cloudy': return <Cloud className="text-gray-400" size={32} />;
            case 'Rain': return <CloudRain className="text-blue-400" size={32} />;
            case 'Snow': return <CloudSnow className="text-white" size={32} />;
            case 'Storm': return <CloudLightning className="text-yellow-400" size={32} />;
            case 'Fog': return <Wind className="text-gray-400" size={32} />;
            default: return <Sun className="text-yellow-400" size={32} />;
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        }).format(date);
    };

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg border border-slate-700 flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{formatTime(currentTime)}</h2>
                <p className="text-slate-400 mt-1">{formatDate(currentTime)}</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    {loading ? (
                        <div className="h-8 w-16 bg-slate-700 animate-pulse rounded"></div>
                    ) : (
                        <>
                            <p className="text-2xl font-bold">{weather?.temperature}°F</p>
                            <p className="text-sm text-slate-400">{weather?.condition}</p>
                        </>
                    )}
                </div>
                <div className="p-3 bg-white/10 rounded-full">
                    {loading ? <div className="w-8 h-8" /> : getWeatherIcon(weather?.condition || 'Clear')}
                </div>
            </div>
        </div>
    );
};
