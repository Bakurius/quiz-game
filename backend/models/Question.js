const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  category: { type: String, required: true }, // e.g., "Math", "Science"
  question: { type: String, required: true },
  options: { type: [String], required: true }, // Array of 4 options
  answer: { type: String, required: true }, // Correct answer (must be in options)
});

module.exports = mongoose.model("Question", questionSchema);
