document.addEventListener("DOMContentLoaded", async () => {
  const subjectButtonsDiv = document.getElementById("subject-buttons");
  const topicButtonsDiv = document.getElementById("topic-buttons");
  const contentSection = document.getElementById("content-section");
  const videoContainer = document.getElementById("video-container");
  const exercisesList = document.getElementById("exercises-list");

  // Fetch and display subjects
  try {
    const response = await fetch("/api/subjects");
    const subjects = await response.json();

    subjects.forEach((subject) => {
      const button = document.createElement("button");
      button.textContent = subject;
      button.addEventListener("click", () => showTopics(subject));
      subjectButtonsDiv.appendChild(button);
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);
  }

  // Show topics for a subject
  async function showTopics(subject) {
    subjectButtonsDiv.style.display = "none";
    topicButtonsDiv.style.display = "grid";
    topicButtonsDiv.innerHTML = "";

    try {
      const response = await fetch(`/api/topics/${subject}`);
      const topics = await response.json();

      topics.forEach((topic) => {
        const button = document.createElement("button");
        button.textContent = topic.topicName;
        button.addEventListener("click", () => showTopicContent(topic._id));
        topicButtonsDiv.appendChild(button);
      });
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  }

  // Show topic content (video and exercises)
  async function showTopicContent(topicId) {
    topicButtonsDiv.style.display = "none";
    contentSection.style.display = "block";

    try {
      const response = await fetch(`/api/topic/${topicId}`);
      const topic = await response.json();

      // Display video
      videoContainer.innerHTML = `<iframe width="560" height="315" src="${topic.videoUrl}" frameborder="0" allowfullscreen></iframe>`;

      // Display exercises
      exercisesList.innerHTML = "";
      topic.exercises.forEach((exercise, index) => {
        const exerciseDiv = document.createElement("div");
        exerciseDiv.classList.add("exercise");
        exerciseDiv.innerHTML = `
            <p>${exercise.question}</p>
            ${exercise.options
              .map(
                (option, i) => `
              <label>
                <input type="radio" name="exercise-${index}" value="${option}">
                ${option}
              </label><br>
            `
              )
              .join("")}
            <button onclick="submitExercise('${topic._id}', ${index}, '${
          exercise.answer
        }')">Submit</button>
            <p id="result-${index}"></p>
          `;
        exercisesList.appendChild(exerciseDiv);
      });
    } catch (error) {
      console.error("Error fetching topic:", error);
    }
  }

  // Submit exercise answer
  window.submitExercise = async (topicId, exerciseIndex, correctAnswer) => {
    const selectedOption = document.querySelector(
      `input[name="exercise-${exerciseIndex}"]:checked`
    );
    const resultDiv = document.getElementById(`result-${exerciseIndex}`);

    if (!selectedOption) {
      resultDiv.textContent = "Please select an option!";
      return;
    }

    const userAnswer = selectedOption.value;
    const isCorrect = userAnswer === correctAnswer;
    const score = isCorrect ? 10 : 0;

    resultDiv.textContent = isCorrect
      ? "Correct! +10 points"
      : "Incorrect. Try again!";
    resultDiv.style.color = isCorrect ? "green" : "red";

    if (isCorrect) {
      try {
        await fetch("/api/exercise-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ topicId, score, date: new Date() }),
        });
      } catch (error) {
        console.error("Error saving exercise score:", error);
      }
    }
  };
});
