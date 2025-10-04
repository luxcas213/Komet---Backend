import { fetchEarthquakeData, fetchEarthState } from "../services/getdata.js";

function energyToMagnitude(energyJ) {
  return (2 / 3) * (Math.log10(energyJ) - 4.8);
}

export async function getAirburst(req, res) {
  try {
    const { latitude, longitude, energy } = req.query;
    if (!latitude || !longitude || !energy) {
      return res
        .status(400)
        .json({ error: "Faltan parámetros: latitude, longitude o energy." });
    }

    const E = Number(energy);
    const Mw = energyToMagnitude(E);

    const minMag = Math.max(2.0, Mw - 0.5);
    const maxMag = Math.min(6.0, Mw + 0.5);

    const data = await fetchEarthquakeData(
      minMag,
      maxMag,
      Number(latitude),
      Number(longitude),
      1000,
      "2000-01-01",
      new Date().toISOString().split("T")[0],
      20
    );
    const rawData = data.features;
    const filteredData = {};
    filteredData.type = "airburst";
    filteredData.input = { latitude, longitude, energy, Mw };
    filteredData.resultCount = data.metadata.count;
    filteredData.earthquakes = [];
    for (const feature of rawData) {
      const properties = feature.properties;
      const geometry = feature.geometry;
      filteredData.earthquakes.push({
        id: feature.id,
        geometry: geometry,
        alert: properties.alert,
        cdi: properties.cdi,
        felt: properties.felt,
        magnitude: properties.mag,
        mmi: properties.mmi,
        place: properties.place,
        sig: properties.sig,
        tsunami: properties.tsunami,
        time: new Date(properties.time).toISOString(),
        url: properties.url,
      });
    }
    res.json(filteredData);
  } catch (err) {
    console.error("Error en getAirburst:", err.message);
    res.status(500).json({ error: "Error interno al consultar USGS." });
  }
}

export async function getDirectImpact(req, res) {
  try {
    const { latitude, longitude, energy } = req.query;
    if (!latitude || !longitude || !energy) {
      return res
        .status(400)
        .json({ error: "Faltan parámetros: latitude, longitude o energy." });
    }

    const E = Number(energy);
    const Mw = energyToMagnitude(E);

    const minMag = Math.max(5.0, Mw - 0.3);
    const maxMag = Math.min(9.5, Mw + 0.3);

    const data = await fetchEarthquakeData(
      minMag,
      maxMag,
      Number(latitude),
      Number(longitude),
      1500,
      "1900-01-01",
      new Date().toISOString().split("T")[0],
      20
    );

    const rawData = data.features;
    const filteredData = {};
    filteredData.type = "directImpact";
    filteredData.input = { latitude, longitude, energy, Mw };
    filteredData.resultCount = data.metadata.count;
    filteredData.earthquakes = [];
    
    for (const feature of rawData) {
      console.log(feature);
      const properties = feature.properties;
      const geometry = feature.geometry;

      filteredData.earthquakes.push({
        id: feature.id,
        geometry: geometry,
        alert: properties.alert,
        cdi: properties.cdi,
        felt: properties.felt,
        magnitude: properties.mag,
        mmi: properties.mmi,
        place: properties.place,
        sig: properties.sig,
        tsunami: properties.tsunami,
        time: new Date(properties.time).toISOString(),
        url: properties.url,
      });
    }
    res.json(filteredData);
  } catch (err) {
    console.error("Error en getDirectImpact:", err.message);
    res.status(500).json({ error: "Error interno al consultar USGS." });
  }
}

export async function getEarthState(req, res) {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ 
        error: "Falta parámetro requerido: date (formato: YYYY-MM-DD HH:mm)" 
      });
    }

    const rawData = await fetchEarthState(date);
    
    const vecResult = rawData.vectorData.result;
    const vecDataSection = vecResult.split("$$SOE")[1].split("$$EOE")[0].trim();
    const vecDataArray = vecDataSection.split(/\s+/);
    
    const x = parseFloat(vecDataArray[2]);
    const y = parseFloat(vecDataArray[3]);
    const z = parseFloat(vecDataArray[4]);
    const vx = parseFloat(vecDataArray[5]);
    const vy = parseFloat(vecDataArray[6]);
    const vz = parseFloat(vecDataArray[7]);

    const obsResult = rawData.observerData.result;
    const obsDataSection = obsResult.split("$$SOE")[1].split("$$EOE")[0].trim();
    const obsDataArray = obsDataSection.split(/\s+/);
    
    const subsolarLon = parseFloat(obsDataArray[3]);
    const subsolarLat = parseFloat(obsDataArray[4]);

    const earthState = {
      type: "earth_state",
      input: {
        date: date
      },
      data: {
        position_km: [x, y, z],
        velocity_kms: [vx, vy, vz],
        subsolar_lon_deg: subsolarLon,
        subsolar_lat_deg: subsolarLat
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "NASA JPL Horizons API"
      }
    };

    res.json(earthState);
  } catch (err) {
    console.error("Error en getEarthState:", err.message);
    res.status(500).json({ 
      error: "Error interno al consultar NASA JPL Horizons API.",
      details: err.message 
    });
  }
}