document.addEventListener("DOMContentLoaded", async () => {
  async function fetchAndDisplayProfile() {
    try {
      const response = await fetch("/api/check-auth", {
        credentials: "include",
      });
      if (!response.ok) {
        console.error(
          "Authentication check failed:",
          response.status,
          response.statusText
        );
        window.location.href = "/login.html";
        return;
      }
      const user = await response.json();
      console.log("Authenticated user:", user);

      document.getElementById("username").textContent = user.username;

      const scoreResponse = await fetch("/api/rankings", {
        credentials: "include",
      });
      if (!scoreResponse.ok) {
        console.error(
          "Failed to fetch rankings:",
          scoreResponse.status,
          scoreResponse.statusText
        );
        throw new Error("Failed to fetch rankings");
      }
      const rankings = await scoreResponse.json();
      const userRanking = rankings.find((r) => r.username === user.username);
      document.getElementById("quiz-score").textContent = userRanking
        ? userRanking.quizScore
        : 0;
      document.getElementById("exercise-score").textContent = userRanking
        ? userRanking.exerciseScore
        : 0;

      document
        .getElementById("logout-button")
        .addEventListener("click", async () => {
          try {
            await fetch("/api/logout", {
              method: "POST",
              credentials: "include",
            });
            localStorage.removeItem("learnState"); // Clear learn state
            Object.keys(localStorage).forEach((key) => {
              if (key.startsWith("exercise-")) {
                localStorage.removeItem(key); // Clear answered exercises
              }
            });
            window.location.href = "/login.html";
          } catch (error) {
            console.error("Error logging out:", error);
          }
        });
    } catch (error) {
      console.error("Error fetching profile:", error);
      window.location.href = "/login.html";
    }
  }

  fetchAndDisplayProfile();

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      fetchAndDisplayProfile();
    }
  });
});
