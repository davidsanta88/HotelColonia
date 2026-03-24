const express = require('express');
const app = express();

app.get('/test-node', (req, res) => {
    res.json({ message: 'Node.js is working on SmarterASP!', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Test server running');
});
