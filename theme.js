/* Read the existing preference before first paint. Storage may be unavailable. */
(() => {
  try {
    const theme =
      localStorage.getItem("mb-portfolio-theme-final") ||
      localStorage.getItem("mb-portfolio-theme");
    if (theme === "night") document.documentElement.dataset.theme = "night";
  } catch {
    /* The default ICE theme remains usable without storage. */
  }
})();
