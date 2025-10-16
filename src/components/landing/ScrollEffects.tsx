"use client";

import { useEffect } from "react";

export default function ScrollEffects() {
  useEffect(() => {
    // Reveal-on-scroll
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>(".reveal-on-scroll"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            const delay = el.dataset.revealDelay;
            if (delay) {
              const val = /ms|s$/.test(delay) ? delay : `${delay}ms`;
              el.style.transitionDelay = val;
            }
            el.classList.add("in-view");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    revealEls.forEach((el) => io.observe(el));

    // Parallax
    let ticking = false;
    const parallaxEls = Array.from(
      document.querySelectorAll<HTMLElement>("[data-parallax]")
    );

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const yOffset = window.scrollY || window.pageYOffset;
          parallaxEls.forEach((el) => {
            const speedStr = el.dataset.parallax || "0.15";
            const dir = el.dataset.parallaxDir || "down";
            const speed = parseFloat(speedStr);
            if (Number.isNaN(speed)) return;
            const translateY = (dir === "up" ? -1 : 1) * yOffset * speed;
            el.style.transform = `translate3d(0, ${translateY}px, 0)`;
            el.style.willChange = "transform";
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // initial position
    onScroll();

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
