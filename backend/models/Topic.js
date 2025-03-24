const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: String, required: true },
});

const topicSchema = new mongoose.Schema({
  subject: { type: String, required: true }, // e.g., "მათემატიკა"
  topicName: { type: String, required: true }, // e.g., "Solve Quadratic Functions"
  videoUrl: { type: String, required: true }, // YouTube embed URL
  exercises: [exerciseSchema], // List of exercises
});

module.exports = mongoose.model("Topic", topicSchema);
