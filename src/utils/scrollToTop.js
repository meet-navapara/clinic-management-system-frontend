export function scrollToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  document.querySelectorAll('[data-scroll-root]').forEach((element) => {
    element.scrollTop = 0;
  });
}
