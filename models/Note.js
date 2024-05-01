// Mongodb et Mongoose :
const mongoose = require("mongoose");
const noteSchema = new mongoose.Schema({
  Front: { type: "String" },
  Back: { type: "String" },
  themeName: { type: "String" },
  categoryName: { type: "String" },
});
module.exports = mongoose.model("Note", noteSchema);