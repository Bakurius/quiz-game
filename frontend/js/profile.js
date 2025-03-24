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

    // Fetch ranking score
    const scoreResponse = await fetch(`/api/rankings`);
    const rankings = await scoreResponse.json();
    const userRanking = rankings.find((r) => r.username === user.username);
    document.getElementById("ranking-score").textContent = userRanking
      ? userRanking.totalScore
      : 0;
  } catch (error) {
    console.error("Error fetching profile:", error);
    window.location.href = "/login.html";
  }
});
