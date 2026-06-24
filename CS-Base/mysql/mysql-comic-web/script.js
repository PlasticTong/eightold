const debugButtons = document.querySelectorAll(".debug-board button");
const debugTip = document.querySelector("#debugTip");

debugButtons.forEach((button) => {
  button.addEventListener("click", () => {
    debugButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    debugTip.textContent = button.dataset.tip;
  });
});

const panels = document.querySelectorAll(".panel, .mini-card, .log-card");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  },
  { threshold: 0.12 }
);

panels.forEach((panel) => {
  panel.style.opacity = "0";
  panel.style.transform = "translateY(18px)";
  panel.style.transition = "opacity 420ms ease, transform 420ms ease";
  observer.observe(panel);
});
