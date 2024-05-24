// express & express-session
require("dotenv").config();
const express = require('express');
const session = require('express-session');
const path = require("path");
const app = express();

// Bcrypt et crypto
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const nodemailer = require('nodemailer');

// Configurez le transporteur SMTP réutilisable pour l'envoi d'e-mails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS
  }
});

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
app.put("/account/:id", async (req, res) => {
  const { newEmail, newPassword, checkPassword } = req.body;
  try {
    const user = await User.findById(req.params.id);

    if (!bcrypt.compareSync(checkPassword, user.password)) {
      return res.status(400).send("Invalid password");
    }

    if (newEmail) {
      const emailExists = await User.findOne({ email: newEmail });
      if (emailExists) {
        return res.status(400).send("Email already in use");
      }
      user.email = newEmail;
    }

    if (newPassword) {
      user.password = bcrypt.hashSync(newPassword, 10);
    }

    await user.save();
    req.session.destroy();
    res.redirect('/alert?message=Successfully updated account');
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to update account");
  }
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
  if (!user) {res.send('Invalid email');}
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    res.send('Invalid password');
  }
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


// Forgot password
app.get('/passwordforgot', (req, res) => {
  res.render('passwordForgot');
});
app.post('/passwordforgot', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send("Email address not found"); // email
    }
    const token = crypto.randomBytes(20).toString('hex');
    user.token = token;
    user.tokenExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const mailOptions = {
      from: 'sixnotesandgo@gmail.com',
      to: email,
      subject: 'Reset password',
      text: `Reset your password at this address: http://localhost:5000/reset/${token}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).send("error sending email");
      }
      res.redirect(`/alert?message=Please check your email box: ${ email }`);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Reset request error");
  }
});

// Reset password
app.get('/reset/:token', (req, res) => {
  const token = req.params.token;
  res.render('passwordReset', { token });
});
app.post('/passwordreset', async (req, res) => {
  const { token, password } = req.body;
  try {
    const user = await User.findOne({
      token: token,
      tokenExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).send("Invalid or expired token");
    }
    user.password = bcrypt.hashSync(password, 10);
    user.token = undefined;
    user.tokenExpires = undefined;
    await user.save();
    res.redirect(`/alert?message=Successfully resetting password`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Reset password error");
  }
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


// NOTES
async function renderNotes(req, res, filter) {
  try {
    let notes = res.locals.notes;
    if (filter) {
      notes = notes.filter(note => note.categoryName === filter);
    }
    res.render("notes", {
      user: res.locals.user,
      themes: res.locals.themes,
      notes,
      categories: res.locals.categories,
      selectedTheme: res.locals.selectedTheme,
    });
  } catch (err) {
    console.error("Error rendering notes:", err);
    res.render("error", { message: "Error rendering Notes.ejs" });
  }
}

// Route GET "/notes"
app.get("/notes", async (req, res) => {
  const filter = req.body.categoryFilter;
  await renderNotes(req, res, filter);
});

// Route POST "/notes"
app.post("/notes", async (req, res) => {
  const filter = req.body.categoryFilter;
  await renderNotes(req, res, filter);
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
app.delete("/note/delete/:id", async (req, res) => {
  try {
    const noteData = await Note.findById(req.params.id);
    if (!noteData) {
      return res.status(404).json({ message: "Note not found" });
    }
    const userId = noteData.userId;  ;
    const themeName = noteData.themeName;
    const categoryName= noteData.categoryName;
    let notes = res.locals.notes;
    notes = notes.filter(note => note.categoryName === noteData.categoryName);

    // Supprimer catégorie si c'est le dernier
    if(notes.length === 1){
      await Category.findOneAndDelete({ userId, themeName, categoryName });
    }

    // Supprimer la note
    await Note.findByIdAndDelete(req.params.id);

    res.redirect("/notes");
  } catch (err) {
    console.error(err);
    res.render("error", { message: "Delete error" });
  }
});

// DELETE THEME
app.delete("/deletetheme", async (req, res) => {
  try {
    const userId = res.locals.user;
    const themeName = res.locals.selectedTheme;
    await Note.deleteMany({ userId, themeName }); // Delete all notes 
    await Category.deleteMany({ userId, themeName }); // Delete all categories
    await Theme.deleteOne({ userId, themeName }); // Delete theme
    delete req.session.selectedTheme; // Leave the session
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.render("error", { message: "Delete error" });
  }
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
    // Filtrer les catégories qui ont au moins 6 occurrences
    const categoriesFilter = categoryCounts.filter(
      item => item.count >= 6).map(item => item.categoryName
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
      if (answer === "") { answer = "no answer"; }
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
    res.redirect("/stats");
  }
  catch (err) {
    console.log(err);
    res.render("error", { message: "error page addquiz" });
  }
});

// stats
app.get("/stats", async (req, res) => {
  try {
    const latestQuiz = await Quiz.findOne({ userId: res.locals.user }).sort({ _id: -1 }).limit(2);
    const quizzes = await Quiz.find({ userId: res.locals.user });
    
    let prize = "";
    let color = "";
    if(latestQuiz){
      const score = latestQuiz.score;
      if (score && score > 4) {
        prize = "Amazing !!!";
        color = "text-success";
      } else if (score > 3 ) {
        prize = "Good !!";
        color = "text-2";
      } else {
        prize = "Can do better !";
        color = "text-danger";
      }
    }
    res.render("stats", {
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

// Error
app.get("/error", (req, res) => {
  res.render("error", { message: "An error occurred" });
});

// Alert
app.get("/alert", (req, res) => {
  const message =  req.query.message;
  res.render("alert", { message });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
