document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/api/check-auth", { credentials: "include" });
    if (!response.ok) {
      window.location.href = "/login.html";
      return;
    }
    const user = await response.json();

    // Display user info
    document.getElementById("username").textContent = user.username;
    document.getElementById("email").textContent = user.email;

    const scoreResponse = await fetch(`/api/rankings`);
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
          window.location.href = "/login.html";
        } catch (error) {
          console.error("Error logging out:", error);
        }
      });
  } catch (error) {
    console.error("Error fetching profile:", error);
    window.location.href = "/login.html";
  }
});
