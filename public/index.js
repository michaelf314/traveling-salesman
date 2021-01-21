const canvas = document.querySelector('canvas');
const start = document.querySelector('#start');
const dots = document.querySelector('#dots');
const leaderboardbutton = document.querySelector('#leaderboardbutton');
const leaderboarddiv = document.querySelector('#leaderboarddiv');
const scorediv = document.querySelector('#scorediv');
const scores = document.querySelector('#scores');
const avgscore = document.querySelector('#avgscore');
const timer = document.querySelector('#timer');
const distance = document.querySelector('#distance');
const score = document.querySelector('#score');
const name = document.querySelector('#name');
const submit = document.querySelector('#submit');
const message = document.querySelector('#message');
const DOT_SIZE = 4;
const MIN_DOTS = 3, MAX_DOTS = 50, DEFAULT_DOTS = 15;
const TWO_PI = 2 * Math.PI;
const CANVAS_SIZE = canvas.width = canvas.height = 400;
const ctx = canvas.getContext("2d");
ctx.lineWidth = 2;

let firstDot, lastDot;
let dotArray;
let pathDistance;
let startTime, currentTime;
let timerPaused = true;
let currentSeed, originalSeed;
let numDots;
let numWins = 0;
let totalScore = 0;
let lastScore;
let leaderboard;
let currentLeaderboard;

function dist(x1, y1, x2, y2) {
  return Math.hypot(x1-x2, y1-y2);
}

function win() {
  timerPaused = true;
  const penalty = pathDistance * (currentTime - startTime)/1000/numDots/25;
  lastScore = pathDistance + penalty;
  scores.insertAdjacentHTML('beforeend', `Game #${++numWins} (${numDots} dots): <span>${lastScore.toFixed(2)}</span><br>`);
  score.innerHTML = `Score: ${lastScore.toFixed(2)}`;
  totalScore += lastScore;
  avgscore.innerHTML = `Average score: <span>${(totalScore/numWins).toFixed(2)}</span>`;
  if (currentLeaderboard !== numDots)
    showLeaderboard();
  submit.disabled = false;
}

function markDot(e) {
  const X = canvas.getBoundingClientRect().left;
  const Y = canvas.getBoundingClientRect().top;
  const x = e.pageX-X, y = e.pageY-Y;
  for (let i = 0; i < dotArray.length; i++) {
    const dot = dotArray[i];
    if (dist(x, y, dot[0], dot[1]) < DOT_SIZE*4) {
      drawDot(dot[0], dot[1]);
      if (!firstDot)
        firstDot = dot;
      else
        drawLine(dot[0], dot[1]);
      lastDot = dot;
      dotArray.splice(i, 1);
      if (dotArray.length === 0) {
        drawLine(firstDot[0], firstDot[1]);
        win();
      }
      distance.innerHTML = `Distance: ${pathDistance.toFixed(2)}`;
      return;
    }
  }
}

function drawLine(x, y) {
  ctx.beginPath();
  ctx.moveTo(lastDot[0], lastDot[1]);
  ctx.lineTo(x, y);
  ctx.stroke();
  pathDistance += dist(x, y, lastDot[0], lastDot[1]);
}

function drawDot(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, DOT_SIZE, 0, TWO_PI);
  ctx.fill();
}

function randInt() {
  const min=DOT_SIZE*2, max=CANVAS_SIZE-DOT_SIZE*2;
  currentSeed = currentSeed * 48271 % 2147483647;
  return currentSeed % (max-min+1) + min;
}

function drawRandomDots() {
  for (let i = 0; i < numDots; i++) {
    outer:
    while (true) {
      const x = randInt(), y = randInt();
      for (let dot of dotArray) {
        if (dist(x, y, dot[0], dot[1]) < DOT_SIZE * 64 / Math.sqrt(numDots))
          continue outer;
      }
      dotArray.push([x, y]);
      drawDot(x, y);
      break outer;
    }
  }
}

function frame() {
  if (!timerPaused) {
    currentTime = performance.now();
    timer.innerHTML = `Time: ${((currentTime - startTime)/1000).toFixed(2)}`;
  }
  requestAnimationFrame(frame);
}

function startGame() {
  submit.disabled = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dotArray = [];
  pathDistance = 0;
  firstDot = lastDot = undefined;
  timerPaused = false;
  currentSeed = Math.floor(Math.random() * 2147483646) + 1;
  if (isNaN(dots.value))
    dots.value = DEFAULT_DOTS;
  else if (dots.value < MIN_DOTS)
    dots.value = MIN_DOTS;
  else if (dots.value > MAX_DOTS)
    dots.value = MAX_DOTS;
  numDots = dots.value;
  originalSeed = currentSeed;
  ctx.fillStyle = 'black';
  drawRandomDots();
  canvas.addEventListener('click', markDot);
  ctx.fillStyle = 'red';
  distance.innerHTML = 'Distance: 0.0';
  score.innerHTML = 'Score: ?';
  message.innerHTML = '';
  startTime = performance.now();
}

async function showLeaderboard() {
  currentLeaderboard = dots.value;
  leaderboard = (await axios.get(`/scores?dots=${currentLeaderboard}`)).data;
  leaderboarddiv.innerHTML = `<b>${currentLeaderboard} dots leaderboard</b><br>`;
  for (let score of leaderboard)
    leaderboarddiv.innerHTML += `${score.name === name.value?'<b>':''}${score.name} <span>${score.score}</span>${score.name === name.value?'</b>':''}<br>`;
  leaderboarddiv.classList.remove('hidden');
}

async function submitToLeaderboard() {
  if (name.value.length === 0) {
    message.innerHTML = 'Please enter your name';
    return;
  }
  else {
    let pr = leaderboard.find((score) => score.name === name.value);
    if (pr && pr.score <= lastScore) {
      message.innerHTML = 'You did not beat your personal record';
      return;
    }
  }
  await axios.post(`/scores`, {dots: numDots, score: lastScore.toFixed(2), name: name.value});
  message.innerHTML = 'Score submitted!';
  showLeaderboard();
  submit.disabled = true;
}

start.addEventListener('click', startGame);
leaderboardbutton.addEventListener('click', showLeaderboard);
submit.addEventListener('click', submitToLeaderboard);
requestAnimationFrame(frame);
