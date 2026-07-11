/* Client-side filtering for the course overview. The form remains usable as a
 * normal GET form when JavaScript is unavailable. */
(() => {
  const form = document.querySelector('[data-course-filter-form]');
  const grid = document.querySelector('[data-course-grid]');
  if (!form || !grid) return;

  const controls = [...form.querySelectorAll('[data-course-filter]')];
  const cards = [...grid.querySelectorAll('.course-card')];
  const emptyState = document.querySelector('[data-filter-empty]');

  function applyFilters() {
    const selected = Object.fromEntries(
      controls.map(control => [control.dataset.courseFilter, control.value])
    );
    let visibleCount = 0;

    cards.forEach(card => {
      const visible = Object.entries(selected).every(([filter, value]) =>
        !value || card.dataset[filter] === value
      );
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    emptyState.hidden = visibleCount !== 0;
  }

  controls.forEach(control => control.addEventListener('change', applyFilters));
  form.addEventListener('submit', event => {
    event.preventDefault();
    applyFilters();
  });
})();
