require("dotenv").config();
const express = require("express");

const app = express();

// Middleware pour parser le JSON
app.use(express.json());

// Connect to database
// MongoDB Mongoose et dotenv
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const url = process.env.DATABASE_URL;
mongoose
  .connect(url)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// EJS : 
app.set('view engine', 'ejs');

// Routes de base
app.get("/", (req, res) => {
  res.render("index", { name: "Visitor" });
});


app.post("/quiz", (req, res) => {
  const { question, options, answer } = req.body;
  // Logique pour sauvegarder le quiz dans MongoDB
  res.status(201).send("Quiz créé");
});


const PORT = 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
