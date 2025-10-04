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

export const fetchEarthState = async (dateStr) => {
  const url = 'https://ssd.jpl.nasa.gov/api/horizons.api';
  
  const paramsVec = {
    format: 'json',
    COMMAND: '399',
    CENTER: '500@10',
    MAKE_EPHEM: 'YES',
    TABLE_TYPE: 'VECTORS',
    START_TIME: dateStr,
    STOP_TIME: dateStr,
    STEP_SIZE: '1 d'
  };

  const responseVec = await axios.get(url, { params: paramsVec });
  
  const paramsObs = {
    format: 'json',
    COMMAND: '10',
    CENTER: '399',
    MAKE_EPHEM: 'YES',
    TABLE_TYPE: 'OBSERVER',
    START_TIME: dateStr,
    STOP_TIME: dateStr,
    STEP_SIZE: '1 d',
    QUANTITIES: '20'
  };

  const responseObs = await axios.get(url, { params: paramsObs });
  
  return {
    vectorData: responseVec.data,
    observerData: responseObs.data
  };
};