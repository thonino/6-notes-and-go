// Mongodb et Mongoose :
const mongoose = require("mongoose");
const quizSchema = new mongoose.Schema({
  userName: { type: "String" },
  themeName: { type: "String" },
  categoryName: { type: "String" },
  score: { type: "Number" },
});
module.exports = mongoose.model("Quiz", quizSchema);


