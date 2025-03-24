document.addEventListener("DOMContentLoaded", async () => {
  const subjectButtonsDiv = document.getElementById("subject-buttons");
  const topicButtonsDiv = document.getElementById("topic-buttons");
  const topicGridDiv = topicButtonsDiv.querySelector(".topic-grid");
  const contentSection = document.getElementById("content-section");
  const videoContainer = document.getElementById("video-container");
  const exercisesList = document.getElementById("exercises-list");
  const exerciseScoreSpan = document.getElementById("exercise-score");

  // Make currentSubject globally accessible
  window.currentSubject = null;

  // Fetch and display initial exercise score
  async function fetchExerciseScore() {
    try {
      const response = await fetch("/api/rankings", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch rankings");
      const rankings = await response.json();
      const user = await fetch("/api/check-auth", {
        credentials: "include",
      }).then((res) => res.json());
      const userRanking = rankings.find((r) => r.username === user.username);
      exerciseScoreSpan.textContent = userRanking
        ? userRanking.exerciseScore
        : 0;
    } catch (error) {
      console.error("Error fetching exercise score:", error);
      exerciseScoreSpan.textContent = "0";
    }
  }

  fetchExerciseScore();

  // Fetch and display subjects
  try {
    const response = await fetch("/api/subjects");
    if (!response.ok)
      throw new Error(`Failed to fetch subjects: ${response.statusText}`);
    const subjects = await response.json();
    console.log("Fetched subjects:", subjects);

    if (subjects.length === 0) {
      subjectButtonsDiv.innerHTML = "<p>No subjects available.</p>";
      return;
    }

    subjects.forEach((subject) => {
      const button = document.createElement("button");
      button.textContent = subject;
      button.classList.add("subject-btn");
      button.addEventListener("click", () => showTopics(subject));
      subjectButtonsDiv.appendChild(button);
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    subjectButtonsDiv.innerHTML =
      "<p>Error loading subjects. Please try again later.</p>";
  }

  // Show subjects (go back to subject selection)
  window.showSubjects = function () {
    subjectButtonsDiv.style.display = "grid";
    topicButtonsDiv.style.display = "none";
    contentSection.style.display = "none";
    localStorage.setItem("learnState", JSON.stringify({ section: "subjects" }));
  };

  // Show topics for a subject
  window.showTopics = async function (subject) {
    window.currentSubject = subject;
    subjectButtonsDiv.style.display = "none";
    topicButtonsDiv.style.display = "block";
    contentSection.style.display = "none";
    topicGridDiv.innerHTML = "";

    try {
      const response = await fetch(`/api/topics/${subject}`);
      if (!response.ok)
        throw new Error(`Failed to fetch topics: ${response.statusText}`);
      const topics = await response.json();
      console.log("Fetched topics:", topics);

      if (topics.length === 0) {
        topicGridDiv.innerHTML = "<p>No topics available for this subject.</p>";
        return;
      }

      topics.forEach((topic) => {
        const button = document.createElement("button");
        button.textContent = topic.topicName;
        button.classList.add("topic-btn");
        button.addEventListener("click", () => showTopicContent(topic._id));
        topicGridDiv.appendChild(button);
      });

      localStorage.setItem(
        "learnState",
        JSON.stringify({ section: "topics", subject })
      );
    } catch (error) {
      console.error("Error fetching topics:", error);
      topicGridDiv.innerHTML =
        "<p>Error loading topics. Please try again later.</p>";
    }
  };

  // Show topic content (video and exercises)
  async function showTopicContent(topicId) {
    topicButtonsDiv.style.display = "none";
    contentSection.style.display = "block";

    try {
      const response = await fetch(`/api/topic/${topicId}`);
      if (!response.ok)
        throw new Error(`Failed to fetch topic: ${response.statusText}`);
      const topic = await response.json();
      console.log("Fetched topic:", topic);

      // Display video
      videoContainer.innerHTML = `<iframe width="100%" height="315" src="${topic.videoUrl}" frameborder="0" allowfullscreen></iframe>`;

      // Display exercises
      exercisesList.innerHTML = "";
      topic.exercises.forEach((exercise, index) => {
        const exerciseKey = `${topic._id}-${index}`;
        const isAnswered =
          localStorage.getItem(`exercise-${exerciseKey}`) === "answered";

        const exerciseDiv = document.createElement("div");
        exerciseDiv.classList.add("exercise");
        exerciseDiv.innerHTML = `
            <p class="exercise-question">${exercise.question}</p>
            ${exercise.options
              .map(
                (option, i) => `
              <label class="exercise-option">
                <input type="radio" name="exercise-${index}" value="${option}" ${
                  isAnswered ? "disabled" : ""
                }>
                ${option}
              </label>
            `
              )
              .join("")}
            <button class="submit-btn" onclick="submitExercise('${
              topic._id
            }', ${index}, '${exercise.answer}', this)" ${
          isAnswered ? "disabled" : ""
        }>
              ${
                isAnswered
                  ? '<span class="padlock">🔒 Answered</span>'
                  : "Submit"
              }
            </button>
            <p id="result-${index}" class="exercise-result"></p>
          `;
        exercisesList.appendChild(exerciseDiv);
      });

      localStorage.setItem(
        "learnState",
        JSON.stringify({ section: "content", topicId })
      );
    } catch (error) {
      console.error("Error fetching topic:", error);
      contentSection.innerHTML =
        "<p>Error loading topic. Please try again later.</p>";
    }
  }

  // Submit exercise answer
  window.submitExercise = async (
    topicId,
    exerciseIndex,
    correctAnswer,
    button
  ) => {
    const exerciseKey = `${topicId}-${exerciseIndex}`;
    const selectedOption = document.querySelector(
      `input[name="exercise-${exerciseIndex}"]:checked`
    );
    const resultDiv = document.getElementById(`result-${exerciseIndex}`);

    if (!selectedOption) {
      resultDiv.textContent = "Please select an option!";
      return;
    }

    // Disable the button and inputs to prevent spamming
    button.disabled = true;
    document
      .querySelectorAll(`input[name="exercise-${exerciseIndex}"]`)
      .forEach((input) => {
        input.disabled = true;
      });

    const userAnswer = selectedOption.value;
    const isCorrect = userAnswer === correctAnswer;
    const score = isCorrect ? 10 : 0;

    resultDiv.textContent = isCorrect
      ? "Correct! +10 points"
      : "Incorrect. Try again!";
    resultDiv.style.color = isCorrect ? "green" : "red";

    // Mark the exercise as answered in local storage
    localStorage.setItem(`exercise-${exerciseKey}`, "answered");

    if (isCorrect) {
      try {
        const response = await fetch("/api/exercise-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            topicId,
            exerciseIndex,
            score,
            date: new Date(),
          }),
        });
        if (!response.ok) throw new Error("Failed to save exercise score");
        fetchExerciseScore();
      } catch (error) {
        console.error("Error saving exercise score:", error);
        button.disabled = false;
        document
          .querySelectorAll(`input[name="exercise-${exerciseIndex}"]`)
          .forEach((input) => {
            input.disabled = false;
          });
      }
    }
  };

  // Restore state on page load
  const savedState = JSON.parse(localStorage.getItem("learnState"));
  if (savedState) {
    if (savedState.section === "topics" && savedState.subject) {
      showTopics(savedState.subject);
    } else if (savedState.section === "content" && savedState.topicId) {
      showTopicContent(savedState.topicId);
    }
  }
});
