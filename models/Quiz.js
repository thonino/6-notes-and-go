// Mongodb et Mongoose :
const mongoose = require("mongoose");
const quizSchema = new mongoose.Schema({
  userId: { type: "String" },
  lessonName: { type: "string" },
  categoryName: { type: "String" },
  score: { type: "Number" },
  data: { type: "Array" },
});
module.exports = mongoose.model("Quiz", quizSchema);


