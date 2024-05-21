// express & express-session
require("dotenv").config();
const express = require('express');
const session = require('express-session');
const path = require("path");
const app = express();

// Bcrypt
const bcrypt = require('bcrypt');

// Parser for JSON
app.use(express.json());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to database
// MongoDB Mongoose et dotenv
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Category = require("./models/Category");
const Note = require("./models/Note");
const Theme = require("./models/Theme");
const Quiz = require("./models/Quiz");
const url = process.env.DATABASE_URL;
mongoose
.connect(url)
.then(() => {
  console.log("MongoDB connected");
})
.catch((err) => {
  console.error("MongoDB connection error:", err);
});
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// Method-override :
  const methodOverride = require('method-override');
const { log } = require("console");
  app.use(methodOverride('_method'));

// EJS : 
app.set('view engine', 'ejs');

// Public folder
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("public"));

// Make available for all
const makeAvailable = async (req, res, next) => {
  try {
    const user = req.session.user;
    const selectedTheme = req.session.selectedTheme;
    let themes, notes, categories, quiz;
    if (user) {
      themes = await Theme.find({userId: user._id});
      notes = await Note.find({ userId: user._id, themeName: selectedTheme });
      categories = await Category.find({ userId: user._id, themeName: selectedTheme });
      quiz = await Quiz.find({ userId: user._id });
    } 
    res.locals.user = user;
    res.locals.themes = themes;
    res.locals.notes = notes;
    res.locals.categories = categories;
    res.locals.selectedTheme = selectedTheme;
    res.locals.quiz = quiz;
    next();
  } catch (err) {
    console.error("Error fetching themes and user:", err);
    res.render("error", { message: "Error fetching themes and user" });
  }
};
app.use(makeAvailable);


//---------------------------------ROOTS---------------------------------//


// SESSION SELECTED THEME
app.post('/selectTheme', (req, res) => {
  const selectedTheme = req.body.theme;
  
  // Vérifier si req.session.themes est défini
  if (req.session.themes && req.session.themes.length > 0) {
    // Réinitialiser les autres thèmes sélectionnés
    req.session.themes = req.session.themes.map(theme => ({
      ...theme,
      selected: theme.name === selectedTheme
    }));
  }

  // Enregistrer le nouveau thème sélectionné dans la session
  req.session.selectedTheme = selectedTheme;

  res.redirect(`/notes`); 
});



// INDEX
app.get("/", async (req, res) => {
  try {
    res.render("index", {
      user: res.locals.user,
      themes: res.locals.themes,
      notes: res.locals.notes,
      caterogies: res.locals.caterogies,
      selectedTheme: res.locals.selectedTheme,
    });
  } 
  catch (err) {
    console.error("Error rendering index:", err);
    res.render("error", { message: "Error rendering index" });
  }
});

// NOTES
app.get("/notes", async (req, res) => {
  try {
    res.render("notes", {
      user: res.locals.user,
      themes: res.locals.themes,
      notes: res.locals.notes,
      caterogies: res.locals.caterogies,
      selectedTheme: res.locals.selectedTheme,
    });
  } 
  catch (err) {
    console.error("Error rendering notes:", err);
    res.render("error", { message: "Error rendering Notes.ejs" });
  }
});

// ACCOUNT
app.get("/account", (req, res) => {
  try {
    res.render("account", {
      user: res.locals.user,
      themes: res.locals.themes,
      selectedTheme: res.locals.selectedTheme,
    });
  } catch (err) {
    console.error("Error rendering account:", err);
    res.render("error", { message: "Error rendering account" });
  }
});

// PUT ACCOUNT
app.put("/account/:id", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (req.body.email) { email = req.body.email; }
  if (req.body.password) {
    password = bcrypt.hashSync(req.body.password, 10);
  }
  const editData = { email, password };
  User.findByIdAndUpdate(req.params.id, editData)
    .then(() => {
      res.redirect(`/logout`);
    })
    .catch((err) => {
      console.log(err);
      res
        .status(500)
        .send("Echec de la mise à jour du compte.");
    });
});

// DELETE ACCOUNT
app.delete("/account/delete/:id", (req, res) => {
  User.findByIdAndDelete(req.params.id)
    .then(() => {
      res.redirect("/logout");
    })
    .catch((err) => {
      console.log(err);
    });
});

// GET REGISTER
app.get('/register', (req, res) => {
  res.render("RegisterForm", {user: res.locals.user});
});

// POST REGISTER
app.post('/register', function(req, res){
const userData = new User({
  name: req.body.name,
  email: req.body.email,
  password: bcrypt.hashSync(req.body.password,10),
  role: req.body.role
  })
  userData.save()
    .then(()=>{ res.redirect('/login')})
    .catch((err)=>{console.log(err); 
  });
});

// GET LOGIN
app.get('/login', (req, res) => {
res.render("LoginForm", { user: res.locals.user });});

// POST LOGIN
app.post('/login', (req, res) => {
User.findOne({ email: req.body.email }).then(user => {
  if (!user) {res.send('email invalide');}
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    res.send('Mot de passe invalide');}
  req.session.user = user;
  res.redirect('/');
})
.catch(err => console.log(err));
});

// GET LOGOUT
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {console.log(err);} 
    else {res.redirect('/login');}
  });
});

// POST ADD THEME
app.post('/addtheme', function(req, res){
const themeData = new Theme({
  themeName: req.body.themeName,
  userId: req.body.userId,
  })
  themeData
    .save()
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
});

// ADD NOTE AND CATEGORY
app.post("/addnote", async function (req, res) {
  let newCategoryName = req.body.selectedCategory;
  if (newCategoryName === "newCat") {
    newCategoryName = req.body.newCategory;
  }
  if (!newCategoryName || typeof newCategoryName !== "string") {
    newCategoryName = "uncategorized";
  }
  const themeName = req.body.themeName;
  const userId = req.body.userId;
  try {
    // Recherche de la catégorie existante
    let existingCategory = await Category.findOne({
      categoryName: newCategoryName,
      themeName,
      userId,
    });
    // Si aucune catégorie correspondante n'est trouvée 
    if (!existingCategory && newCategoryName) {
      existingCategory = await Category.create({
        categoryName: newCategoryName,
        themeName,
        userId,
      });
    }
    // Création de la note avec la catégorie déterminée
    const noteData = new Note({
      front: req.body.front,
      back: req.body.back,
      example: req.body.example,
      categoryName: newCategoryName,
      themeName,
      userId,
    });
    await noteData.save();
    res.redirect("/notes");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding note");
  }
});

// PUT NOTE 
app.put("/editnote/:id", async (req, res) => {
  let front = req.body.front;
  let back = req.body.back;
  let example = req.body.example;
  let newCategoryName = req.body.selectedCategory;

  // Vérification si une nouvelle catégorie est sélectionnée
  if (newCategoryName === "newCat") {
    newCategoryName = req.body.newCategory;
  }

  // Vérification de la validité de la catégorie
  if (!newCategoryName || typeof newCategoryName !== "string") {
    newCategoryName = "uncategorized";
  }

  const themeName = req.body.themeName;
  const userId = req.body.userId;

  try {
    // Recherche de la note à mettre à jour
    const noteToUpdate = await Note.findById(req.params.id);
    if (!noteToUpdate) {
      return res.status(404).send("Note not found");
    }

    // Mettre à jour les données de la note
    noteToUpdate.front = front;
    noteToUpdate.back = back;
    noteToUpdate.example = example;
    noteToUpdate.categoryName = newCategoryName;
    noteToUpdate.themeName = themeName;
    noteToUpdate.userId = userId;

    // Sauvegarder les modifications de la note
    await noteToUpdate.save();

    // Recherche de la catégorie existante
    let existingCategory = await Category.findOne({
      categoryName: newCategoryName,
      themeName,
      userId,
    });

    // S'il ne trouve pas de catégorie, créer new catégorie
    if (!existingCategory && newCategoryName) {
      existingCategory = await Category.create({
        categoryName: newCategoryName,
        themeName,
        userId,
      });
    }

    res.redirect("/notes");
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to update note");
  }
});

// DELETE NOTE
app.delete("/note/delete/:id", (req, res) => {
  Note.findByIdAndDelete(req.params.id)
    .then(() => {
      res.redirect("/notes");
    })
    .catch((err) => {
      console.log(err);
    });
});

// SESSION SELECTED CATEGORY
app.post('/selectCategory', (req, res) => {
  const selectedCategory = req.body.categoryName;
  res.redirect(`/quiz/${selectedCategory}`); 
});

// Quiz
app.get("/quiz", async (req, res) => {
  try {
    const selectedTheme = res.locals.selectedTheme;
    const allNotes = res.locals.notes.filter(note => note.themeName === selectedTheme);
    // Compter le nombre d'occurrences de chaque catégorie dans le thème sélectionné
    const categoryCounts = [];
    allNotes.forEach(note => {
      const index = categoryCounts.findIndex(
        item => item.categoryName === note.categoryName
      );
      if (index !== -1) {
        categoryCounts[index].count++;
      } else {
        categoryCounts.push({ categoryName: note.categoryName, count: 1 });
      }
    });
    // Filtrer les catégories qui ont au moins 10 occurrences
    const categoriesFilter = categoryCounts.filter(
      item => item.count >= 10).map(item => item.categoryName
      );
    res.render("quiz", {
      user: res.locals.user,
      themes: res.locals.themes,
      notes: res.locals.notes,
      categories: categoriesFilter,
      selectedTheme: selectedTheme,
    });
  } catch (err) {
    console.error("Error rendering quiz:", err);
    res.render("error", { message: "Error rendering Quiz.ejs" });
  }
});

// Quiz game
app.get("/quiz/:category", async (req, res) => {
  try {
    const selectedCategory = req.params.category;
    let notes;
    if (selectedCategory === "all") {
      notes = res.locals.notes;
    } else {
      notes = res.locals.notes.filter(note => note.categoryName === selectedCategory);
    }
    const randomNotes = getRandomNotes(notes, 6); // EDIT FOR 10 NOTES

    function getRandomNotes(notes, count) {
      const randomNotes = [];
      const totalNotes = notes.length;
      const numNotes = Math.min(count, totalNotes);
      while (randomNotes.length < numNotes) {
        const randomIndex = Math.floor(Math.random() * totalNotes);
        if (!randomNotes.includes(notes[randomIndex])) { 
          randomNotes.push(notes[randomIndex]);
        }
      }
      return randomNotes;
    }
    
    res.render("quizGame", {
      user: res.locals.user,
      themes: res.locals.themes,
      notes: res.locals.notes,
      selectedCategory: selectedCategory,
      selectedTheme: res.locals.selectedTheme,
      randomNotes: randomNotes,
    });
  } catch (err) {
    console.error("Error rendering quiz:", err);
    res.render("error", { message: "Error rendering Quiz.ejs" });
  }
});

// ADD quizz
app.post("/addquiz", async function (req, res) {
  try {
    let score = 0;
    let data = [];
    for (let i = 0; i < 6; i++) { // EDIT FOR 10 NOTES
      let front = req.body["front" + i].toLowerCase(); 
      let frontParts = req.body["front" + i].split("/");
      let answer = req.body["answer" + i].toLowerCase();
      if (answer === "") { answer = "no text"; }
      if (front === answer || frontParts.some(part => part.toLowerCase() === answer)) {
        data.push([
          req.body["back" + i],
          answer,
        ]);
        score++;
      } else {
        data.push([
          req.body["back" + i],
          req.body["front" + i],
          answer,
        ]);
      }
    }
    const selectedTheme = req.session.selectedTheme;
    const quizData = new Quiz({
      userId: res.locals.user,
      themeName: selectedTheme, 
      categoryName: req.body.categoryName, 
      score: score,
      data: data,
    });
    await quizData.save();
    res.redirect("/score");
  }
  catch (err) {
    console.log(err);
    res.render("error", { message: "error page addquiz" });
  }
});

// Score
app.get("/score", async (req, res) => {
  try {
    const latestQuiz = await Quiz.findOne({ userId: res.locals.user }).sort({ _id: -1 }).limit(1);
    const score = latestQuiz.score;
    let prize = "";
    let color = "";
    if (score > 4) {
      prize = "Amazing !";
      color = "text-success";
    } else if (score >= 3) {
      prize = "Good !";
      color = "text-3";
    } else {
      prize = "Can do better !";
      color = "text-danger";
    }
    res.render("score", {
      user: res.locals.user,
      notes: res.locals.notes,
      latestQuiz: latestQuiz,
      prize,
      color,
    });
  } catch (err) {
    console.error("Error rendering quiz:", err);
    res.render("error", { message: "Error rendering Quiz.ejs" });
  }
});





const PORT = 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
