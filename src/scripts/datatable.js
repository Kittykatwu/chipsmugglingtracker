// Progressive enhancement for tables: search, filters and sorting, with state
// mirrored in the URL (?q=&country=&sort=&dir=) so filtered views can be shared.
// Without JavaScript the full table still renders.
export function initDataTable(root) {
  const table = root.querySelector('table');
  const tbody = table.tBodies[0];
  const rows = [...tbody.rows];
  const search = root.querySelector('[data-search]');
  const filters = [...root.querySelectorAll('[data-filter]')];
  const sortBtns = [...table.querySelectorAll('button[data-sort]')];
  const mobileSort = root.querySelector('[data-mobile-sort]');
  const count = root.querySelector('[data-count]');
  const reset = root.querySelector('[data-reset]');
  const noun = root.dataset.noun || 'rows';
  const defaultSort = root.dataset.defaultSort || '';
  const defaultDir = root.dataset.defaultDir || 'asc';
  let sortKey = defaultSort, sortDir = defaultDir;

  function readUrl() {
    const p = new URLSearchParams(location.search);
    if (search) search.value = p.get('q') || '';
    filters.forEach((f) => (f.value = p.get(f.dataset.filter) || ''));
    sortKey = p.get('sort') || defaultSort;
    sortDir = p.get('dir') === 'desc' ? 'desc' : p.get('dir') === 'asc' ? 'asc' : defaultDir;
  }
  function writeUrl() {
    const p = new URLSearchParams();
    if (search && search.value.trim()) p.set('q', search.value.trim());
    filters.forEach((f) => f.value && p.set(f.dataset.filter, f.value));
    if (sortKey && (sortKey !== defaultSort || sortDir !== defaultDir)) { p.set('sort', sortKey); p.set('dir', sortDir); }
    const qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }
  function apply() {
    const q = (search?.value || '').trim().toLowerCase();
    let shown = 0;
    rows.forEach((r) => {
      let ok = !q || r.textContent.toLowerCase().includes(q);
      for (const f of filters) {
        if (!ok || !f.value) continue;
        const vals = (r.dataset[f.dataset.filter] || '').split('|');
        ok = vals.includes(f.value);
      }
      r.hidden = !ok;
      if (ok) shown++;
    });
    const sorted = [...rows].sort((a, b) => {
      if (!sortKey) return 0;
      const btn = sortBtns.find((s) => s.dataset.sort === sortKey);
      const type = btn?.dataset.type || 'text';
      let x = a.dataset['s' + sortKey] ?? '', y = b.dataset['s' + sortKey] ?? '';
      let c;
      if (type === 'num') {
        const nx = x === '' ? -Infinity : Number(x), ny = y === '' ? -Infinity : Number(y);
        c = nx - ny;
      } else c = x.localeCompare(y, 'en', { numeric: true });
      return sortDir === 'asc' ? c : -c;
    });
    sorted.forEach((r) => tbody.appendChild(r));
    sortBtns.forEach((b) => {
      const th = b.closest('th');
      const active = b.dataset.sort === sortKey;
      th.setAttribute('aria-sort', active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none');
      b.querySelector('.arrow').textContent = active ? (sortDir === 'asc' ? '▲' : '▼') : '';
    });
    if (mobileSort) mobileSort.value = sortKey ? `${sortKey}:${sortDir}` : '';
    if (count) count.textContent = `Showing ${shown} of ${rows.length} ${noun}`;
    writeUrl();
  }
  sortBtns.forEach((b) =>
    b.addEventListener('click', () => {
      if (sortKey === b.dataset.sort) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortKey = b.dataset.sort; sortDir = b.dataset.type === 'num' || b.dataset.type === 'date' ? 'desc' : 'asc'; }
      apply();
    })
  );
  mobileSort?.addEventListener('change', () => {
    const [k, d] = mobileSort.value.split(':');
    sortKey = k || ''; sortDir = d || 'asc'; apply();
  });
  search?.addEventListener('input', apply);
  filters.forEach((f) => f.addEventListener('change', apply));
  reset?.addEventListener('click', () => {
    if (search) search.value = '';
    filters.forEach((f) => (f.value = ''));
    sortKey = defaultSort; sortDir = defaultDir; apply();
  });
  readUrl();
  root.querySelector('.table-tools')?.removeAttribute('hidden');
  apply();
}
