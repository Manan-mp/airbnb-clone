/*
 * Paste into the browser console on /, or /s (desktop or phone width).
 * Scrolls slowly, quickly, by jumps, and wiggles around both thresholds, logging every header
 * state change plus the first card's document-space position and the document height
 * (any change in those two while scrolling would be a layout shift).
 *
 * Expected on "/" at md+: exactly one "collapsed" going down and one "expanded" coming back up per
 * phase, positions/heights constant. On /s and phone widths: no state changes at all.
 *
 * It dispatches a scroll event after each scripted scroll so it also works in a hidden tab, where
 * browsers do not deliver scroll events.
 */
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const hdr = [...document.querySelectorAll("header")].find((h) => getComputedStyle(h).display !== "none");
  const log = [];
  if (hdr.hasAttribute("data-state")) {
    new MutationObserver(() => log.push(`${Math.round(scrollY)}:${hdr.dataset.state}`)).observe(hdr, {
      attributes: true,
      attributeFilter: ["data-state"],
    });
  }
  const card = document.querySelector("article");
  const docY = () => Math.round(card.getBoundingClientRect().top + scrollY);
  const ys = new Set([docY()]);
  const hs = new Set([document.documentElement.scrollHeight]);
  const sc = (y) => {
    window.scrollTo(0, y);
    dispatchEvent(new Event("scroll"));
    ys.add(docY());
    hs.add(document.documentElement.scrollHeight);
  };
  const go = async (y, step, delay) => {
    for (let g = 0; Math.abs(scrollY - y) > 0.5 && g < 3000; g++) {
      sc(scrollY + Math.sign(y - scrollY) * Math.min(Math.abs(y - scrollY), step));
      await sleep(delay);
    }
    await sleep(450);
  };
  const phases = {};
  const mark = (n) => ((phases[n] = log.join(" ") || "(none)"), (log.length = 0));
  sc(0);
  await sleep(400);
  await go(500, 4, 16), mark("slow down");
  await go(0, 4, 16), mark("slow up");
  await go(500, 100, 20), mark("fast down");
  await go(0, 100, 20), mark("fast up");
  for (const y of [60, 79, 81, 50, 81, 30, 81, 25, 81, 19, 60, 19, 79, 19, 60]) await go(y, 3, 16);
  mark("wiggles across 80 and 20");
  console.log(JSON.stringify({ vw: innerWidth, phases, firstCardDocY: [...ys], docHeights: [...hs] }, null, 1));
})();
