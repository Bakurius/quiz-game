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

      // Display user info
      document.getElementById("username").textContent = user.username;

      // Fetch and display scores
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

      // Logout button
      document
        .getElementById("logout-button")
        .addEventListener("click", async () => {
          try {
            await fetch("/api/logout", {
              method: "POST",
              credentials: "include",
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

  // Fetch scores on initial load
  fetchAndDisplayProfile();

  // Refresh scores when the page becomes visible (e.g., after navigating back)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      fetchAndDisplayProfile();
    }
  });
});
