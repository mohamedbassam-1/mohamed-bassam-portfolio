(() => {
  "use strict";

  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = window.matchMedia("(min-width: 900px)");
  const finePointer = window.matchMedia("(pointer: fine)");
  const announce = (message) => {
    document.getElementById("announcement").textContent = message;
  };

  function setupTheme() {
    const button = document.getElementById("themeToggle");
    const apply = (theme) => {
      root.dataset.theme = theme;
      const destination = theme === "night" ? "ICE" : "NIGHT";
      button.querySelector(".theme-label").textContent = destination;
      button.setAttribute(
        "aria-label",
        `Switch to ${destination.toLowerCase()} theme`,
      );
      document.querySelector('meta[name="theme-color"]').content =
        theme === "night" ? "#0d1921" : "#edf1f3";
    };
    apply(root.dataset.theme === "night" ? "night" : "ice");
    button.addEventListener("click", () => {
      const theme = root.dataset.theme === "night" ? "ice" : "night";
      apply(theme);
      try {
        localStorage.setItem("mb-portfolio-theme-final", theme);
      } catch {
        /* Theme switching still works for this visit. */
      }
    });
  }

  function setupNavigation() {
    const button = document.getElementById("menuToggle");
    const nav = document.getElementById("siteIndex");
    const close = (restoreFocus = false) => {
      nav.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open navigation index");
      button.querySelector("span").textContent = "+";
      if (restoreFocus) button.focus({ preventScroll: true });
    };
    button.addEventListener("click", () => {
      if (nav.classList.contains("is-open")) return close();
      nav.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      button.setAttribute("aria-label", "Close navigation index");
      button.querySelector("span").textContent = "−";
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
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => {
        const target = document.getElementById(link.hash.slice(1));
        if (!target) return;
        target.setAttribute("tabindex", "-1");
        requestAnimationFrame(() => target.focus({ preventScroll: true }));
      });
    });
  }

  function setupTabs() {
    document.querySelectorAll("[data-tabs]").forEach((group) => {
      const tabs = [...group.querySelectorAll('[role="tab"]')];
      const panels = [...group.querySelectorAll('[role="tabpanel"]')];
      const activate = (index, focus = false) => {
        tabs.forEach((tab, position) => {
          const selected = index === position;
          tab.setAttribute("aria-selected", String(selected));
          tab.tabIndex = selected ? 0 : -1;
          panels[position].hidden = !selected;
        });
        if (focus) tabs[index].focus({ preventScroll: true });
      };
      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activate(index));
        tab.addEventListener("keydown", (event) => {
          const keys = [
            "ArrowRight",
            "ArrowDown",
            "ArrowLeft",
            "ArrowUp",
            "Home",
            "End",
          ];
          if (!keys.includes(event.key)) return;
          event.preventDefault();
          let next = index;
          if (event.key === "ArrowRight" || event.key === "ArrowDown")
            next = (index + 1) % tabs.length;
          if (event.key === "ArrowLeft" || event.key === "ArrowUp")
            next = (index - 1 + tabs.length) % tabs.length;
          if (event.key === "Home") next = 0;
          if (event.key === "End") next = tabs.length - 1;
          activate(next, true);
        });
      });
      activate(0);
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
            button.textContent = "Copy email ⧉";
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

  function setupStorytelling() {
    const chapters = [...document.querySelectorAll("[data-chapter]")];
    const links = [...document.querySelectorAll("[data-chapter-link]")];
    const progress = document.getElementById("scrollProgress");
    const chapterLabel = document.getElementById("currentChapter");
    const architecture = document.querySelector(".architecture-story");
    const steps = [...document.querySelectorAll("[data-architecture-step]")];
    const nodes = [...document.querySelectorAll("[data-architecture-node]")];
    const screens = [...document.querySelectorAll("[data-screen-step]")];
    const screenStory = document.querySelector(".screen-story");
    const screen = document.getElementById("darkScreen");
    const screenImage = screen.querySelector("img");
    const visibleStories = new Set();
    let currentChapter = "";
    let currentNode = -1;
    let currentScreen = 0;
    let scheduled = false;

    const selectScreen = (index) => {
      if (index === currentScreen) return;
      currentScreen = index;
      const selected = screens[index];
      screens.forEach((button, position) => {
        button.classList.toggle("is-active", position === index);
        button.setAttribute("aria-pressed", String(position === index));
      });
      const title = selected
        .querySelector(".mono")
        .textContent.replace(/^\d+ \/ /, "");
      const description = selected.querySelector(
        ".screen-description",
      ).textContent;
      screenImage.src = selected.dataset.optimized;
      if (!reducedMotion.matches)
        screenImage.animate([{ opacity: 0.5 }, { opacity: 1 }], {
          duration: 220,
          easing: "ease-out",
        });
      screenImage.alt = `Dark Agent ${title.toLowerCase()} — ${description}`;
      screen.dataset.preview = selected.dataset.file;
      screen.href = selected.dataset.file;
      screen.dataset.title = `Dark Agent — ${title}`;
      screen.setAttribute(
        "aria-label",
        `Open full resolution: Dark Agent ${title.toLowerCase()}`,
      );
      document.getElementById("darkScreenCount").textContent =
        `${String(index + 1).padStart(2, "0")} / 06`;
      document.getElementById("darkScreenCaption").textContent = description;
    };
    screens.forEach((button, index) =>
      button.addEventListener("click", () => selectScreen(index)),
    );

    const stageAt = (elements, line) => {
      let selected = 0;
      elements.forEach((element, index) => {
        if (element.getBoundingClientRect().top <= line) selected = index;
      });
      return selected;
    };
    const update = () => {
      scheduled = false;
      const headerHeight = parseFloat(
        getComputedStyle(root).getPropertyValue("--header"),
      );
      const readingLine =
        headerHeight + (window.innerHeight - headerHeight) * 0.35;
      const chapter = chapters[stageAt(chapters, readingLine)];
      if (chapter.id !== currentChapter) {
        currentChapter = chapter.id;
        links.forEach((link) => {
          if (link.dataset.chapterLink === chapter.id)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
        chapterLabel.textContent = chapter.dataset.chapter;
      }
      const maxScroll = root.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0})`;
      if (!desktop.matches) return;
      if (visibleStories.has(architecture)) {
        const selected = stageAt(steps, readingLine);
        if (selected !== currentNode) {
          currentNode = selected;
          nodes.forEach((node, index) => {
            node.classList.toggle("is-current", index === selected);
            node.classList.toggle("is-past", index < selected);
            if (index === selected) node.setAttribute("aria-current", "step");
            else node.removeAttribute("aria-current");
          });
          document.getElementById("architectureCount").textContent =
            `${String(selected + 1).padStart(2, "0")} / 09`;
        }
      }
      if (visibleStories.has(screenStory))
        selectScreen(stageAt(screens, readingLine));
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    };
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleStories.add(entry.target);
          else visibleStories.delete(entry.target);
        });
        schedule();
      });
      observer.observe(architecture);
      observer.observe(screenStory);
    } else {
      visibleStories.add(architecture);
      visibleStories.add(screenStory);
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    desktop.addEventListener("change", schedule);
    document.fonts.ready.then(schedule);
    schedule();
  }

  function setupMapDepth() {
    const map = document.querySelector("[data-depth]");
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      map.style.setProperty("--depth-x", "0px");
      map.style.setProperty("--depth-y", "0px");
    };
    map.addEventListener(
      "pointermove",
      (event) => {
        if (reducedMotion.matches || !finePointer.matches || !desktop.matches)
          return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const rect = map.getBoundingClientRect();
          map.style.setProperty(
            "--depth-x",
            `${((event.clientX - rect.left) / rect.width - 0.5) * 5}px`,
          );
          map.style.setProperty(
            "--depth-y",
            `${((event.clientY - rect.top) / rect.height - 0.5) * 5}px`,
          );
        });
      },
      { passive: true },
    );
    map.addEventListener("pointerleave", reset);
    reducedMotion.addEventListener("change", reset);
    desktop.addEventListener("change", reset);
  }

  function setupDiagramMotion() {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in-view");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.25 },
    );
    document
      .querySelectorAll(".rag-flow, .challenge-flow")
      .forEach((diagram) => {
        diagram.classList.add("diagram-motion");
        observer.observe(diagram);
      });
  }

  setupTheme();
  setupNavigation();
  setupTabs();
  setupPreview();
  setupCopy();
  setupStorytelling();
  setupMapDepth();
  setupDiagramMotion();
})();
