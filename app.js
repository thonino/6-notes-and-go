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
  app.use(methodOverride('_method'));

// EJS : 
app.set('view engine', 'ejs');

// Public folder
app.use(express.static(path.join(__dirname, 'public')));


// Make available for all
const makeAvailable = async (req, res, next) => {
  try {
    const user = req.session.user;
    let themes, notes;
    if (user) {
      themes = await Theme.find({userId: user._id});
      notes = await Note.find({userId: user._id});
    } 
    res.locals.user = user;
    res.locals.themes = themes;
    res.locals.notes = notes;
    res.locals.selectedTheme = req.session.selectedTheme;
    next();
  } catch (err) {
    console.error("Error fetching themes and user:", err);
    res.render("error", { message: "Error fetching themes and user" });
  }
};

// Call for use
app.use(makeAvailable);

// ------------------------------------------------------------//
//                             ROOTS                           //
// ------------------------------------------------------------//


// SESSION SELECTED THEME
app.post('/selectTheme', (req, res) => {
  const selectedTheme = req.body.theme;
  req.session.selectedTheme = selectedTheme;
  res.redirect(req.get('referer')); 
});

// INDEX
app.get("/", async (req, res) => {
  try {
    res.render("index", {
      user: res.locals.user,
      themes: res.locals.themes,
      notes: res.locals.notes,
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

// POST ADD NOTE AND CATEGORY
app.post("/addnote", function (req, res) {
  // Création de la nouvelle catégorie
  const categoryData = new Category({
    categoryName: req.body.categoryName || "uncategorized",
    themeName: req.body.themeName,
    userId: req.body.userId,
  });
  categoryData
    .save()
    .then(() => {
      // Création de la nouvelle note
      const noteData = new Note({
        front: req.body.front,
        back: req.body.back,
        categoryName: categoryData.categoryName,
        themeName: req.body.themeName,
        userId: req.body.userId,
      });
      noteData
        .save()
        .then(() => {
          res.redirect("/");
        })
        .catch((err) => {
          console.log(err);
          res.status(500).send("Error creating note");
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Error creating category");
    });
});



const PORT = 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
