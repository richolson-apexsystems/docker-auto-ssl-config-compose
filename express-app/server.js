const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World from my Dockerized Express app image!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});