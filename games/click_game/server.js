const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

const FILE = "usernamePass.json";

// leggere utenti
function getUsers() {
  const data = fs.readFileSync(FILE);
  return JSON.parse(data);
}

// salvare utenti
function saveUsers(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// REGISTER
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  let data = getUsers();

  if (data.users.find(u => u.username === username)) {
    return res.json({ success: false, message: "Username già esistente" });
  }

  data.users.push({
    username,
    password,
    clicks: 0,
    level: 1,
    clickPower: 1,
    upgradeCost: 10
  });

  saveUsers(data);
  res.json({ success: true });
});

// LOGIN
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  let data = getUsers();

  const user = data.users.find(u => u.username === username && u.password === password);

  if (!user) return res.json({ success: false });

  // sicurezza campi
  if (!user.clickPower) user.clickPower = 1;
  if (!user.upgradeCost) user.upgradeCost = 10;

  res.json({ success: true, user });
});

// CLICK
app.post("/click", (req, res) => {
  const { username } = req.body;
  let data = getUsers();

  const user = data.users.find(u => u.username === username);
  if (!user) return res.sendStatus(404);

  user.clicks += user.clickPower;

  const needed = 10 * Math.pow(2, user.level - 1);
  if (user.clicks >= needed) {
    user.clicks -= needed;
    user.level++;
  }

  saveUsers(data);
  res.json(user);
});

// UPGRADE
app.post("/upgrade", (req, res) => {
  const { username } = req.body;
  let data = getUsers();

  const user = data.users.find(u => u.username === username);
  if (!user) return res.sendStatus(404);

  if (user.clicks >= user.upgradeCost) {
    user.clicks -= user.upgradeCost;
    user.clickPower += 0.1;
    user.upgradeCost *= 2;
  }

  saveUsers(data);
  res.json(user);
});

// CLASSIFICA
app.get("/leaderboard", (req, res) => {
  let data = getUsers();
  const sorted = data.users.sort((a,b) => b.level - a.level);
  res.json(sorted);
});

app.listen(3000, () => console.log("Server avviato su http://localhost:3000"));