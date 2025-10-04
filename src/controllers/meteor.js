import { fetchAsteroids, fetchAsteroidById } from "../services/getdata.js";

export const getAsteroids = async (req, res) => {
  try {
    const data = await fetchAsteroids();
    const filteredData = {};
    const rawdata = data.near_earth_objects;
    for (const date in rawdata) {
      filteredData[date] = rawdata[date].map((asteroid) => ({
        id: asteroid.id,
        name: asteroid.name,
        diameter_min_m:
          asteroid.estimated_diameter.meters.estimated_diameter_min,
        diameter_max_m:
          asteroid.estimated_diameter.meters.estimated_diameter_max,
        close_approach_date:
          asteroid.close_approach_data[0]?.close_approach_date,
        miss_distance_km:
          asteroid.close_approach_data[0]?.miss_distance.kilometers,
        velocity_kph:
          asteroid.close_approach_data[0]?.relative_velocity
            .kilometers_per_hour,
      }));
    }
    res.json(filteredData);
  } catch (error) {
    console.error("❌ Error en getAsteroids:", error.message);
    res.status(500).json({ error: "Error al obtener datos de NASA" });
  }
};

export const getAsteroidById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await fetchAsteroidById(id);

    const filteredData = {};

    filteredData.id = data.id;
    filteredData.name = data.name;
    filteredData.absolute_magnitude_h = data.absolute_magnitude_h;
    filteredData.estimated_diameter_meters = data.estimated_diameter.meters;
    filteredData.is_potentially_hazardous_asteroid = data.is_potentially_hazardous_asteroid;

    filteredData.close_approach_data = data.close_approach_data.map((approach) => ({
        
        close_approach_date: approach.close_approach_date,
        relative_velocity_kph: approach.relative_velocity.kilometers_per_hour,
        miss_distance_km: approach.miss_distance.kilometers,
        orbiting_body: approach.orbiting_body,
        relative_velocity_kps: approach.relative_velocity.kilometers_per_second,
    }));
    filteredData.orbital_data = data.orbital_data;

    res.json(filteredData);
  } catch (error) {
    console.error("❌ Error en getAsteroidById:", error.message);
    res.status(500).json({ error: "Error al obtener datos de NASA" });
  }
};
