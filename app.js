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

// Configurer le transporteur SMTP réutilisable pour l'envoi d'e-mails
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
const Lesson = require("./models/Lesson");
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
app.set('views', './views');

// Public folder
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("public"));

// Make available for all
const makeAvailable = async (req, res, next) => {
  try {
    const user = req.session.user;
    const selectedLesson = req.session.selectedLesson;
    const tips = req.session.tips; 
    let lessons, notes, categories, quizzes, tenQuizzes;
    if (user) {
      lessons = await Lesson.find({ userId: user._id });
      notes = await Note.find({ userId: user._id, lessonName: selectedLesson });
      categories = await Category.find({ userId: user._id, lessonName: selectedLesson });
      quizzes = await Quiz.find({ userId: user._id, lessonName: selectedLesson });
      tenQuizzes = await Quiz.find({ userId: user._id, lessonName: selectedLesson }).sort({ _id: -1 }).limit(10);
    }
    res.locals.user = user;
    res.locals.lessons = lessons;
    res.locals.notes = notes;
    res.locals.notesFull = notes;
    res.locals.categories = categories;
    res.locals.quizzes = quizzes;
    res.locals.tenQuizzes = tenQuizzes;
    res.locals.selectedLesson = selectedLesson;
    res.locals.tips = tips;
    next();
  } catch (err) {
    console.error("Erreur lors de la récupération des thèmes et de l'utilisateur :", err);
    res.render("error", { message: "Erreur lors de la récupération des thèmes et de l'utilisateur" });
  }
};

app.use(makeAvailable);

//------- Decommenter avant d'envoyer sur git -------//

const https = require('https');

function keepAlive() {
  setInterval(() => {
    https.get('https://easylearn-04vk.onrender.com/health', (res) => { 
      res.on('data', () => {});
      res.on('end', () => console.log('test ping successful.'));
    }).on('error', (err) => {
      console.log('test ping failed: ' + err.message);
    });
  }, 873737); // Intervalle de 14 minutes et 33 secondes
}

keepAlive();

// Endpoint de vérification pour keepAlive
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

//---------------------------------ROOTS---------------------------------//

// Session selected lesson
app.post('/selectLesson', (req, res) => {
  const selectedLesson = req.body.lesson;
  if (req.session.lessons && req.session.lessons.length > 0) {
    req.session.lessons = req.session.lessons.map(lesson => ({ // Reset the other lesson selected
      ...lesson, selected: lesson.name === selectedLesson
    }));
  }
  req.session.selectedLesson = selectedLesson; // New lesson selected
  res.redirect(`/notes`); 
});
app.post('/tips', (req, res) => {
  let tips = req.body.status;
  if (!tips || tips !== "d-none") { tips = ""; } 
  else { tips = "d-none"; }
  req.session.tips = tips;
  const referer = req.get('Referer');
  res.redirect(referer);
});

// INDEX
app.get("/", async (req, res) => {
  try {
    res.render("index", {
      user: res.locals.user,
      lessons: res.locals.lessons,
      notes: res.locals.notes,
      notesFull: res.locals.notesFull,
      caterogies: res.locals.caterogies,
      selectedLesson: res.locals.selectedLesson,
      quizzes: res.locals.quiz,
      tips: res.locals.tips,
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
      lessons: res.locals.lessons,
      selectedLesson: res.locals.selectedLesson,
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
app.delete("/account/delete/:id", async (req, res) => {
  try {
    const checkPassword = req.body.checkPassword;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    if (!bcrypt.compareSync(checkPassword, user.password)) {
      return res.status(400).send("Invalid password");
    }
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/logout");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to delete account");
  }
});

// GET REGISTER
app.get('/register', (req, res) => {
  res.render("registerForm", {user: res.locals.user});
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
  res.render("loginForm", { user: res.locals.user });
});

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

// GET FORGOT PASSWORD
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
      from: 'easylearn.freeapp@gmail.com',
      to: email,
      subject: 'Reset password',
      text: `Reset your password at this address: https://easylearn-04vk.onrender.com/reset/${token}`
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

// GET RESET PASSWORD
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

// POST ADD LESSON
app.post('/addlesson', function(req, res){
const lessonData = new Lesson({
  lessonName: req.body.lessonName,
  userId: req.body.userId,
  })
  lessonData
    .save()
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
});

// GET NOTES
app.get("/notes", async (req, res) => {
  try {
    let notes = res.locals.notes || [];
    let notesFull = res.locals.notesFull;
    const filter = req.query.categoryFilter; 
    const quizzes = res.locals.quiz;
    const search = req.query.search;
    if (search) {
      notes = notesFull.filter(note => 
        note.front.toLowerCase().includes(search.toLowerCase().trim()) ||
        note.back.toLowerCase().includes(search.toLowerCase().trim())
      );
    }
    if (filter) {
      notes = notes.filter(note => note.categoryName === filter);
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedNotes = notes.reverse().slice(startIndex, endIndex);
    const totalPages = Math.ceil(notes.length / limit);
    res.render("notes", {
      categories: res.locals.categories,
      selectedLesson: res.locals.selectedLesson,
      lessons: res.locals.lessons,
      notes: paginatedNotes,
      currentPage: page,
      notesFull, filter, search, quizzes, totalPages, limit
    });
  } catch (err) {
    console.error("Error rendering notes:", err);
    res.render("error", { message: "Error rendering notes" });
  }
});

// POST NOTES
app.post("/notes", async (req, res) => {
  try {
    const quizzes = res.locals.quiz;
    let notes = res.locals.notes || [];
    const filter = req.body.categoryFilter;
    let notesFull = res.locals.notesFull;
    const search = req.query.search;
    if (search) {
      notes = notesFull.filter(
        (note) =>
          note.front.toLowerCase().includes(search.toLowerCase().trim()) ||
          note.back.toLowerCase().includes(search.toLowerCase().trim())
      );
    }
    if (filter) {
      notes = notes.filter(note => note.categoryName === filter);
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedNotes = notes.slice(startIndex, endIndex);
    const totalPages = Math.ceil(notes.length / limit);
    res.render("notes", {
      categories: res.locals.categories,
      selectedLesson: res.locals.selectedLesson,
      lessons: res.locals.lessons,
      notes: paginatedNotes,
      currentPage: page,
      notesFull, filter, search, quizzes, totalPages, limit
    });
  } catch (err) {
    console.error("Error rendering notes:", err);
    res.render("error", { message: "Error rendering notes" });
  }
});

// POST ADD NOTE AND CATEGORY
app.post("/addnote", async function (req, res) {
  let newCategoryName = req.body.selectedCategory;
  if (newCategoryName === "newCat") {
    newCategoryName = req.body.newCategory;
  }
  if (!newCategoryName || typeof newCategoryName !== "string") {
    newCategoryName = "uncategorized";
  }
  const lessonName = req.body.lessonName;
  const userId = req.body.userId;
  try {
    let existingCategory = await Category.findOne({
      categoryName: newCategoryName,
      lessonName,
      userId,
    });
    if (!existingCategory && newCategoryName) {
      existingCategory = await Category.create({
        categoryName: newCategoryName,
        lessonName,
        userId,
      });
    }
    const noteData = new Note({
      front: req.body.front,
      back: req.body.back,
      example: req.body.example,
      categoryName: newCategoryName,
      lessonName,
      userId,
    });
    await noteData.save();
    if (req.body.action === "addMore") {
      // Si "Add More" a été cliqué, redirigez vers la page actuelle avec le modal ouvert
      return res.redirect('/notes?modal=open');
    }
    // Redirection normale si l'action n'est pas "Add More"
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
  if (newCategoryName === "newCat") { // Vérification si une nouvelle catégorie est sélectionnée
    newCategoryName = req.body.newCategory;
  }
  if (!newCategoryName || typeof newCategoryName !== "string") { // Vérification de la validité de la catégorie
    newCategoryName = "uncategorized";
  }
  const lessonName = req.body.lessonName;
  const userId = req.body.userId;
  try {
    const noteToUpdate = await Note.findById(req.params.id); // Recherche de la note à mettre à jour
    if (!noteToUpdate) {
      return res.status(404).send("Note not found");
    }
    noteToUpdate.front = front;
    noteToUpdate.back = back;
    noteToUpdate.example = example;
    noteToUpdate.categoryName = newCategoryName;
    noteToUpdate.lessonName = lessonName;
    noteToUpdate.userId = userId;
    await noteToUpdate.save(); // Sauvegarder les modifications de la note
    let existingCategory = await Category.findOne({ // Recherche de la catégorie existante
      categoryName: newCategoryName,
      lessonName,
      userId,
    });
    if (!existingCategory && newCategoryName) {  // S'il ne trouve pas de catégorie, créer new catégorie
      existingCategory = await Category.create({
        categoryName: newCategoryName,
        lessonName,
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
    const lessonName = noteData.lessonName;
    const categoryName= noteData.categoryName;
    let notes = res.locals.notes;
    notes = notes.filter(note => note.categoryName === noteData.categoryName);
    if(notes.length === 1){  // Supprimer catégorie si c'est le dernier
      await Category.findOneAndDelete({ userId, lessonName, categoryName });
    }
    await Note.findByIdAndDelete(req.params.id);  // Supprimer la note
    res.redirect("/notes");
  } catch (err) {
    console.error(err);
    res.render("error", { message: "Delete error" });
  }
});

// DELETE LESSONN
app.delete("/deletelesson", async (req, res) => {
  try {
    const userId = res.locals.user;
    const lessonName = res.locals.selectedLesson;
    await Note.deleteMany({ userId, lessonName }); // Delete all notes 
    await Category.deleteMany({ userId, lessonName }); // Delete all categories
    await Lesson.deleteOne({ userId, lessonName }); // Delete lesson
    delete req.session.selectedLesson; // Leave the session
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

// GET QUIZZ
app.get("/quiz", async (req, res) => {
  try {
    const selectedLesson = res.locals.selectedLesson;
    const allNotes = res.locals.notes.filter(note => note.lessonName === selectedLesson);
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
    const categoriesFilter = categoryCounts.filter( // Filter catégories 
      item => item.count >= 6).map(item => item.categoryName
      );
    res.render("quiz", {
      user: res.locals.user,
      lessons: res.locals.lessons,
      notes: res.locals.notes,
      categories: categoriesFilter,
      selectedLesson: selectedLesson,
    });
  } catch (err) {
    console.error("Error rendering quiz:", err);
    res.render("error", { message: "Error rendering Quiz.ejs" });
  }
});

// GET QUIZ GAME
app.get("/quiz/:category", async (req, res) => {
  try {
    const selectedCategory = req.params.category;
    let notes;
    if (selectedCategory === "all") {
      notes = res.locals.notes;
    } else {
      notes = res.locals.notes.filter(note => note.categoryName === selectedCategory);
    }
    const randomNotes = getRandomNotes(notes, 6); 
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
      lessons: res.locals.lessons,
      notes: res.locals.notes,
      selectedCategory: selectedCategory,
      selectedLesson: res.locals.selectedLesson,
      randomNotes: randomNotes,
    });
  } catch (err) {
    console.error("Error rendering quiz:", err);
    res.render("error", { message: "Error rendering Quiz.ejs" });
  }
});

// POST ADD QUIZ
app.post("/addquiz", async function (req, res) {
  try {
    let score = 0;
    let data = [];
    for (let i = 0; i < 6; i++) {
      // Supprimer les espaces pour comparaison
      let front = req.body["front" + i].toLowerCase().replace(/\s+/g, "");
      let frontParts = req.body["front" + i].split("/");

      // Conserver la version originale de la réponse pour l'affichage
      let answerOriginal = req.body["answer" + i];
      let answer = answerOriginal.toLowerCase().replace(/\s+/g, ""); 

      // Si la réponse est vide
      if (answer === "") { answer = "no answer"; }

      // Comparaison des réponses compactées
      if (
        front === answer || // Comparer la réponse complète
        frontParts.some(
          (part) => part.toLowerCase().replace(/\s+/g, "") === answer
        ) // Comparer les parties séparées par "/"
      ) {
      // Si la réponse est correcte, ajouter 1 point 
        data.push([req.body["back" + i], req.body["front" + i]]);
        score++;
      } else {
        // Sinon, stocker la réponse incorrecte
        data.push([
          req.body["back" + i],
          req.body["front" + i],
          answerOriginal,
        ]);
      }
    }

    // Création du quiz
    const selectedLesson = req.session.selectedLesson;
    const quizData = new Quiz({
      userId: res.locals.user,
      lessonName: selectedLesson,
      categoryName: req.body.categoryName,
      score: score, // Stocker le score calculé
      data: data, // Stocker les réponses
    });

    // Sauvegarder le quiz
    await quizData.save();

    // Redirection après la soumission
    res.redirect("/review");
  } catch (err) {
    console.log(err);
    res.render("error", { message: "error page addquiz" });
  }
});


// GET review
app.get("/review", async (req, res) => {
  try {
    const tenQuizzes = res.locals.tenQuizzes;
    let tenLastScores = [];
    tenQuizzes.forEach(item => {tenLastScores.push(item.score);});
    let sum = tenLastScores.reduce(
      (accumulator, currentValue) => accumulator + currentValue, 0);
    let average = tenLastScores.length > 0 ? sum / tenLastScores.length : 0;
    average = average.toFixed(1);
    let skip = parseInt(req.query.skip) || 0;
    if (req.query.next && skip < tenQuizzes.length - 1){ skip += 1 } 
    else if (req.query.prev && skip > 0) { skip -= 1 }
    const showQuiz = tenQuizzes[skip] || null;
    let prize = "";
    let color = "";
    if (showQuiz) {
      const score = showQuiz.score;
      if (score > 5 ) {
        prize = "Perfect !";
        color = "text-success";
      } else if (score > 3) {
        prize = "Good !";
        color = "text-info";
      } else if (score === 3) {
        prize = "Nice job !";
        color = "text-primary";
      } else {
        prize = "Can do better !";
        color = "text-danger";
      }
    }
    res.render("review", {
      user: res.locals.user,
      notes: res.locals.notes, 
      showQuiz, prize, color, tenQuizzes, skip, 
      totalQuizzes: tenQuizzes.length, average,
    });
  } catch (err) {
    console.error("Error rendering quiz: ", err);
    res.render("error", { message: "Error rendering Quiz.ejs" });
  }
});

// GET ERROR
app.get("/error", (req, res) => {
  res.render("error", { message: "An error occurred" });
});

// GET ALERT
app.get("/alert", (req, res) => {
  const message =  req.query.message;
  res.render("alert", { message });
});

// cmd windows-> tape : ipconfig -> ipv4 : 192.168.0.206:5000
const PORT = 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`App listening at http://localhost:${PORT}`);
// });
