const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
const homeLink = document.querySelector('.nav a[href="../../index.html#home"]');

const handleScroll = () => {
  if (!header) return;
  header.classList.toggle("scrolled", window.scrollY > 10);
};

const setMenuState = (isOpen) => {
  if (!header || !navToggle) return;
  header.classList.toggle("menu-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
};

const toggleMenu = () => {
  if (!header) return;
  const isOpen = !header.classList.contains("menu-open");
  setMenuState(isOpen);
};

navToggle?.addEventListener("click", toggleMenu);
nav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    setMenuState(false);
  }
});

homeLink?.addEventListener("click", (event) => {
  event.preventDefault();
  setMenuState(false);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const menuQuery = window.matchMedia("(min-width: 769px)");
const handleMenuQuery = () => {
  if (menuQuery.matches) {
    setMenuState(false);
  }
};

if (menuQuery.addEventListener) {
  menuQuery.addEventListener("change", handleMenuQuery);
} else if (menuQuery.addListener) {
  menuQuery.addListener(handleMenuQuery);
}

handleScroll();
window.addEventListener("scroll", handleScroll);
