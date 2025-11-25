import express from "express";
import fs from "fs";
import cors from "cors";
const app = express();
app.use(express.json());
// Allow Shopify + local dev to call the API
app.use(
  cors({
    origin: ["https://*.myshopify.com", "https://admin.shopify.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

const FILE = "./data/users.json";

// Helper to read JSON file
function readUsers() {
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

// Helper to write JSON file
function writeUsers(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// GET all users
app.get("/api/users", (req, res) => {
  res.json(readUsers());
});

// GET user by id
app.get("/api/users/:id", (req, res) => {
  const users = readUsers();
  const user = users.find((u) => u.id === req.params.id);
  res.json(user ?? { error: "User not found" });
});

// CREATE user
app.post("/api/users", (req, res) => {
  const users = readUsers();

  const nextId =
    users.length > 0
      ? (parseInt(users[0].id) + 1).toString() // IMPORTANT: read newest ID now at index 0
      : "1";

  const newUser = { id: nextId, ...req.body };
  users.unshift(newUser); // <-- NEWEST FIRST
  writeUsers(users);
  res.json(newUser);
});

// UPDATE user
app.put("/api/users/:id", (req, res) => {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === req.params.id);
  if (index === -1) return res.json({ error: "User not found" });
  users[index] = { ...users[index], ...req.body };
  writeUsers(users);
  res.json(users[index]);
});

// DELETE user
app.delete("/api/users/:id", (req, res) => {
  let users = readUsers();
  users = users.filter((u) => u.id !== req.params.id);
  writeUsers(users);
  res.json({ success: true });
});

app.listen(process.env.PORT || 3000, () => console.log("Server running..."));

// BULK-DELETE users
app.post("/api/users/bulk-delete", (req, res) => {
  let users = readUsers();
  const idsToDelete = req.body.ids;

  if (!Array.isArray(idsToDelete)) {
    return res.status(400).json({ error: "ids must be an array" });
  }

  users = users.filter((u) => !idsToDelete.includes(u.id));
  console.log(users);
  writeUsers(users);
  res.json({ success: true });
});

// BULK-CREATE users
app.post("/api/users/bulk-create", (req, res) => {
  let users = readUsers();
  const usersToCreate = req.body.users;

  if (!Array.isArray(usersToCreate)) {
    return res.status(400).json({ error: "users must be an array" });
  }
  let nextId = parseInt(users[0].id) + 1;

  for (let i = usersToCreate.length - 1; i >= 0; i--) {
    usersToCreate[i].id = nextId.toString();
    users.unshift(usersToCreate[i]); // <-- NEWEST FIRST
    writeUsers(users);
    nextId++;
  }
  res.json({ success: true, newUsers: usersToCreate });
});

app.listen(process.env.PORT || 3000, () => console.log("Server running..."));
