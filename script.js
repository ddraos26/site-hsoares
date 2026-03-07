const WHATSAPP_URL = "https://wa.me/5511972064288?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20H%20Soares%20Seguros%20e%20quero%20uma%20cota%C3%A7%C3%A3o.";

function trackEvent(name, params) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

function setupSmoothScroll() {
  const scrollButtons = document.querySelectorAll("[data-scroll]");
  scrollButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetSelector = button.getAttribute("data-scroll");
      const target = targetSelector ? document.querySelector(targetSelector) : null;
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function setupReveal() {
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
}

function setupCounterAnimation() {
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
}

function setupFloatingWhatsApp() {
  if (document.querySelector(".whatsapp-float")) {
    return;
  }

  const button = document.createElement("a");
  button.className = "whatsapp-float";
  button.href = WHATSAPP_URL;
  button.target = "_blank";
  button.rel = "noopener noreferrer";
  button.setAttribute("aria-label", "Abrir conversa no WhatsApp");
  button.innerHTML = '<span class="whatsapp-float-mark">WA</span><span>WhatsApp</span>';
  document.body.appendChild(button);
}

function setupWhatsAppTracking() {
  const links = document.querySelectorAll('a[href*="wa.me"]');
  links.forEach((link) => {
    link.addEventListener("click", () => {
      trackEvent("whatsapp_click", {
        event_category: "engagement",
        event_label: window.location.pathname,
      });
    });
  });
}

function setupLeadForm() {
  const leadForm = document.getElementById("lead-form");
  const feedbackNode = document.getElementById("form-feedback");
  if (!leadForm || !feedbackNode) {
    return;
  }

  const nextButton = document.getElementById("lead-next");
  const backButton = document.getElementById("lead-back");
  const panes = Array.from(document.querySelectorAll("[data-step-pane]"));
  const dots = Array.from(document.querySelectorAll("[data-dot]"));
  let currentStep = 1;

  const setStep = (step) => {
    currentStep = step;
    panes.forEach((pane) => {
      const paneStep = Number(pane.getAttribute("data-step-pane"));
      const isActive = paneStep === step;
      pane.hidden = !isActive;
      pane.classList.toggle("is-active", isActive);
    });

    dots.forEach((dot) => {
      const dotStep = Number(dot.getAttribute("data-dot"));
      dot.classList.toggle("is-active", dotStep === step);
    });
  };

  const requireFields = (fieldIds) => {
    for (const id of fieldIds) {
      const field = document.getElementById(id);
      if (!field) {
        continue;
      }
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  };

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      feedbackNode.textContent = "";
      if (!requireFields(["nome", "whatsapp"])) {
        return;
      }
      setStep(2);
      const produtoField = document.getElementById("produto");
      if (produtoField) {
        produtoField.focus();
      }
    });
  }

  if (backButton) {
    backButton.addEventListener("click", () => {
      feedbackNode.textContent = "";
      setStep(1);
    });
  }

  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (currentStep === 1) {
      if (!requireFields(["nome", "whatsapp"])) {
        return;
      }
      setStep(2);
      return;
    }

    if (!requireFields(["produto", "prazo"])) {
      return;
    }

    feedbackNode.style.color = "#1c2850";
    feedbackNode.textContent = "Enviando seus dados...";

    const formData = new FormData(leadForm);
    const payload = {
      nome: String(formData.get("nome") || "").trim(),
      whatsapp: String(formData.get("whatsapp") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      produto: String(formData.get("produto") || "").trim(),
      prazo: String(formData.get("prazo") || "").trim(),
      cidade: String(formData.get("cidade") || "").trim(),
      observacoes: String(formData.get("observacoes") || "").trim(),
      empresa_site: String(formData.get("empresa_site") || "").trim(),
      origem: "Site H Soares Seguros",
      pagina: window.location.pathname,
    };

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Falha no envio");
      }

      feedbackNode.style.color = "#197444";
      feedbackNode.textContent = "Recebemos seus dados. Nossa equipe comercial retornará em breve.";
      leadForm.reset();
      setStep(1);
      trackEvent("lead_form_submit", {
        event_category: "conversion",
        event_label: payload.produto || "nao_definido",
      });
    } catch (error) {
      feedbackNode.style.color = "#a01831";
      feedbackNode.textContent = "Não foi possível enviar agora. Fale conosco pelo WhatsApp: (11) 9 7206-4288.";
    }
  });
}

setupSmoothScroll();
setupReveal();
setupCounterAnimation();
setupFloatingWhatsApp();
setupWhatsAppTracking();
setupLeadForm();
