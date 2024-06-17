// Mongodb et Mongoose :
const mongoose = require("mongoose");
const noteSchema = new mongoose.Schema({
  front: { type: "String" },
  back: { type: "String" },
  categoryName: { type: "String" },
  example: { type: "String" },
  lessonName: { type: "String" },
  userId: { type: "String" },
});
module.exports = mongoose.model("Note", noteSchema);