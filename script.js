const scrollButtons = document.querySelectorAll("[data-scroll]");
const feedbackNode = document.getElementById("form-feedback");
const leadForm = document.getElementById("lead-form");

scrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetSelector = button.getAttribute("data-scroll");
    const target = targetSelector ? document.querySelector(targetSelector) : null;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

const revealTargets = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.22 }
);

revealTargets.forEach((node) => revealObserver.observe(node));

const counters = document.querySelectorAll("[data-count]");
const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const node = entry.target;
      const targetValue = Number(node.getAttribute("data-count") || "0");
      const suffix = node.getAttribute("data-suffix") || "";
      const duration = 900;
      const start = performance.now();

      const frame = (time) => {
        const progress = Math.min((time - start) / duration, 1);
        const current = Math.floor(progress * targetValue);
        node.textContent = `${current}${suffix}`;
        if (progress < 1) {
          requestAnimationFrame(frame);
        }
      };

      requestAnimationFrame(frame);
      countObserver.unobserve(node);
    });
  },
  { threshold: 0.4 }
);

counters.forEach((node) => countObserver.observe(node));

if (leadForm && feedbackNode) {
  leadForm.addEventListener("submit", (event) => {
    event.preventDefault();
    feedbackNode.textContent = "Recebemos seus dados. Nossa equipe comercial retornara em breve.";
    leadForm.reset();
  });
}
