import { fetchEarthquakeData } from "../services/getdata.js";

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