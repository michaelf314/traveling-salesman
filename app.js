const express = require("express");
const app = express();
app.use(express.json());
app.use(express.static("public"));
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.CONNECTION_STRING+'travelingsalesmanDB', {useNewUrlParser: true, useUnifiedTopology: true});

const scoreSchema = new mongoose.Schema({
  dots: Number,
  score: Number,
  name: String
});
const Score = mongoose.model('Score', scoreSchema);

const leaderboardSize = 100;
app.get('/scores', async (req, res) => {
  let leaderboard = await Score.find({dots: req.query.dots}).sort('score').exec();
  res.send(leaderboard.slice(0, leaderboardSize));
  if (leaderboard.length > leaderboardSize) {
    Score.deleteMany({dots: req.query.dots, score: {$gt: leaderboard[leaderboardSize-1].score}}).exec();
  }
})

app.post('/scores', async (req, res) => {
  await Score.updateOne({dots: req.body.dots, name: req.body.name}, {$min: {score: req.body.score}}, {upsert: true});
  res.send('Score submitted!');
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
