// Mongodb et Mongoose :
const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema({
  categoryName: { type: "String" },
  themeName: { type: "String" },
  userId: { type: "String" },
});
module.exports = mongoose.model("Category", categorySchema);