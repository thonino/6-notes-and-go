// Mongodb et Mongoose :
const mongoose = require("mongoose");
const quizSchema = new mongoose.Schema({
  userName: { type: "String" },
  themeName: { type: "string" },
  categoryName: { type: "String" },
  score: { type: "Number" },
  data: { type: "Array" },
});
module.exports = mongoose.model("Quiz", quizSchema);


