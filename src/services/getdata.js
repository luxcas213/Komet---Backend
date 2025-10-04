import axios from "axios";

export const fetchAsteroids = async () => {
    const apiKey = process.env.NASA_API_KEY;
    const baseUrl = process.env.NASA_BASE_URL;
    const url = `${baseUrl}&api_key=${apiKey}`;
    const response = await axios.get(url);
    return response.data;
};