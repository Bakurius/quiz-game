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

  // Function to reset all sections to hidden
  function resetSections() {
    console.log("Resetting sections...");
    subjectButtonsDiv.style.display = "none";
    topicButtonsDiv.style.display = "none";
    contentSection.style.display = "none";
    // Clear content to prevent overlap
    subjectButtonsDiv.innerHTML = "";
    topicGridDiv.innerHTML = "";
    videoContainer.innerHTML = "";
    exercisesList.innerHTML = "";
  }

  // Fetch and display subjects
  async function loadSubjects() {
    console.log("Loading subjects section...");
    resetSections();
    subjectButtonsDiv.style.display = "grid";

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

      // Add the rankings button first
      const rankingsButton = document.createElement("button");
      rankingsButton.textContent = "Rankings";
      rankingsButton.classList.add("rankings-btn");
      rankingsButton.addEventListener("click", showRankingsModal);
      subjectButtonsDiv.appendChild(rankingsButton);

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
  }

  // Show subjects (go back to subject selection)
  window.showSubjects = function () {
    console.log("Showing subjects section...");
    resetSections();
    subjectButtonsDiv.style.display = "grid";
    loadSubjects(); // Reload subjects to ensure fresh data
    localStorage.setItem("learnState", JSON.stringify({ section: "subjects" }));
  };

  // Show topics for a subject
  window.showTopics = async function (subject) {
    console.log("Showing topics section for subject:", subject);
    window.currentSubject = subject;
    resetSections();
    topicButtonsDiv.style.display = "block";

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
    console.log("Showing content section for topic:", topicId);
    resetSections();
    contentSection.style.display = "block";

    try {
      const response = await fetch(`/api/topic/${topicId}`);
      if (!response.ok)
        throw new Error(`Failed to fetch topic: ${response.statusText}`);
      const topic = await response.json();
      console.log("Fetched topic:", topic);

      // Display video
      videoContainer.innerHTML = `<iframe width="100%" height="315" src="${topic.videoUrl}" frameborder="0" allowfullscreen></iframe>`;

      // Fetch answered exercises for the user
      const user = await fetch("/api/check-auth", {
        credentials: "include",
      }).then((res) => res.json());
      const answeredResponse = await fetch(
        `/api/answered-exercises/${user.userId}/${topicId}`,
        { credentials: "include" }
      );
      const answeredExercises = await answeredResponse.json();
      console.log("Answered exercises:", answeredExercises);

      // Display exercises
      exercisesList.innerHTML = "";
      topic.exercises.forEach((exercise, index) => {
        const exerciseKey = `${topic._id}-${index}`;
        const isAnswered = answeredExercises.includes(exerciseKey);

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

  // Submit exercise answer (Updated to Fix +10 Points Visual Bug)
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

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit exercise");
      }

      // Only show the result if the submission was successful
      resultDiv.textContent = isCorrect
        ? "Correct! +10 points"
        : "Incorrect. Try again!";
      resultDiv.style.color = isCorrect ? "green" : "red";
      button.innerHTML = '<span class="padlock">🔒 Answered</span>';

      // Update the exercise score display
      fetchExerciseScore();
    } catch (error) {
      console.error("Error submitting exercise:", error);
      resultDiv.textContent = error.message;
      resultDiv.style.color = "red";
      // Re-enable the button and inputs if the submission fails
      button.disabled = false;
      document
        .querySelectorAll(`input[name="exercise-${exerciseIndex}"]`)
        .forEach((input) => {
          input.disabled = false;
        });
    }
  };

  // Add event listener to "Go Back to Home" button to clear state
  document.getElementById("back-to-index").addEventListener("click", () => {
    localStorage.removeItem("learnState"); // Clear state when navigating to index.html
  });

  // Restore state on page load
  const savedState = JSON.parse(localStorage.getItem("learnState"));
  console.log("Restoring state:", savedState);
  if (savedState) {
    if (savedState.section === "topics" && savedState.subject) {
      showTopics(savedState.subject);
    } else if (savedState.section === "content" && savedState.topicId) {
      showTopicContent(savedState.topicId);
    } else {
      loadSubjects(); // Default to subjects if state is invalid
    }
  } else {
    loadSubjects(); // Default to subjects if no state is saved
  }

  // Rankings Modal Functions
  let rankingsData = [];
  let currentSortBy = "totalScore";

  async function fetchRankings(sortBy = "totalScore") {
    try {
      const response = await fetch(`/api/rankings?sortBy=${sortBy}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch rankings");
      }
      rankingsData = await response.json();
      currentSortBy = sortBy;
      displayRankings();
    } catch (error) {
      console.error("Error fetching rankings:", error);
      const tableBody = document.getElementById("rankings-table-body");
      tableBody.innerHTML =
        "<tr><td colspan='4'>Error loading rankings. Please try again later.</td></tr>";
    }
  }

  function displayRankings() {
    const tableBody = document.getElementById("rankings-table-body");
    tableBody.innerHTML = "";
    rankingsData.forEach((user) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${user.username}</td>
          <td>${user.quizScore}</td>
          <td>${user.exerciseScore}</td>
          <td>${user.totalScore}</td>
        `;
      tableBody.appendChild(row);
    });
  }

  function sortRankings(sortBy) {
    if (currentSortBy === sortBy) {
      rankingsData.reverse();
      displayRankings();
    } else {
      fetchRankings(sortBy);
    }
  }

  window.showRankingsModal = function () {
    fetchRankings("totalScore"); // Default sort by totalScore
    const modal = document.getElementById("rankings-modal");
    modal.classList.add("show"); // Add the 'show' class to display with flex
  };

  window.closeRankingsModal = function () {
    const modal = document.getElementById("rankings-modal");
    modal.classList.remove("show"); // Remove the 'show' class to hide
  };

  // Close modal when clicking outside
  window.onclick = function (event) {
    const modal = document.getElementById("rankings-modal");
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
});
