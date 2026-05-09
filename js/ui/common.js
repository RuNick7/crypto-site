// Shared UI: mobile nav burger + misc
(function () {
  // Burger toggle
  const burger = document.getElementById('navBurger');
  const links  = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', () => {
      links.classList.toggle('open');
    });
    // Close on link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => links.classList.remove('open'));
    });
  }

  // Clearance bar fill (common to all pages)
  const fill = document.getElementById('clearanceFill');
  const lvlEl = document.getElementById('clearanceLevel');
  if (fill || lvlEl) {
    const ops  = ['vigenere', 'enigma', 'venona'];
    const done = ops.filter(o => localStorage.getItem('done_' + o)).length;
    if (lvlEl) lvlEl.textContent = done;
    if (fill)  fill.style.width  = (done / 3 * 100) + '%';
  }
})();
