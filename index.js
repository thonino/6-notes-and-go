require("dotenv").config();
const express = require("express");
const connectDB = require("./database");

const app = express();

// Middleware pour parser le JSON
app.use(express.json());

// Connect to database
connectDB();

// Routes de base
app.get("/", (req, res) => {
  res.send("API Running");

app.post("/quiz", (req, res) => {
    const { question, options, answer } = req.body;
    // Logique pour sauvegarder le quiz dans MongoDB
    res.status(201).send("Quiz créé");
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
