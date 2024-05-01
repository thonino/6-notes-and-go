require("dotenv").config();
// express & express-session
const express = require('express');
const session = require('express-session');
const path = require("path");
const app = express();

// bcrypt
const bcrypt = require('bcrypt');

// Middleware pour parser le JSON
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

// Définir le dossier public pour servir des fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// ROUTE BASE
app.get("/", async (req, res) => {
  try {
    const user = req.session.user;
    let themes;
    if (user) {
      themes = await Theme.find({ userId: user._id });
    } else {
      themes = await Theme.find({});
    }
    res.render("index", { user, themes });
  } catch (err) {
    console.error("Error fetching themes:", err);
    res.render("error", { message: "Error fetching themes" });
  }
});


app.get("/account", (req, res) => {
  const user = req.session.user;
  res.render("account", { user: user });
});

// PUT EDIT ACCOUNT
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
  const user = req.session.user;
  res.render('RegisterForm', { user: user });
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
app.get('/login', (req, res) => {const user = req.session.user;
res.render('LoginForm', { user: user });});

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

const PORT = 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
