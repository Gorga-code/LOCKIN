export function connectWidgetShell(widget, invoke, listen) {
  const root = document.documentElement;
  const surface = widget.querySelector(".surface");
  const target = widget.querySelector(".dock-target");
  const controls = widget.querySelector(".controls");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let edge = "right";
  let hovering = false;
  let keyboard = false;
  let opened = false;
  let dragging = false;
  let warning = "";
  let warningVisible = false;
  let outsideSince = null;
  let pageActive = true;
  let sampleFailed = false;
  let sampleTimer, openTimer, warningTimer, contact;
  controls.inert = true;

  function updateView() {
    if (dragging) return;
    const next = edge === "free" || hovering || keyboard || opened
      ? "controls"
      : warningVisible ? "warning" : "blob";
    if (root.dataset.view === next) return;
    root.dataset.view = next;
    controls.inert = next !== "controls";
  }

  function contains(point, { left, top, right, bottom }, padding = 0) {
    const [x, y] = point;
    return x >= left - padding && x < right + padding
      && y >= top - padding && y < bottom + padding;
  }

  function updateHover(point, panel) {
    if (dragging || edge === "free") return;
    if (!hovering) {
      // A closing panel cannot reopen itself as its old shape passes under the pointer.
      const entry = root.dataset.view === "blob" ? target.getBoundingClientRect() : panel;
      if (contains(point, entry, 2)) {
        hovering = true;
        outsideSince = null;
        updateView();
      }
      return;
    }

    if (contains(point, panel, 6)) {
      outsideSince = null;
      return;
    }

    const now = performance.now();
    outsideSince ??= now;
    if (now - outsideSince >= 165) {
      hovering = false;
      outsideSince = null;
      updateView();
    }
  }

  async function trackPointer() {
    if (!pageActive) return;
    try {
      const { left, top, right, bottom } = surface.getBoundingClientRect();
      const point = await invoke("sample_widget_pointer", { bounds: [left, top, right, bottom] });
      if (pageActive) updateHover(point, surface.getBoundingClientRect());
      sampleFailed = false;
    } catch (error) {
      if (!sampleFailed && pageActive) console.error("Could not track LOCKIN hover:", error);
      sampleFailed = true;
    } finally {
      if (pageActive) sampleTimer = window.setTimeout(trackPointer, 35);
    }
  }

  function reveal() {
    opened = true;
    window.clearTimeout(openTimer);
    openTimer = window.setTimeout(() => {
      opened = false;
      updateView();
    }, 1600);
    updateView();
  }

  widget.addEventListener("focusin", (event) => {
    if (event.target.matches(":focus-visible")) {
      keyboard = true;
      updateView();
    }
  });
  widget.addEventListener("focusout", (event) => {
    if (!widget.contains(event.relatedTarget)) {
      keyboard = false;
      updateView();
    }
  });
  window.addEventListener("pagehide", () => {
    pageActive = false;
    window.clearTimeout(sampleTimer);
    window.clearTimeout(openTimer);
    window.clearTimeout(warningTimer);
  }, { once: true });

  listen("lockin-focus-open", reveal).catch(console.error);
  invoke("opened_from_site")
    .then((wasOpened) => { if (wasOpened) reveal(); })
    .catch(console.error);
  void trackPointer();

  return {
    updateDock(nextEdge, nextDragging) {
      if (edge !== nextEdge) {
        contact?.cancel();
        outsideSince = null;
        if (nextEdge !== "free" && !reducedMotion.matches) {
          const vertical = nextEdge === "left" || nextEdge === "right";
          contact = surface.animate([
            { transform: "scale(1)" },
            { offset: 0.43, transform: vertical ? "scale(.965, 1.085)" : "scale(1.018, .89)" },
            { transform: "scale(1)" },
          ], { duration: 155, easing: "ease-out" });
        }
      }
      edge = nextEdge;
      dragging = nextDragging;
      updateView();
    },
    beginDrag() {
      dragging = true;
    },
    cancelDrag() {
      dragging = false;
      updateView();
    },
    warn(text) {
      if (text === warning) return;
      warning = text;
      window.clearTimeout(warningTimer);
      warningVisible = Boolean(text);
      if (warningVisible) {
        warningTimer = window.setTimeout(() => {
          warningVisible = false;
          updateView();
        }, 1800);
      }
      updateView();
    },
    reveal,
  };
}
