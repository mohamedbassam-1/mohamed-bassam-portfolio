(() => {
  "use strict";
  const root = document.documentElement;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = matchMedia("(min-width: 901px)");
  const finePointer = matchMedia("(pointer: fine)");
  const announce = (message) => {
    document.getElementById("announcement").textContent = message;
  };
  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));

  function setupTheme() {
    const button = document.getElementById("themeToggle");
    const apply = (theme) => {
      root.dataset.theme = theme;
      const destination = theme === "night" ? "Ice" : "Night";
      button.querySelector(".theme-label").textContent = destination;
      button.setAttribute(
        "aria-label",
        "Switch to " + destination.toLowerCase() + " theme",
      );
      document.querySelector('meta[name="theme-color"]').content =
        theme === "night" ? "#0c1524" : "#f2f5f9";
    };
    apply(root.dataset.theme === "night" ? "night" : "ice");
    button.addEventListener("click", () => {
      const theme = root.dataset.theme === "night" ? "ice" : "night";
      apply(theme);
      try {
        localStorage.setItem("mb-portfolio-theme-final", theme);
      } catch {
        /* The control remains usable without storage. */
      }
    });
  }

  function setupNavigation() {
    const button = document.getElementById("menuToggle");
    const nav = document.getElementById("siteNav");
    const close = (restore = false) => {
      nav.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open menu");
      if (restore) button.focus({ preventScroll: true });
    };
    button.addEventListener("click", () => {
      if (nav.classList.contains("is-open")) return close();
      nav.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      button.setAttribute("aria-label", "Close menu");
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) close();
    });
    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target) && !button.contains(event.target))
        close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open"))
        close(true);
    });
    nav.addEventListener("focusout", (event) => {
      if (
        event.relatedTarget &&
        !nav.contains(event.relatedTarget) &&
        !button.contains(event.relatedTarget)
      )
        close();
    });
    desktop.addEventListener("change", () => close());
    document.querySelectorAll('a[href^="#"]').forEach((link) =>
      link.addEventListener("click", () => {
        const target = document.getElementById(link.hash.slice(1));
        if (!target) return;
        target.setAttribute("tabindex", "-1");
        requestAnimationFrame(() => target.focus({ preventScroll: true }));
      }),
    );
  }

  function setupTabs() {
    document.querySelectorAll("[data-tabs]").forEach((group) => {
      const tabs = [...group.querySelectorAll('[role="tab"]')];
      const panels = [...group.querySelectorAll('[role="tabpanel"]')];
      let current = 0;
      const activate = (index, focus = false) => {
        const changed = index !== current;
        current = index;
        tabs.forEach((tab, i) => {
          tab.setAttribute("aria-selected", String(i === index));
          tab.tabIndex = i === index ? 0 : -1;
          panels[i].hidden = i !== index;
        });
        const position = group.querySelector(".reel-position");
        if (position)
          position.textContent = String(index + 1).padStart(2, "0") + " / 06";
        if (changed && !reducedMotion.matches)
          panels[index].animate(
            [
              {
                opacity: 0.2,
                transform: group.hasAttribute("data-swipe")
                  ? "translateX(18px)"
                  : "translateY(4px)",
              },
              { opacity: 1, transform: "translate(0)" },
            ],
            {
              duration: group.hasAttribute("data-swipe") ? 650 : 300,
              easing: "cubic-bezier(.2,.75,.2,1)",
            },
          );
        if (focus) tabs[index].focus({ preventScroll: true });
      };
      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activate(index));
        tab.addEventListener("keydown", (event) => {
          const delta = {
            ArrowRight: 1,
            ArrowDown: 1,
            ArrowLeft: -1,
            ArrowUp: -1,
          }[event.key];
          if (
            delta === undefined &&
            event.key !== "Home" &&
            event.key !== "End"
          )
            return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? tabs.length - 1
                : (index + delta + tabs.length) % tabs.length;
          activate(next, true);
        });
      });
      const stepProject = (delta) => {
        activate((current + delta + tabs.length) % tabs.length);
        announce("Project " + tabs[current].textContent.trim());
      };
      group
        .querySelector("[data-reel-prev]")
        ?.addEventListener("click", () => stepProject(-1));
      group
        .querySelector("[data-reel-next]")
        ?.addEventListener("click", () => stepProject(1));
      if (group.hasAttribute("data-swipe")) {
        let start = null,
          suppressClick = false;
        const surface = group.querySelector(".tab-panels");
        surface.addEventListener(
          "touchstart",
          (event) => {
            const t = event.touches[0];
            start = { x: t.clientX, y: t.clientY };
          },
          { passive: true },
        );
        surface.addEventListener(
          "touchend",
          (event) => {
            if (!start) return;
            const t = event.changedTouches[0],
              dx = t.clientX - start.x,
              dy = t.clientY - start.y;
            start = null;
            if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
            suppressClick = true;
            activate((current + (dx < 0 ? 1 : -1) + tabs.length) % tabs.length);
            announce("Project " + tabs[current].textContent.trim());
            setTimeout(() => {
              suppressClick = false;
            }, 350);
          },
          { passive: true },
        );
        surface.addEventListener(
          "click",
          (event) => {
            if (suppressClick) {
              event.preventDefault();
              event.stopPropagation();
            }
          },
          true,
        );
      }
    });
  }
  function setupPreview() {
    const dialog = document.getElementById("previewModal");
    const image = document.getElementById("modalImage");
    const closeButton = document.getElementById("modalClose");
    let trigger = null;
    const close = () => {
      if (dialog.open) dialog.close();
    };
    document.addEventListener("click", (event) => {
      const source = event.target.closest("[data-preview]");
      if (!source) return;
      if (typeof dialog.showModal !== "function") return;
      event.preventDefault();
      trigger = source;
      const title = source.dataset.title || "Project evidence";
      image.src = source.dataset.preview;
      image.alt = title;
      document.getElementById("modalTitle").textContent = title;
      document.getElementById("modalOriginal").href = source.dataset.preview;
      dialog.showModal();
      document.body.classList.add("modal-open");
      closeButton.focus({ preventScroll: true });
    });
    closeButton.addEventListener("click", close);
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const controls = [
        ...dialog.querySelectorAll(
          'button, a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ];
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      )
        close();
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
      image.removeAttribute("src");
      image.alt = "";
      trigger?.focus({ preventScroll: true });
    });
  }

  function setupCopy() {
    document.querySelectorAll("[data-copy]").forEach((button) => {
      let timer;
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.copy);
          button.textContent = "Email copied ✓";
          announce("Email address copied to clipboard.");
          clearTimeout(timer);
          timer = setTimeout(() => {
            button.textContent = "Copy email";
          }, 2400);
        } catch {
          announce(
            "Clipboard is unavailable. The email link above contains mobassam135@gmail.com.",
          );
          button.textContent = "Use the email link above";
        }
      });
    });
  }

  function setupProductStory() {
    const buttons = [...document.querySelectorAll("[data-screen-step]")];
    const link = document.getElementById("darkScreen");
    const image = link.querySelector("img");
    const story = document.querySelector(".screen-story");
    let selected = 0,
      version = 0,
      manualAt = -Infinity;
    const select = (index, manual = false) => {
      if (manual) manualAt = window.scrollY;
      if (index === selected) return;
      selected = index;
      const ticket = ++version,
        button = buttons[index];
      buttons.forEach((item, i) => {
        item.classList.toggle("is-active", i === index);
        item.setAttribute("aria-pressed", String(i === index));
      });
      const preload = new Image();
      preload.src = button.dataset.optimized;
      const apply = () => {
        if (ticket !== version) return;
        image.src = button.dataset.optimized;
        image.alt = "Dark Agent — " + button.dataset.title;
        link.href = link.dataset.preview = button.dataset.file;
        link.dataset.title = "Dark Agent — " + button.dataset.title;
        link.setAttribute(
          "aria-label",
          "Expand Dark Agent " + button.dataset.title,
        );
        document.getElementById("darkScreenCount").textContent =
          String(index + 1).padStart(2, "0") + " / 06";
        document.getElementById("darkScreenCaption").textContent =
          button.dataset.description;
        if (!reducedMotion.matches)
          image.animate(
            [
              { opacity: 0.3, transform: "scale(1.012)" },
              { opacity: 1, transform: "scale(1)" },
            ],
            { duration: 500, easing: "ease-out" },
          );
      };
      preload.decode().then(apply, apply);
    };
    buttons.forEach((button, i) =>
      button.addEventListener("click", () => select(i, true)),
    );
    return () => {
      if (!desktop.matches || Math.abs(window.scrollY - manualAt) < 140) return;
      const rect = story.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) return;
      const travel = Math.max(1, rect.height - window.innerHeight + 100);
      select(Math.min(5, Math.floor(clamp((110 - rect.top) / travel) * 6)));
    };
  }

  function setupArchitecture() {
    const nodes = [...document.querySelectorAll("[data-architecture-node]")];
    const panels = [...document.querySelectorAll("[data-architecture-step]")];
    const map = document.querySelector(".architecture-map");
    let current = 0,
      manualAt = -Infinity;
    const select = (index, manual = false) => {
      if (manual) manualAt = window.scrollY;
      if (current === index) return;
      current = index;
      nodes.forEach((node, i) => {
        node.classList.toggle("is-current", i === index);
        node.classList.toggle("is-past", i < index);
        node.setAttribute("aria-pressed", String(i === index));
        if (i === index) node.setAttribute("aria-current", "step");
        else node.removeAttribute("aria-current");
        panels[i].hidden = i !== index;
      });
      if (manual)
        announce(
          nodes[index].querySelector("strong").textContent +
            ". " +
            panels[index].querySelector("h3").textContent,
        );
    };
    nodes.forEach((node, i) => {
      node.addEventListener("click", () => select(i, true));
      node.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "mouse") select(i, true);
      });
      node.addEventListener("keydown", (event) => {
        const delta = {
          ArrowRight: 1,
          ArrowDown: 1,
          ArrowLeft: -1,
          ArrowUp: -1,
        }[event.key];
        if (delta === undefined && event.key !== "Home" && event.key !== "End")
          return;
        event.preventDefault();
        const index =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? 8
              : (i + delta + 9) % 9;
        select(index, true);
        nodes[index].focus({ preventScroll: true });
      });
    });
    nodes[0].setAttribute("aria-current", "step");
    return () => {
      if (Math.abs(window.scrollY - manualAt) < 120) return;
      const rect = map.getBoundingClientRect();
      if (rect.top > innerHeight * 0.85 || rect.bottom < 0) return;
      const progress = clamp(
        (innerHeight * 0.6 - rect.top) / (rect.height + innerHeight * 0.15),
      );
      select(Math.min(8, Math.floor(progress * 9)));
    };
  }

  function setupScroll() {
    const header = document.querySelector(".site-header");
    const progress = document.getElementById("scrollProgress");
    const chapters = [...document.querySelectorAll("main > section")];
    const links = [...document.querySelectorAll("[data-chapter-link]")];
    const screenUpdate = setupProductStory(),
      architectureUpdate = setupArchitecture();
    let queued = false,
      lastScroll = 0,
      lastChapter = "";
    const update = () => {
      queued = false;
      header.classList.toggle("is-scrolled", scrollY > 60);
      header.classList.toggle(
        "is-descending",
        scrollY > lastScroll && scrollY > 250,
      );
      lastScroll = scrollY;
      progress.style.transform =
        "scaleX(" +
        clamp(scrollY / Math.max(1, root.scrollHeight - innerHeight)) +
        ")";
      let current = chapters[0];
      for (const chapter of chapters)
        if (chapter.getBoundingClientRect().top < innerHeight * 0.35)
          current = chapter;
      if (current.id !== lastChapter) {
        lastChapter = current.id;
        header.dataset.world = ["dark-agent", "smartinvest"].includes(
          current.id,
        )
          ? "dark"
          : "light";
        links.forEach((link) => {
          if (link.dataset.chapterLink === current.id)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }
      screenUpdate();
      architectureUpdate();
    };
    const schedule = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    };
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule, { passive: true });
    document.fonts.ready.then(schedule);
    schedule();
  }

  function setupAtmosphere() {
    const sculpture = document.querySelector("[data-depth]");
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      sculpture.style.setProperty("--rotate-x", "0deg");
      sculpture.style.setProperty("--rotate-y", "0deg");
    };
    sculpture.addEventListener(
      "pointermove",
      (event) => {
        if (reducedMotion.matches || !finePointer.matches || !desktop.matches)
          return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const rect = sculpture.getBoundingClientRect(),
            x = (event.clientX - rect.left) / rect.width,
            y = (event.clientY - rect.top) / rect.height;
          sculpture.style.setProperty("--rotate-x", (y - 0.5) * -2 + "deg");
          sculpture.style.setProperty("--rotate-y", (x - 0.5) * 3 + "deg");
        });
      },
      { passive: true },
    );
    sculpture.addEventListener("pointerleave", reset);
    reducedMotion.addEventListener("change", reset);
    desktop.addEventListener("change", reset);
    if (!("IntersectionObserver" in window)) return;
    if (!reducedMotion.matches) root.classList.add("js-reveals");
    const motionObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) =>
          entry.target.classList.toggle(
            "is-motion-visible",
            entry.isIntersecting,
          ),
        ),
      { threshold: 0.05 },
    );
    document
      .querySelectorAll(".hero,.architecture-map")
      .forEach((el) => motionObserver.observe(el));
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in-view");
          observer.unobserve(entry.target);
        }),
      { threshold: 0.12, rootMargin: "0px 0px -20px 0px" },
    );
    document
      .querySelectorAll("[data-reveal], .finance-heading, .experience-entry")
      .forEach((el) => observer.observe(el));
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) root.classList.remove("js-reveals");
    });
  }

  setupTheme();
  setupNavigation();
  setupTabs();
  setupPreview();
  setupCopy();
  setupScroll();
  setupAtmosphere();
})();
