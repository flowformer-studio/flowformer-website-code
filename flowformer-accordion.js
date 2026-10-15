/* FlowFormer FAQ — FAQ integration.
 * Native Webflow: height 0 → auto and icon; odd clicks play, even reverse.
 * Remove the native Body Text action and the previous item click trigger.
 * Both native actions: start 0, duration 0.5 seconds, no trigger delay.
 * Native reduced-motion condition: skip to end (not disable interaction).
 * Text values below reproduce the existing opacity-only SplitText action.
 */
(() => {
  'use strict';

  const settings = { duration: 0.5, stagger: 0.1, ease: 'power1.out' };
  const initialized = new WeakSet();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const states = new Set();
  let idCounter = 0;

  function uniqueId(prefix) {
    let id;
    do { id = `${prefix}-${++idCounter}`; } while (document.getElementById(id));
    return id;
  }

  function cancelText(state) {
    state.token += 1;
    state.animation?.kill();
    state.animation = null;
    state.splits.forEach(split => split.revert());
    state.splits = [];
  }

  function makeAvailable(state, available) {
    state.panel.inert = !available;
    if (available) state.panel.removeAttribute('aria-hidden');
    else state.panel.setAttribute('aria-hidden', 'true');
  }

  function finish(state, token) {
    if (state.token !== token) return;
    state.splits.forEach(split => split.revert());
    state.splits = [];
    state.animation = null;
    state.panel.hidden = !state.open;
    makeAvailable(state, state.open);
  }

  function animateText(state) {
    const gsap = window.gsap;
    const SplitText = window.SplitText;
    const token = state.token;

    if (!gsap || !SplitText || motion.matches) {
      // Native Webflow must also skip to its endpoint for reduced motion.
      if (!gsap) state.panel.style.height = state.open ? 'auto' : '0px';
      finish(state, token);
      return;
    }

    const lines = [];
    try {
      state.texts.forEach(text => {
        const split = SplitText.create(text, {
          type: 'lines', mask: 'lines', aria: 'none',
          linesClass: 'ff-accordion-line',
          // Preserve browser wrap opportunities after hyphens without changing text.
          wordDelimiter: { delimiter: /(?=\s)|(?<=[\s-])/, replaceWith: '' }
        });
        state.splits.push(split);
        lines.push(...split.lines);
      });

      if (!lines.length) {
        state.animation = gsap.delayedCall(settings.duration, () => finish(state, token));
        return;
      }

      state.animation = gsap.fromTo(lines,
        { opacity: state.open ? 0 : 1 },
        {
          opacity: state.open ? 1 : 0,
          duration: settings.duration,
          stagger: settings.stagger,
          ease: settings.ease,
          onComplete: () => finish(state, token)
        }
      );
    } catch (error) {
      // Leave original links and text available if splitting cannot run.
      finish(state, token);
      console.warn('FlowFormer FAQ: Text animation skipped.', error);
    }
  }

  function onClick(state) {
    cancelText(state);
    state.open = !state.open;
    state.button.setAttribute('aria-expanded', String(state.open));

    if (state.panel.contains(document.activeElement)) {
      state.button.focus({ preventScroll: true });
    }
    state.panel.hidden = false;
    makeAvailable(state, false);
    animateText(state);
  }

  function initialize() {
    // Only converted buttons are included; unfinished/old entries are untouched.
    document.querySelectorAll('.accordion_list button.accordion_trigger').forEach(button => {
      if (initialized.has(button)) return;
      const item = button.closest('.accordion_item');
      if (!item) return;
      const panel = [...item.children].find(child => child.matches('.accordion_panel'));
      if (!panel) return;

      initialized.add(button);
      button.type = 'button';
      if (!button.id) button.id = uniqueId('ff-faq-trigger');
      if (!panel.id) panel.id = uniqueId('ff-faq-panel');
      button.setAttribute('aria-controls', panel.id);
      button.setAttribute('aria-expanded', 'false');
      panel.hidden = true;

      // Ensure a pointer click on a decorative child reaches the native button.
      button.querySelectorAll('*').forEach(child => { child.style.pointerEvents = 'none'; });
      button.querySelectorAll('img, svg').forEach(icon => {
        icon.setAttribute('aria-hidden', 'true');
        if (icon.tagName === 'IMG') icon.alt = '';
        else icon.setAttribute('focusable', 'false');
      });

      const state = {
        button, panel, open: false, token: 0, animation: null, splits: [],
        texts: [...panel.querySelectorAll('.accordion_text')]
      };
      states.add(state);
      makeAvailable(state, false);

      // Capture prepares the text before Webflow starts the height animation.
      button.addEventListener('click', () => onClick(state), true);
    });
  }

  // Changing motion preference during a transition must restore normal content.
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    states.forEach(state => {
      cancelText(state);
      finish(state, state.token);
    });
  });

  window.Webflow = window.Webflow || [];
  window.Webflow.push(initialize);
})();
