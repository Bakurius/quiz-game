const mongoose = require("mongoose");

const exerciseScoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Topic",
    required: true,
  },
  exerciseIndex: { type: Number, required: true }, // Add exerciseIndex to track specific exercise
  score: { type: Number, required: true },
  date: { type: Date, required: true },
});

module.exports = mongoose.model("ExerciseScore", exerciseScoreSchema);
