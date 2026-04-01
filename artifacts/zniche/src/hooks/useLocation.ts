import { useState, useEffect } from "react";

export interface LocationData {
  countryCode: string;
  countryName: string;
  currency: string;
  timezone: string;
  city: string;
  lat: number;
  lng: number;
  languages: string;
}

const CACHE_KEY = "zniche_location";
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detect = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed._ts && Date.now() - parsed._ts < CACHE_DURATION) {
            setLocation(parsed);
            setLoading(false);
            return;
          }
        }
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        const loc: LocationData & { _ts: number } = {
          countryCode: data.country_code || "US",
          countryName: data.country_name || "United States",
          currency: data.currency || "USD",
          timezone: data.timezone || "UTC",
          city: data.city || "",
          lat: data.latitude || 0,
          lng: data.longitude || 0,
          languages: data.languages || "en",
          _ts: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(loc));
        setLocation(loc);
      } catch {
        setLocation({
          countryCode: "US",
          countryName: "United States",
          currency: "USD",
          timezone: "UTC",
          city: "",
          lat: 0,
          lng: 0,
          languages: "en",
        });
      } finally {
        setLoading(false);
      }
    };
    detect();
  }, []);

  return { location, loading };
}
