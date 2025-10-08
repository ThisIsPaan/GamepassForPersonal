const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

async function getUserIdFromUsername(username) {
  try {
    const response = await axios.post(
      'https://users.roblox.com/v1/usernames/users',
      {
        usernames: [username],
        excludeBannedUsers: true
      }
    );
    const user = response.data.data[0];
    return user?.id || null;
  } catch (error) {
    console.error(`Failed to fetch userId for ${username}:`, error.message);
    return null;
  }
}

async function fetchUserExperiences(userId, maxExperiences = 5) {
  try {
    const response = await axios.get(
      `https://games.roblox.com/v2/users/${userId}/games?limit=10&sortOrder=Desc`
    );
    const experiences = response.data.data || [];
    return experiences.slice(0, maxExperiences);
  } catch (error) {
    throw new Error(`Failed to fetch user experiences: ${error.message}`);
  }
}

async function fetchGamepasses(universeId) {
  try {
    const response = await axios.get(
      `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=50&sortOrder=Asc`
    );
    return response.data.data || [];
  } catch (error) {
    console.error(`Error fetching gamepasses for universe ${universeId}:`, error.message);
    return [];
  }
}

async function fetchGamepassDetails(gamepassId) {
  try {
    const response = await axios.get(
      `https://apis.roblox.com/game-passes/v1/game-passes/${gamepassId}/product-info`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for gamepass ${gamepassId}:`, error.message);
    return null;
  }
}

app.get('/gamepasses/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid userId. Must be a number.' });
    }

    const experiences = await fetchUserExperiences(userId, 5);

    if (experiences.length === 0) {
      return res.json({ 
        userId,
        message: 'No experiences found for this user',
        gamepasses: [] 
      });
    }

    const allGamepasses = [];

    for (const experience of experiences) {
      const universeId = experience.id;
      const placeId = experience.rootPlace?.id || null;

      const gamepasses = await fetchGamepasses(universeId);

      for (const gamepass of gamepasses) {
        const details = await fetchGamepassDetails(gamepass.id);
        
        allGamepasses.push({
          id: gamepass.id,
          name: gamepass.name,
          price: details?.PriceInRobux || 0,
          imageAssetId: details?.IconImageAssetId || null,
          placeId: placeId
        });
      }
    }

    res.json({
      userId,
      totalExperiences: experiences.length,
      totalGamepasses: allGamepasses.length,
      gamepasses: allGamepasses
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch gamepasses',
      message: error.message 
    });
  }
});

app.get('/gamepasses/username/:username', async (req, res) => {
  const username = req.params.username;
  const userId = await getUserIdFromUsername(username);

  if (!userId) {
    return res.status(404).json({ error: 'User not found or Roblox API failed' });
  }

  req.params.userId = userId;
  app._router.handle(req, res, () => {});
});

app.get('/', (req, res) => {
  res.json({
    message: 'Roblox Gamepass Fetcher API',
    usage: 'GET /gamepasses/:userId or /gamepasses/username/:username',
    example_userId: '/gamepasses/360475870',
    example_username: '/gamepasses/username/Inspacto'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
