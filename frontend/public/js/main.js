/* file js principale - gestisce tutte le interazioni lato client */

/* chiudo i messaggi flash automaticamente dopo qualche secondo */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.querySelectorAll('.flash-alert').forEach(alert => {
      const bsAlert = bootstrap.Alert.getInstance(alert);
      if (bsAlert) bsAlert.close();
      else alert.remove();
    });
  }, 4500);
});

/* ricerca e filtro delle opere nella gallery */
const searchInput = document.getElementById('searchInput');
const styleFilter = document.getElementById('styleFilter');
const worksGrid = document.getElementById('worksGrid');
const tagFilters = document.querySelectorAll('.tag-filter');

if (searchInput) {
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterWorks, 250);
  });
}

if (styleFilter) {
  styleFilter.addEventListener('change', filterWorks);
}

if (tagFilters.length > 0) {
  tagFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      tagFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterWorks();
    });
  });
}

function filterWorks() {
  if (!worksGrid) return;
  const query = searchInput ? searchInput.value.toLowerCase() : '';
  const style = styleFilter ? styleFilter.value.toLowerCase() : '';
  const activeTagBtn = document.querySelector('.tag-filter.active');
  const activeTag = activeTagBtn ? activeTagBtn.dataset.tag : '';

  document.querySelectorAll('.work-card').forEach(card => {
    const title = (card.querySelector('.work-title')?.textContent || '').toLowerCase();
    const tags = (card.dataset.tags || '').toLowerCase();
    const cardStyle = (card.dataset.style || '').toLowerCase();
    const aiPreview = (card.querySelector('.work-ai-preview')?.textContent || '').toLowerCase();

    const matchQuery = !query || title.includes(query) || tags.includes(query) || aiPreview.includes(query);
    const matchStyle = !style || cardStyle === style;
    const matchTag = !activeTag || tags.includes(activeTag);

    card.style.display = (matchQuery && matchStyle && matchTag) ? '' : 'none';
  });
}

/* effetto ombra sulla navbar quando si scrolla la pagina */
const nav = document.getElementById('mainNav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 20
      ? '0 4px 30px rgba(0,0,0,0.5)'
      : 'none';
  });
}

/* carico le immagini lazy così la pagina carica più veloce, evito di scaricare tutto subito */
if ('IntersectionObserver' in window) {
  const imgObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        imgObserver.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  document.querySelectorAll('img[data-src]').forEach(img => imgObserver.observe(img));
}

/* copia il colore hex negli appunti quando clicchi su uno swatch */
document.querySelectorAll('.palette-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    const color = swatch.dataset.color;
    if (color && navigator.clipboard) {
      navigator.clipboard.writeText(color).then(() => {
        swatch.classList.add('copied');
        setTimeout(() => swatch.classList.remove('copied'), 1200);
      });
    }
  });
});

/* animazione di entrata per le card quando appaiono nello schermo */
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.work-card');
  if (cards.length > 0 && 'IntersectionObserver' in window) {
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, i * 30);
          cardObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '50px' });

    cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      cardObserver.observe(card);
    });
  }
});
