const toggleButton = document.getElementById("theme-toggle");
const storedTheme = localStorage.getItem("theme");

const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

let currentTheme = storedTheme;

// Determine the initial theme — default to dark if not previously set
if (!currentTheme) {
  currentTheme = "dark-mode";
}

// Apply the initial theme
if (currentTheme === "dark-mode") {
  document.body.classList.add("dark-mode");
  toggleButton.textContent = "☀️ Theme";
} else {
  document.body.classList.remove("dark-mode");
  toggleButton.textContent = "🌙 Theme";
}

// Toggle theme on button click
toggleButton.addEventListener("click", function () {
  document.body.classList.toggle("dark-mode");

  let theme;
  if (document.body.classList.contains("dark-mode")) {
    theme = "dark-mode";
    toggleButton.textContent = "☀️ Theme";
  } else {
    theme = "light-mode";
    toggleButton.textContent = "🌙 Theme";
  }

  localStorage.setItem("theme", theme);
});
