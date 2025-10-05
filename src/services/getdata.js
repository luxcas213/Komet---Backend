import axios from "axios";

export const fetchAsteroids = async () => {
  const apiKey = process.env.NASA_API_KEY;
  const baseUrl = process.env.NASA_BASE_URL;
  const url = `${baseUrl}&api_key=${apiKey}`;
  
  const response = await axios.get(url);
  return response.data;
};

export const fetchAsteroidById = async (id) => {
  const apiKey = process.env.NASA_API_KEY;
  const url = `https://api.nasa.gov/neo/rest/v1/neo/${id}?api_key=${apiKey}`;
  
  const response = await axios.get(url);
  return response.data;
};

export const fetchEarthquakeData = async (
  minMag,
  maxMag,
  latitude,
  longitude,
  radiusKm,
  startTime,
  endTime,
  limit
) => {
  const USGS_API_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
  
  const params = {
    format: 'geojson',
    starttime: startTime,
    endtime: endTime,
    minmagnitude: minMag,
    maxmagnitude: maxMag,
    latitude,
    longitude,
    maxradiuskm: radiusKm,
    orderby: 'magnitude',
    limit,
  };

  const response = await axios.get(USGS_API_URL, { params });
  return response.data;
};