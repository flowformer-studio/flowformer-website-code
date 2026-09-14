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

    const logoCloseTest =
      new URLSearchParams(
        window.location.search
      ).get("ff-logo-close-test") === "1";

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
          ".w-nav-overlay"
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

          if (
            logoCloseTest &&
            link.hash &&
            link.origin === window.location.origin &&
            link.pathname === window.location.pathname
          ) {
            return;
          }

          button.click();
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

      /*
       * Webflows native Overlay-Sichtbarkeit
       * steuert den Finsweet-Scroll-Lock.
       */
      const scrollLockStartedAt =
        performance.now();

      function activateVisibilityScrollLock() {
        const finsweet =
          window.FinsweetAttributes;

        const scrollDisable =
          finsweet?.modules
            ?.scrolldisable;

        if (!scrollDisable?.restart) {
          if (
            performance.now() -
              scrollLockStartedAt <
            10000
          ) {
            setTimeout(
              activateVisibilityScrollLock,
              50
            );
          } else {
            console.warn(
              "[FF Navigation] Finsweet-Scroll-Lock nicht verfügbar."
            );
          }
          return;
        }

        if (finsweet.version !== "2.7.1") {
          console.warn(
            "[FF Navigation] Unerwartete Finsweet-Version; Scroll-Lock nicht aktiviert.",
            finsweet.version
          );
          return;
        }

        button.removeAttribute(
          "fs-scrolldisable-element"
        );
        button.removeAttribute(
          "fs-scrolldisable-gap"
        );

        overlay.setAttribute(
          "fs-scrolldisable-element",
          "when-visible"
        );

        overlay.setAttribute(
          "fs-scrolldisable-gap",
          "false"
        );

        Promise.resolve(
          scrollDisable.restart()
        ).catch((error) => {
          console.error(
            "[FF Navigation] Finsweet-Scroll-Lock konnte nicht gestartet werden.",
            error
          );
        });
      }

      activateVisibilityScrollLock();
    }
  });
})();
