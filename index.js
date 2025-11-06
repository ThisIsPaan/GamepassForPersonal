const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// 🔄 Convert username to userId
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
    console.error(`❌ Failed to fetch userId for ${username}:`, error.message);
    return null;
  }
}

// 🎮 Fetch user experiences (games)
async function fetchUserExperiences(userId, max = 10) {
  try {
    const response = await axios.get(
      `https://games.roblox.com/v2/users/${userId}/games?limit=${max}&sortOrder=Desc`
    );
    return response.data.data || [];
  } catch (error) {
    console.error(`❌ Failed to fetch experiences for user ${userId}:`, error.message);
    return [];
  }
}

// 🔁 Handler: Return game IDs only
async function handleGameIdRequest(userId, res) {
  const experiences = await fetchUserExperiences(userId);

  if (experiences.length === 0) {
    return res.json({
      userId,
      message: 'No experiences found for this user',
      games: []
    });
  }

  const games = experiences.map(exp => ({
    name: exp.name,
    universeId: exp.id,
    placeId: exp.rootPlace?.id || null
  }));

  res.json({
    userId,
    totalGames: games.length,
    games
  });
}

// 🔗 Route: GET /games/username/:username
app.get('/games/username/:username', async (req, res) => {
  const username = req.params.username;
  const userId = await getUserIdFromUsername(username);

  if (!userId) {
    return res.status(404).json({ error: 'User not found or Roblox API failed' });
  }

  await handleGameIdRequest(userId, res);
});

// 🏠 Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Roblox Game ID Fetcher API',
    usage: 'GET /games/username/:username',
    example: '/games/username/Inspacto'
  });
});

// 🚀 Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
