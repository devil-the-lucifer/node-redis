const axios = require('axios');
const { redisClientService } = require('./redisClient'); // Import Redis client service
const URL = 'https://jsonplaceholder.typicode.com/photos';
const CACHE_KEY = 'photos'; // The key where photos will be stored in Redis

const getPhotos = async (req, res) => {
    const client = await redisClientService(); // Get Redis client
    try {
        // Try to get the cached photos from Redis
        const cachedPhotos = await client.get(CACHE_KEY);

        if (cachedPhotos) {
            console.log('Serving from cache');
            return res.status(200).json({ photos: JSON.parse(cachedPhotos) });
        }

        // If cache is empty, fetch photos from the API
        const response = await axios.get(URL);
        const photosData = response.data;

        // Store the photos in Redis with an expiry of 1 hour (3600 seconds)
        await client.set(CACHE_KEY, JSON.stringify(photosData), 'EX', 3600);

        console.log('Fetched from API');
        return res.status(200).json({ photos: photosData });
    } catch (error) {
        console.error(`Error fetching photos: ${error.message}`);
        return res.status(500).json({ error: error.message });
    } finally {
        // Close Redis connection gracefully if necessary
        await client.quit();
    }
};

module.exports = {
    getPhotos
};
