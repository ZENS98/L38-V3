const revealTargets = document.querySelectorAll(".section, .reveal-card");
const header = document.querySelector(".header");
const navLinks = Array.from(document.querySelectorAll('.menu a[href^="#"]'));
const pageAnchorLinks = Array.from(document.querySelectorAll('a[href^="#"]'));

const easeOutCubic = (progress) => 1 - Math.pow(1 - progress, 3);

const getHeaderOffset = () => (header ? header.offsetHeight : 0);

const getTargetTop = (target) => {
  const headerOffset = getHeaderOffset();
  const targetTop = target.getBoundingClientRect().top + window.scrollY;
  return Math.max(0, targetTop - headerOffset + 1);
};

let activeScrollAnimation = 0;

const smoothScrollTo = (target) => {
  const startY = window.scrollY;
  const endY = getTargetTop(target);
  const distance = endY - startY;
  const duration = Math.min(1100, Math.max(520, Math.abs(distance) * 0.55));
  const startTime = performance.now();

  window.cancelAnimationFrame(activeScrollAnimation);

  const animateScroll = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    window.scrollTo(0, startY + distance * easeOutCubic(progress));

    if (progress < 1) {
      activeScrollAnimation = window.requestAnimationFrame(animateScroll);
      return;
    }

    activeScrollAnimation = 0;
  };

  activeScrollAnimation = window.requestAnimationFrame(animateScroll);
};

const setActiveNavLink = (sectionId) => {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${sectionId}`;
    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const sectionTargets = navLinks
  .map((link) => {
    const hash = link.getAttribute("href");
    return hash && hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
  })
  .filter(Boolean);

let activeNavTicking = false;

const updateActiveNav = () => {
  const marker = window.scrollY + getHeaderOffset() + window.innerHeight * 0.28;
  let currentSection = sectionTargets[0];

  sectionTargets.forEach((section) => {
    if (section.offsetTop <= marker) {
      currentSection = section;
    }
  });

  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
    currentSection = sectionTargets[sectionTargets.length - 1] || currentSection;
  }

  if (currentSection) {
    setActiveNavLink(currentSection.id);
  }

  activeNavTicking = false;
};

const requestActiveNavUpdate = () => {
  if (activeNavTicking) return;
  activeNavTicking = true;
  window.requestAnimationFrame(updateActiveNav);
};

pageAnchorLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    const target = hash && hash.length > 1 ? document.getElementById(hash.slice(1)) : null;

    if (!target) return;

    event.preventDefault();
    setActiveNavLink(target.id);
    smoothScrollTo(target);

    if (window.history && window.history.pushState) {
      window.history.pushState(null, "", hash);
    }
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.16
  }
);

revealTargets.forEach((target) => revealObserver.observe(target));

requestActiveNavUpdate();
window.addEventListener("scroll", requestActiveNavUpdate, { passive: true });
window.addEventListener("resize", requestActiveNavUpdate, { passive: true });

const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");

if (hamburger && mobileMenu) {
  const closeMenu = () => {
    mobileMenu.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  };

  hamburger.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("open");
    hamburger.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) {
      closeMenu();
    }
  });
}
