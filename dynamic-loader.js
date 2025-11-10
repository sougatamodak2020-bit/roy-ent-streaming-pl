/* ========================================
   DYNAMIC CONTENT LOADER - Roy Entertainment
   FIXED: Removed duplicate featured cast
======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // Inject external HTML files
  async function inject(url, sel, pos = 'beforeend') {
    try {
      // Check if content already exists to prevent duplicates
      const existingContent = document.querySelector(sel + ' .featured-cast-section');
      if (existingContent && url.includes('featured-cast')) {
        console.log('Featured cast already loaded, skipping duplicate');
        return;
      }
      
      let r = await fetch(url);
      if (r.ok) {
        const html = await r.text();
        const target = document.querySelector(sel);
        if (target) {
          // For featured-cast, check if it's already inserted
          if (url.includes('featured-cast') && document.querySelector('.featured-cast-section')) {
            console.log('Featured cast section already exists');
            return;
          }
          target.insertAdjacentHTML(pos, html);
        }
      }
    } catch (error) {
      console.error(`Error loading ${url}:`, error);
    }
  }

  // Setup search functionality
  function setupSearch() {
    let bar = document.getElementById('search-bar');
    let grids = document.querySelectorAll('.film-grid');
    
    if (!bar) return;
    
    bar.addEventListener('input', e => {
      let v = e.target.value.toLowerCase();
      grids.forEach(g => {
        g.querySelectorAll('.film-card').forEach(c => {
          const title = c.querySelector('h3');
          if (title) {
            c.style.display = title.textContent.toLowerCase().includes(v) ? 'block' : 'none';
          }
        });
      });
    });
    
    let q = new URLSearchParams(location.search).get('search');
    if (q) { 
      bar.value = q; 
      bar.dispatchEvent(new Event('input')); 
    }
  }

  // Load continue watching
  function loadContinue() {
    let data = JSON.parse(localStorage.getItem('watchProgress') || '{}');
    let db = { 
      'asur': ['Asur', 'img/movie-banner-1.png'], 
      'lazy-assassin': ['Lazy Assassin', 'img/movie-banner-2.webp'], 
      'rudrapur': ['Rudrapur', 'img/movie-banner-3.png'],
      'predictor': ['Predictor', 'img/movie-banner-4.jpg'],
      'niladri': ['Niladri', 'img/movie-banner-5.webp'],
      'celcius': ['Celcius', 'img/movie-banner-6.jpg'],
      '12-am': ['12 AM', 'img/movie-banner-7.png']
    };
    
    let grid = document.getElementById('continue-watching-grid');
    let sec = document.querySelector('.continue-watching-section');
    
    if (!grid) return;
    
    Object.entries(data).sort((a, b) => b[1].timestamp - a[1].timestamp)
      .forEach(([id, v]) => {
        let m = db[id]; 
        if (!m) return;
        let pct = v.currentTime / v.duration * 100;
        grid.insertAdjacentHTML('beforeend', `
          <article class="film-card" data-movie-id="${id}">
            <img src="${m[1]}" alt="${m[0]}"/>
            <div class="card-content">
              <h3>${m[0]}</h3>
              <p>Continue watching...</p>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" style="width:${pct}%"></div>
            </div>
          </article>`);
      });
    
    if (grid.children.length && sec) {
      sec.classList.add('visible');
    }
  }

  // Show ratings
  function showRatings() {
    let R = JSON.parse(localStorage.getItem('movieRatings') || '{}');
    document.querySelectorAll('.film-card').forEach(c => {
      let r = R[c.dataset.movieId];
      if (r) {
        let d = c.querySelector('.rating-display');
        if (d) {
          d.innerHTML = `<i class="fas fa-star"></i><span>${r}.0</span>`;
          d.classList.add('visible');
        }
      }
    });
  }

  // Setup hero slider
  function setupHero() {
    let s = document.querySelector('.hero-slider');
    if (!s) return;
    
    let slides = [...s.children].filter(el => el.classList.contains('slide'));
    let dots = document.getElementById('slider-dots');
    let idx = 0;
    let iv;
    
    if (!dots || slides.length === 0) return;
    
    dots.innerHTML = '';
    
    slides.forEach((sl, i) => {
      let b = document.createElement('button');
      b.className = 'dot';
      b.dataset.index = i;
      b.onclick = () => { 
        clearInterval(iv); 
        idx = i; 
        scroll(); 
        start(); 
      };
      dots.append(b);
    });
    
    let ds = [...dots.children];
    
    const update = () => { 
      ds.forEach((d, i) => d.classList.toggle('active', i === idx));
    };
    
    const scroll = () => s.scrollTo({ 
      left: idx * s.clientWidth, 
      behavior: 'smooth' 
    });
    
    const start = () => {
      clearInterval(iv); 
      iv = setInterval(() => {
        idx = (idx + 1) % slides.length; 
        scroll(); 
        update();
      }, 5000);
    };
    
    // Intersection Observer for dot sync
    slides.forEach(sl => {
      new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            idx = slides.indexOf(e.target);
            update();
          }
        });
      }, { root: s, threshold: 0.51 }).observe(sl);
    });
    
    s.addEventListener('mouseenter', () => clearInterval(iv));
    s.addEventListener('mouseleave', start);
    window.addEventListener('resize', scroll);
    
    start(); 
    update();
  }

  // Click handler for movie cards
  document.body.addEventListener('click', e => {
    let c = e.target.closest('[data-movie-id]');
    if (c) { 
      e.preventDefault(); 
      location.href = `watch.html?movie=${c.dataset.movieId}`; 
    }
  });

  // Hide preloader
  window.onload = () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.style.display = 'none';
        document.body.classList.remove('hidden');
      }, 300);
    }
  };

  // Initialize everything
  (async () => {
    // Inject continue watching and featured cast (only once)
    await inject('continue-watching.html', '#our-productions', 'beforebegin');
    
    // Only inject featured cast if it doesn't exist
    if (!document.querySelector('.featured-cast-section')) {
      await inject('featured-cast.html', 'main.film-grid-container', 'afterend');
    }
    
    loadContinue(); 
    setupHero(); 
    showRatings(); 
    setupSearch();
  })();
});