(() => {
  "use strict";

  const NAME = CONFIG.herName;
  const withName = (str) => str.replaceAll("{{NAME}}", NAME);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ----------------------------------------------------------
  // TEXT INJECTION (cover, overlays)
  // ----------------------------------------------------------
  document.getElementById("cover-title").textContent = withName(CONFIG.cover.title);
  document.getElementById("cover-subtitle").textContent = CONFIG.cover.subtitle;
  document.getElementById("cover-cta-text").textContent = CONFIG.cover.cta;

  document.getElementById("yes-heading").textContent = CONFIG.yesResponse.heading;
  document.getElementById("yes-body").textContent = CONFIG.yesResponse.body;
  document.getElementById("yes-sub").textContent = CONFIG.yesResponse.sub;
  document.getElementById("yes-cta-text").textContent = CONFIG.yesResponse.cta;

  document.getElementById("no-heading").textContent = CONFIG.noResponse.heading;
  document.getElementById("no-body").textContent = CONFIG.noResponse.body;
  document.getElementById("no-cta-text").textContent = CONFIG.noResponse.cta;

  const waMessage = encodeURIComponent(CONFIG.whatsappMessage);
  const waNumber = CONFIG.whatsappNumber.replace(/[^0-9]/g, "");
  document.getElementById("whatsapp-link").href = `https://wa.me/${waNumber}?text=${waMessage}`;

  // ----------------------------------------------------------
  // BUILD PAGE MODEL
  // ----------------------------------------------------------
  const pageDefs = [];

  CONFIG.story.forEach((s) => {
    pageDefs.push({
      section: "story",
      html: `
        <p class="page-kicker">Our story</p>
        <h2 class="page-heading">${escapeHtml(s.title)}</h2>
        <p class="page-text">${escapeHtml(withName(s.text))}</p>
      `,
    });
  });

  CONFIG.photos.forEach((p) => {
    pageDefs.push({
      section: "memories",
      className: "photo-page",
      html: `
        <p class="page-kicker">A memory</p>
        <div class="photo-frame">
          <img src="${p.src}" alt="${escapeHtml(p.title)}" loading="lazy" />
        </div>
        <h2 class="page-heading">${escapeHtml(p.title)}</h2>
        <p class="page-text">${escapeHtml(p.caption)}</p>
      `,
    });
  });

  chunk(CONFIG.feelings, 5).forEach((group, i) => {
    pageDefs.push({
      section: "feelings",
      html: `
        <p class="page-kicker">${i === 0 ? "What I feel" : "Still true"}</p>
        <h2 class="page-heading">${i === 0 ? "My Feelings" : "More of what I feel"}</h2>
        <ul class="feelings-list">
          ${group.map((f) => `<li>${escapeHtml(withName(f))}</li>`).join("")}
        </ul>
      `,
    });
  });

  pageDefs.push({
    section: "letter",
    className: "letter-page",
    html: `
      <p class="page-kicker">${escapeHtml(NAME)}</p>
      <h2 class="page-heading">${escapeHtml(CONFIG.loveLetter.title)}</h2>
      <div class="letter-body">
        ${CONFIG.loveLetter.paragraphs.map((p) => `<p>${escapeHtml(withName(p))}</p>`).join("")}
      </div>
      <p class="letter-signature">${escapeHtml(CONFIG.loveLetter.signature)}</p>
    `,
  });

  pageDefs.push({
    section: "final",
    className: "final-page",
    isFinal: true,
    html: `
      <p class="final-name">${escapeHtml(withName(CONFIG.finalPage.name))}</p>
      ${CONFIG.finalPage.lines.map((l) => `<p class="final-line">${escapeHtml(withName(l))}</p>`).join("")}
      <div class="final-confession">
        ${CONFIG.finalPage.confession.map((c) => `<p>${escapeHtml(c)}</p>`).join("")}
      </div>
      <p class="final-question">${escapeHtml(CONFIG.finalPage.question)}</p>
      <div class="answer-buttons">
        <button id="yes-answer" class="primary-btn yes-btn">${escapeHtml(CONFIG.finalPage.yesButton)}</button>
        <button id="no-answer" class="secondary-btn no-btn">${escapeHtml(CONFIG.finalPage.noButton)}</button>
      </div>
    `,
  });

  function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ----------------------------------------------------------
  // RENDER PAGES INTO DOM
  // ----------------------------------------------------------
  const bookEl = document.getElementById("book");
  const pageEls = pageDefs.map((def, i) => {
    const el = document.createElement("article");
    el.className = "page" + (def.className ? " " + def.className : "");
    el.dataset.index = i;
    el.dataset.section = def.section;
    el.setAttribute("role", "group");
    el.setAttribute("aria-roledescription", "page");
    el.setAttribute("aria-label", `Page ${i + 1} of ${pageDefs.length}`);
    el.innerHTML = def.html;
    bookEl.appendChild(el);
    return el;
  });

  const firstIndexOfSection = {};
  pageDefs.forEach((def, i) => {
    if (!(def.section in firstIndexOfSection)) firstIndexOfSection[def.section] = i;
  });

  // ----------------------------------------------------------
  // FLIPBOOK CONTROLLER
  // ----------------------------------------------------------
  let currentIndex = 0;

  function layout(instant) {
    pageEls.forEach((el, i) => {
      el.classList.remove(
        "state-current",
        "state-next",
        "state-hidden",
        "state-flipping-out",
        "state-flipping-in-prev"
      );
      if (i < currentIndex) el.classList.add("state-hidden");
      else if (i === currentIndex) el.classList.add("state-current");
      else if (i === currentIndex + 1) el.classList.add("state-next");
      else el.classList.add("state-hidden");
    });
    updateCounter();
    updateNavHighlight();
  }

  function updateCounter() {
    document.getElementById("page-counter").textContent = `${currentIndex + 1} / ${pageEls.length}`;
  }

  function currentSection() {
    return pageEls[currentIndex]?.dataset.section || "story";
  }

  function updateNavHighlight() {
    const sec = currentSection();
    document.querySelectorAll(".nav-link").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.jump === sec);
    });
  }

  function goNext() {
    if (currentIndex >= pageEls.length - 1) return;
    const cur = pageEls[currentIndex];
    const nxt = pageEls[currentIndex + 1];

    if (reducedMotion) {
      currentIndex++;
      layout();
      return;
    }

    cur.classList.remove("state-current");
    cur.classList.add("state-flipping-out");
    nxt.classList.remove("state-next");
    nxt.classList.add("state-current");
    const nextNext = pageEls[currentIndex + 2];
    if (nextNext) nextNext.classList.add("state-next");

    currentIndex++;
    updateCounter();
    updateNavHighlight();

    const onEnd = () => {
      cur.classList.remove("state-flipping-out");
      cur.classList.add("state-hidden");
      cur.removeEventListener("transitionend", onEnd);
    };
    cur.addEventListener("transitionend", onEnd);
  }

  function goPrev() {
    if (currentIndex <= 0) return;
    const prev = pageEls[currentIndex - 1];
    const cur = pageEls[currentIndex];

    if (reducedMotion) {
      currentIndex--;
      layout();
      return;
    }

    prev.classList.remove("state-hidden");
    prev.classList.add("state-flipping-in-prev");
    // force reflow so the browser registers the starting transform before transitioning
    // eslint-disable-next-line no-unused-expressions
    prev.offsetHeight;

    cur.classList.remove("state-current");
    cur.classList.add("state-next");

    requestAnimationFrame(() => {
      prev.classList.remove("state-flipping-in-prev");
      prev.classList.add("state-current");
    });

    currentIndex--;
    updateCounter();
    updateNavHighlight();
  }

  function jumpToSection(section) {
    if (section === "cover") {
      showView("cover");
      return;
    }
    showView("book-view");
    currentIndex = firstIndexOfSection[section] ?? 0;
    layout();
  }

  document.getElementById("prev-page").addEventListener("click", goPrev);
  document.getElementById("next-page").addEventListener("click", goNext);

  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.addEventListener("click", () => jumpToSection(btn.dataset.jump));
  });

  document.addEventListener("keydown", (e) => {
    const bookView = document.getElementById("book-view");
    if (!bookView.classList.contains("active")) return;
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft") goPrev();
  });

  // touch swipe support
  (function enableSwipe() {
    const stage = document.querySelector(".book-stage");
    let startX = null;
    let startY = null;
    stage.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      },
      { passive: true }
    );
    stage.addEventListener(
      "touchend",
      (e) => {
        if (startX === null) return;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) goNext();
          else goPrev();
        }
        startX = null;
        startY = null;
      },
      { passive: true }
    );

    // mouse drag support (desktop)
    let dragStartX = null;
    stage.addEventListener("mousedown", (e) => {
      dragStartX = e.clientX;
    });
    window.addEventListener("mouseup", (e) => {
      if (dragStartX === null) return;
      const dx = e.clientX - dragStartX;
      if (Math.abs(dx) > 60) {
        if (dx < 0) goNext();
        else goPrev();
      }
      dragStartX = null;
    });
  })();

  // ----------------------------------------------------------
  // VIEW SWITCHING (cover <-> book)
  // ----------------------------------------------------------
  function showView(id) {
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    updateNavHighlight();
  }

  document.getElementById("open-heart-btn").addEventListener("click", () => {
    showView("book-view");
    currentIndex = 0;
    layout();
  });

  layout();

  // ----------------------------------------------------------
  // FINAL QUESTION: YES / NO
  // ----------------------------------------------------------
  document.getElementById("book").addEventListener("click", (e) => {
    if (e.target.id === "yes-answer") handleYes();
    if (e.target.id === "no-answer") handleNo();
  });

  function handleYes() {
    document.getElementById("yes-overlay").hidden = false;
    if (!reducedMotion) runCelebration();
  }

  function handleNo() {
    document.getElementById("no-overlay").hidden = false;
  }

  document.getElementById("read-again-btn").addEventListener("click", () => {
    document.getElementById("no-overlay").hidden = true;
    showView("book-view");
    currentIndex = 0;
    layout();
  });

  // ----------------------------------------------------------
  // THEME
  // ----------------------------------------------------------
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("love-app-theme", theme);
    document.querySelectorAll(".theme-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.theme === theme);
    });
  }
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyTheme(btn.dataset.theme));
  });
  applyTheme(localStorage.getItem("love-app-theme") || "system");

  // ----------------------------------------------------------
  // MUSIC (optional, user must start manually)
  // ----------------------------------------------------------
  const musicBtn = document.getElementById("music-toggle");
  const audioEl = document.getElementById("bg-music");
  musicBtn.addEventListener("click", () => {
    if (!audioEl.querySelector("source") && !audioEl.src) {
      // no track configured — nothing to play, fail silently and gracefully
      musicBtn.classList.add("shake-once");
      setTimeout(() => musicBtn.classList.remove("shake-once"), 300);
      return;
    }
    if (audioEl.paused) {
      audioEl.play().catch(() => {});
      musicBtn.setAttribute("aria-pressed", "true");
    } else {
      audioEl.pause();
      musicBtn.setAttribute("aria-pressed", "false");
    }
  });

  // ----------------------------------------------------------
  // AMBIENT PARTICLES (subtle floating dust / petals)
  // ----------------------------------------------------------
  if (!reducedMotion) {
    initAmbientParticles();
  }

  function initAmbientParticles() {
    const canvas = document.getElementById("ambient-canvas");
    const ctx = canvas.getContext("2d");
    let w, h, particles;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function makeParticles() {
      const count = Math.min(24, Math.floor((w * h) / 60000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 2 + Math.random() * 3,
        speedY: 0.15 + Math.random() * 0.3,
        driftX: (Math.random() - 0.5) * 0.3,
        alpha: 0.15 + Math.random() * 0.25,
      }));
    }
    makeParticles();

    function getAccentColor() {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue("--accent-soft").trim() || "#a9b78c";
    }

    let color = getAccentColor();
    setInterval(() => (color = getAccentColor()), 2000);

    function tick() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.driftX;
        if (p.y > h + 10) {
          p.y = -10;
          p.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = color;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }
    tick();
  }

  // ----------------------------------------------------------
  // CELEBRATION (confetti + petals + small firework bursts)
  // ----------------------------------------------------------
  function runCelebration() {
    const canvas = document.getElementById("celebration-canvas");
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const colors = ["#6f7d4f", "#a9b78c", "#f6f2e7", "#c9a37a", "#e8c98f"];
    const confetti = Array.from({ length: 90 }, () => spawnConfetti());
    const petals = Array.from({ length: 26 }, () => spawnPetal());
    let bursts = [spawnBurst(w * 0.5, h * 0.35)];

    function spawnConfetti() {
      return {
        x: Math.random() * w,
        y: -20 - Math.random() * h * 0.5,
        r: 4 + Math.random() * 4,
        speedY: 2 + Math.random() * 3,
        speedX: (Math.random() - 0.5) * 2,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    }
    function spawnPetal() {
      return {
        x: Math.random() * w,
        y: -20 - Math.random() * h * 0.5,
        r: 6 + Math.random() * 5,
        speedY: 0.8 + Math.random() * 1.2,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.02 + Math.random() * 0.02,
      };
    }
    function spawnBurst(x, y) {
      const particles = Array.from({ length: 40 }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        return {
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
        };
      });
      return { particles };
    }

    let extraBurstTimer = setTimeout(() => {
      bursts.push(spawnBurst(w * 0.25, h * 0.4));
      bursts.push(spawnBurst(w * 0.75, h * 0.3));
    }, 700);

    let frame = 0;
    const maxFrames = 60 * 6; // ~6s at 60fps

    function tick() {
      frame++;
      ctx.clearRect(0, 0, w, h);

      confetti.forEach((c) => {
        c.y += c.speedY;
        c.x += c.speedX;
        c.rot += c.rotSpeed;
        if (c.y > h + 20) {
          c.y = -20;
          c.x = Math.random() * w;
        }
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.r / 2, -c.r / 2, c.r, c.r * 1.6);
        ctx.restore();
      });

      petals.forEach((p) => {
        p.y += p.speedY;
        p.sway += p.swaySpeed;
        const x = p.x + Math.sin(p.sway) * 18;
        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.fillStyle = "rgba(232, 201, 143, 0.85)";
        ctx.ellipse(x, p.y, p.r, p.r * 0.6, p.sway, 0, Math.PI * 2);
        ctx.fill();
      });

      bursts.forEach((b) => {
        b.particles.forEach((pt) => {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vy += 0.04;
          pt.life -= 0.012;
          if (pt.life > 0) {
            ctx.beginPath();
            ctx.globalAlpha = Math.max(pt.life, 0);
            ctx.fillStyle = pt.color;
            ctx.arc(pt.x, pt.y, 2.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        });
      });

      if (frame < maxFrames) {
        requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, w, h);
        window.removeEventListener("resize", onResize);
        clearTimeout(extraBurstTimer);
      }
    }
    tick();
  }
})();
