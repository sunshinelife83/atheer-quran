let theme;

try {
  theme = localStorage.getItem("atheer_theme");
} catch (error) {
  console.warn("[أثير] Could not restore the appearance preference.", error);
}

if (theme !== "light" && theme !== "dark") {
  theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

document.documentElement.dataset.theme = theme;

document.addEventListener("click", (event) => {
  const toggle = event.target.closest?.("[data-theme-toggle]");
  if (!toggle) return;

  theme = theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("atheer_theme", theme);
  } catch (error) {
    console.warn("[أثير] Could not save the appearance preference.", error);
  }
});
