// Mongodb et Mongoose :
const mongoose = require("mongoose");
const lessonSchema = new mongoose.Schema({
  lessonName: { type: "String" },
  userId: { type: "String"},
});
module.exports = mongoose.model("Lesson", lessonSchema);