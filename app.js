require("dotenv").config();
// express & express-session
const express = require('express');
const session = require('express-session');
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

// Routes de base
app.get("/", (req, res) => {
  const user = req.session.user;
  res.render("index", { user: user });
});

app.get("/account", (req, res) => {
  const user = req.session.user;
  res.render("account", { user: user });
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
User.findOne({ name: req.body.name }).then(user => {
  if (!user) {res.send('Name invalide');}
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

const PORT = 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
