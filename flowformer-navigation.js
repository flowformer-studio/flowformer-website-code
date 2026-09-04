/*
 * FlowFormer – Navigation V2
 * Test build for GitHub Pages.
 */

(() => {
  window.Webflow = window.Webflow || [];

  window.Webflow.push(() => {
    const tabletDown =
      window.matchMedia(
        "(max-width: 991px)"
      );

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(",");

    document
      .querySelectorAll(".navbar")
      .forEach(setupNavbar);

    function setupNavbar(navbar) {
      const button =
        navbar.querySelector(
          ".navbar_menu-button, .w-nav-button"
        );

      const menu =
        navbar.querySelector(
          ".navbar_menu, .w-nav-menu"
        );

      const overlay =
        navbar.querySelector(
          ".navbar_overlay"
        );

      if (!button || !menu || !overlay) {
        return;
      }

      overlay.setAttribute(
        "aria-hidden",
        "true"
      );

      const nativeDuration =
        Number.parseInt(
          navbar.dataset.duration || "",
          10
        );

      const lockDuration =
        Number.isFinite(nativeDuration)
          ? nativeDuration + 50
          : 450;

      let enhancedOpen = false;
      let closing = false;
      let returnFocusOnClose = true;
      let locked = false;
      let lockTimer;
      let unmountTimer;
      let openViewportWidth = null;

      const inertStates = new Map();

      function nativeOpen() {
        const expanded =
          button.getAttribute(
            "aria-expanded"
          );

        return expanded !== null
          ? expanded === "true"
          : button.classList.contains(
              "w--open"
            ) ||
              menu.classList.contains(
                "w--open"
              );
      }

      function setOutsideInert(active) {
        if (!active) {
          inertStates.forEach(
            (value, element) => {
              if (element.isConnected) {
                element.inert = value;
              }
            }
          );

          inertStates.clear();
          return;
        }

        let branch = navbar;

        while (
          branch &&
          branch !== document.body
        ) {
          const parent =
            branch.parentElement;

          if (!parent) break;

          [...parent.children].forEach(
            (sibling) => {
              if (
                sibling !== branch &&
                sibling instanceof
                  HTMLElement &&
                !inertStates.has(sibling)
              ) {
                inertStates.set(
                  sibling,
                  sibling.inert
                );

                sibling.inert = true;
              }
            }
          );

          branch = parent;
        }
      }

      function getFocusable() {
        return [
          ...navbar.querySelectorAll(
            focusableSelector
          )
        ].filter(
          (element) =>
            element instanceof
              HTMLElement &&
            !element.closest("[inert]") &&
            element.getAttribute(
              "aria-hidden"
            ) !== "true" &&
            element.tabIndex >= 0 &&
            element.getClientRects()
              .length
        );
      }

      function trapFocus(event) {
        if (event.key === "Escape") {
          event.preventDefault();

          beginClose(true);
          button.click();

          return;
        }

        if (event.key !== "Tab") {
          return;
        }

        const elements =
          getFocusable();

        if (!elements.length) {
          event.preventDefault();

          button.focus({
            preventScroll: true
          });

          return;
        }

        const first = elements[0];
        const last = elements.at(-1);

        const backwards =
          event.shiftKey &&
          document.activeElement ===
            first;

        const forwards =
          !event.shiftKey &&
          document.activeElement ===
            last;

        if (
          backwards ||
          forwards ||
          !navbar.contains(
            document.activeElement
          )
        ) {
          event.preventDefault();

          (
            backwards
              ? last
              : first
          ).focus({
            preventScroll: true
          });
        }
      }

      function openEnhancedState() {
        clearTimeout(unmountTimer);

        navbar.classList.add(
          "ff-overlay-mounted"
        );

        /*
         * Startet die Opacity-Transition
         * unmittelbar und unabhängig
         * vom MutationObserver.
         */
        overlay.getBoundingClientRect();

        navbar.classList.add(
          "ff-overlay-visible"
        );

        if (enhancedOpen) return;

        enhancedOpen = true;
        openViewportWidth =
          getViewportWidth();

        setOutsideInert(true);

        document.addEventListener(
          "keydown",
          trapFocus,
          true
        );

        requestAnimationFrame(() => {
          if (
            enhancedOpen &&
            !navbar.contains(
              document.activeElement
            )
          ) {
            button.focus({
              preventScroll: true
            });
          }
        });
      }

      function closeEnhancedState(
        returnFocus
      ) {
        navbar.classList.remove(
          "ff-overlay-visible"
        );

        clearTimeout(unmountTimer);

        const delay =
          reducedMotion.matches
            ? 0
            : 60;

        unmountTimer =
          setTimeout(() => {
            if (
              !navbar.classList.contains(
                "ff-overlay-visible"
              )
            ) {
              navbar.classList.remove(
                "ff-overlay-mounted"
              );
            }
          }, delay);

        if (!enhancedOpen) return;

        enhancedOpen = false;
        openViewportWidth = null;

        setOutsideInert(false);

        document.removeEventListener(
          "keydown",
          trapFocus,
          true
        );

        if (
          returnFocus &&
          tabletDown.matches &&
          button.isConnected
        ) {
          requestAnimationFrame(() => {
            if (!enhancedOpen) {
              button.focus({
                preventScroll: true
              });
            }
          });
        }
      }

      function beginClose(
        returnFocus
      ) {
        closing = true;

        returnFocusOnClose =
          returnFocus;

        closeEnhancedState(
          returnFocus
        );
      }

      function reconcileNativeState() {
        if (!tabletDown.matches) {
          closing = false;

          closeEnhancedState(false);

          returnFocusOnClose = true;
          return;
        }

        if (nativeOpen()) {
          if (!closing) {
            openEnhancedState();
          }

          return;
        }

        closing = false;

        closeEnhancedState(
          returnFocusOnClose
        );

        returnFocusOnClose = true;
      }

      function startInteractionLock() {
        locked = true;

        clearTimeout(lockTimer);

        lockTimer = setTimeout(() => {
          locked = false;
        }, lockDuration);
      }

      button.setAttribute(
        "fs-scrolldisable-gap",
        "false"
      );

      button.addEventListener(
        "click",
        (event) => {
          const wasOpen = nativeOpen();

          if (
            !tabletDown.matches &&
            !wasOpen
          ) {
            return;
          }

          if (
            event.detail > 0 &&
            tabletDown.matches &&
            locked
          ) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
          }

          button.setAttribute(
            "fs-scrolldisable-element",
            wasOpen
              ? "enable"
              : "disable"
          );

          if (
            event.detail > 0 &&
            tabletDown.matches
          ) {
            startInteractionLock();
          }
        },
        true
      );

      overlay.addEventListener(
        "click",
        (event) => {
          if (
            event.target !== overlay ||
            !nativeOpen()
          ) {
            return;
          }

          beginClose(true);
          button.click();
        }
      );

      menu.addEventListener(
        "click",
        (event) => {
          const link =
            event.target instanceof Element
              ? event.target.closest(
                  "a[href]"
                )
              : null;

          if (!link || !nativeOpen()) {
            return;
          }

          beginClose(false);
          // button.click();
        },
        true
      );

      const observer =
        new MutationObserver(
          reconcileNativeState
        );

      observer.observe(button, {
        attributes: true,
        attributeFilter: [
          "aria-expanded"
        ]
      });

      function getViewportWidth() {
        return window.visualViewport
          ? window.visualViewport.width
          : window.innerWidth;
      }

      function closeNavigationOnViewportChange() {
        if (
          !nativeOpen() ||
          openViewportWidth === null
        ) {
          return;
        }

        const widthChanged =
          Math.abs(
            getViewportWidth() -
              openViewportWidth
          ) > 1;

        if (!widthChanged) {
          return;
        }

        beginClose(false);
        button.click();
      }

      window.addEventListener(
        "resize",
        closeNavigationOnViewportChange,
        {
          capture: true,
          passive: true
        }
      );

      if (window.visualViewport) {
        window.visualViewport
          .addEventListener(
            "resize",
            closeNavigationOnViewportChange,
            {
              capture: true,
              passive: true
            }
          );
      }

      window.addEventListener(
        "orientationchange",
        () => {
          if (nativeOpen()) {
            beginClose(false);
            button.click();
          }
        },
        {
          capture: true,
          passive: true
        }
      );

      reconcileNativeState();
    }
  });
})();
/*
 * Temporary navigation diagnostics.
 * Enable with: ?ff-nav-debug=1
 * Remove before production deployment.
 */
(() => {
  const debugEnabled =
    new URLSearchParams(
      window.location.search
    ).get("ff-nav-debug") === "1";

  if (!debugEnabled) {
    return;
  }

  window.Webflow = window.Webflow || [];

  window.Webflow.push(() => {
    const navbar =
      document.querySelector(".navbar");

    if (!navbar) return;

    const button =
      navbar.querySelector(
        ".navbar_menu-button, .w-nav-button"
      );

    const menu =
      navbar.querySelector(
        ".navbar_menu, .w-nav-menu"
      );

    const overlay =
      navbar.querySelector(
        ".navbar_overlay"
      );

    if (!button || !menu || !overlay) {
      return;
    }

    const tabletDown =
      window.matchMedia(
        "(max-width: 991px)"
      );

    const contactButton = [
      ...navbar.querySelectorAll(
        "a, button"
      )
    ].find((element) =>
      element.textContent
        .replace(/\s+/g, " ")
        .trim()
        .includes("Kontakt aufnehmen")
    );

    const panel =
      document.createElement("pre");

    panel.id = "ff-nav-debug";

    Object.assign(panel.style, {
      position: "fixed",
      left: "4px",
      right: "4px",
      bottom: "4px",
      zIndex: "2147483647",
      margin: "0",
      padding: "8px",
      background: "rgba(0, 0, 0, 0.88)",
      color: "#00ff8c",
      font: "10px/1.35 monospace",
      whiteSpace: "pre-wrap",
      pointerEvents: "none",
      borderRadius: "4px"
    });

    document.body.appendChild(panel);

    let snapshotNumber = 0;
    let resizeTimer;

    function yesNo(value) {
      return value ? "JA" : "NEIN";
    }

    function readState(label) {
      snapshotNumber += 1;

      const htmlStyle =
        getComputedStyle(
          document.documentElement
        );

      const bodyStyle =
        getComputedStyle(
          document.body
        );

      const overlayStyle =
        getComputedStyle(overlay);

      const contactRect =
        contactButton
          ? contactButton
              .getBoundingClientRect()
          : null;

      const contactStyle =
        contactButton
          ? getComputedStyle(
              contactButton
            )
          : null;

      const output = [
        `TEST ${snapshotNumber}: ${label}`,
        `Breite: ${window.innerWidth}px | Mobile-BP: ${yesNo(tabletDown.matches)}`,
        `aria-expanded: ${button.getAttribute("aria-expanded")}`,
        `Button w--open: ${yesNo(button.classList.contains("w--open"))}`,
        `Menü w--open: ${yesNo(menu.classList.contains("w--open"))}`,
        `Overlay mounted: ${yesNo(navbar.classList.contains("ff-overlay-mounted"))}`,
        `Overlay visible: ${yesNo(navbar.classList.contains("ff-overlay-visible"))}`,
        `Overlay CSS: display=${overlayStyle.display} | opacity=${overlayStyle.opacity}`,
        `Scroll: html=${htmlStyle.overflowY} | body=${bodyStyle.overflowY}`,
        `Body inline: overflow=${document.body.style.overflow || "-"} | position=${document.body.style.position || "-"}`,
        `scrollY: ${Math.round(window.scrollY)}`,
        contactRect
          ? `CTA: x=${Math.round(contactRect.x)} | y=${Math.round(contactRect.y)} | transform=${contactStyle.transform}`
          : "CTA: nicht gefunden"
      ].join("\n");

      panel.textContent = output;

      console.log(
        "[FF Navigation Diagnose]",
        output
      );
    }

    function captureSequence(label) {
      [0, 50, 150, 500].forEach(
        (delay) => {
          setTimeout(
            () =>
              readState(
                `${label} + ${delay} ms`
              ),
            delay
          );
        }
      );
    }

    tabletDown.addEventListener(
      "change",
      () => {
        captureSequence(
          "Breakpoint-Wechsel"
        );
      }
    );

    window.addEventListener(
      "orientationchange",
      () => {
        captureSequence(
          "Orientationchange"
        );
      },
      {
        passive: true
      }
    );

    window.addEventListener(
      "resize",
      () => {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(
          () => {
            readState(
              "Resize beendet"
            );
          },
          200
        );
      },
      {
        passive: true
      }
    );

    const stateObserver =
      new MutationObserver(() => {
        readState(
          "Navigationszustand geändert"
        );
      });

    stateObserver.observe(navbar, {
      attributes: true,
      subtree: true,
      attributeFilter: [
        "class",
        "aria-expanded"
      ]
    });

    readState("Start");
  });
})();
