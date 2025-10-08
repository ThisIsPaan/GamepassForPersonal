const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// ... all your route and fetch logic here ...

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
