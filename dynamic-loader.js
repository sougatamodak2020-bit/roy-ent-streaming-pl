/* ========================================
   DYNAMIC CONTENT LOADER - Roy Entertainment
   COMPLETE DATABASE INTEGRATION
======================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // Wait for Supabase to be ready
  if (!window.supabaseClient) {
    setTimeout(() => {
      document.dispatchEvent(new Event('DOMContentLoaded'));
    }, 50);
    return;
  }

  // Helper function to truncate text
  function truncateText(text, maxLength = 100) {
    if (!text) return 'No description available.';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  // Helper function to format runtime
  function formatRuntime(runtime) {
    if (!runtime) return 'N/A';
    return runtime;
  }

  // Load Our Productions from Database
  async function loadOurProductions() {
    const container = document.querySelector('#our-productions .film-grid');
    if (!container) return;

    try {
      // Show loading state
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Loading productions...</p>';

      // Fetch movies marked as our production or all movies
      const { data: movies, error } = await supabaseClient
        .from('movies')
        .select('*')
        .order('release', { ascending: false })
        .limit(12); // Show latest 12 productions

      if (error) throw error;

      if (movies && movies.length > 0) {
        container.innerHTML = movies.map(movie => {
          const poster = movie.poster || 'https://placehold.co/380x214/1a1a1a/eee?text=No+Poster';
          const rating = movie.rating || 0;
          const year = movie.release || 'N/A';
          const runtime = formatRuntime(movie.runtime);
          const description = truncateText(movie.description, 100);
          
          return `
            <article class="film-card" data-movie-id="${movie.id}">
              <div class="rating-display">
                <i class="fas fa-star"></i>
                <span>${parseFloat(rating).toFixed(1)}</span>
              </div>
              <img src="${poster}" alt="${movie.title}" 
                   onerror="this.onerror=null; this.src='https://placehold.co/380x214/1a1a1a/eee?text=No+Poster'" />
              <div class="card-content">
                <h3>${movie.title}</h3>
                <div class="film-card-meta">
                  <span class="rating"><i class="fas fa-star"></i> ${parseFloat(rating).toFixed(1)}</span>
                  <span>${year}</span>
                  <span>${runtime}</span>
                </div>
                <p>${description}</p>
              </div>
            </article>
          `;
        }).join('');

        console.log(`✅ Loaded ${movies.length} productions from database`);
      } else {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No productions available.</p>';
      }
    } catch (error) {
      console.error('Error loading productions:', error);
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Failed to load productions.</p>';
    }
  }

  // Load Continue Watching (with database integration)
  async function loadContinueWatching() {
    const grid = document.getElementById('continue-watching-grid');
    const section = document.querySelector('.continue-watching-section');
    
    if (!grid || !section) return;

    // Check if user is logged in
    if (!window.authService || !window.authService.isLoggedIn()) {
      return; // Don't show continue watching if not logged in
    }

    try {
      const user = window.authService.getCurrentUser();
      
      // Fetch watch history from database
      const { data: watchHistory, error: historyError } = await supabaseClient
        .from('watch_history')
        .select('movie_id, progress, watched_at')
        .eq('user_id', user.id)
        .order('watched_at', { ascending: false })
        .limit(6);

      if (historyError) throw historyError;

      if (watchHistory && watchHistory.length > 0) {
        // Get movie details for each watch history item
        const movieIds = watchHistory.map(item => item.movie_id);
        
        const { data: movies, error: moviesError } = await supabaseClient
          .from('movies')
          .select('*')
          .in('id', movieIds);

        if (moviesError) throw moviesError;

        // Create a map for quick lookup
        const moviesMap = {};
        movies.forEach(movie => {
          moviesMap[movie.id] = movie;
        });

        // Build the continue watching cards
        const cards = watchHistory.map(item => {
          const movie = moviesMap[item.movie_id];
          if (!movie) return '';

          const poster = movie.poster || 'https://placehold.co/320x180/1a1a1a/eee?text=No+Poster';
          const progress = item.progress || 0;
          
          return `
            <article class="film-card" data-movie-id="${movie.id}">
              <img src="${poster}" alt="${movie.title}"
                   onerror="this.onerror=null; this.src='https://placehold.co/320x180/1a1a1a/eee?text=No+Poster'" />
              <div class="card-content">
                <h3>${movie.title}</h3>
                <p>Continue watching...</p>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar" style="width:${progress}%"></div>
              </div>
            </article>
          `;
        }).filter(card => card !== '').join('');

        if (cards) {
          grid.innerHTML = cards;
          section.classList.add('visible');
        }
      }
    } catch (error) {
      console.log('Continue watching not loaded:', error.message);
    }
  }

  // Load Latest Movies for Hero Slider
  async function loadHeroSlides() {
    const slider = document.querySelector('.hero-slider');
    if (!slider) return;

    try {
      // Fetch featured/latest movies for the hero slider
      const { data: movies, error } = await supabaseClient
        .from('movies')
        .select('*')
        .order('release', { ascending: false })
        .limit(5); // Show 5 latest movies in slider

      if (error) throw error;

      if (movies && movies.length > 0) {
        // Clear existing slides except the gradient overlay
        const overlay = slider.querySelector('.hero-gradient-overlay');
        slider.innerHTML = '';
        
        // Add slides
        movies.forEach(movie => {
          const backdrop = movie.banner || movie.poster || 'https://placehold.co/1920x1080/1a1a1a/eee?text=No+Image';
          const rating = movie.rating || 0;
          const year = movie.release || 'N/A';
          const runtime = formatRuntime(movie.runtime);
          
          const slide = document.createElement('div');
          slide.className = 'slide';
          slide.style.backgroundImage = `url('${backdrop}')`;
          slide.dataset.movieId = movie.id;
          slide.innerHTML = `
            <div class="slide-content">
              <h2>${movie.title}</h2>
              <div class="slide-metadata">
                <span class="slide-rating"><i class="fas fa-star"></i> ${parseFloat(rating).toFixed(1)}</span>
                <span class="slide-separator">|</span>
                <span>${year}</span>
                <span class="slide-separator">|</span>
                <span>${runtime}</span>
              </div>
              <a href="watch.html?movie=${movie.id}" class="btn-primary">Watch Now</a>
            </div>
          `;
          slider.appendChild(slide);
        });

        // Re-add gradient overlay
        if (overlay) {
          slider.appendChild(overlay);
        } else {
          slider.innerHTML += '<div class="hero-gradient-overlay"></div>';
        }

        // Re-initialize hero slider
        setupHeroSlider();
        console.log(`✅ Loaded ${movies.length} movies in hero slider`);
      }
    } catch (error) {
      console.error('Error loading hero slides:', error);
    }
  }

  // Setup hero slider functionality
  function setupHeroSlider() {
    const slider = document.querySelector('.hero-slider');
    if (!slider) return;
    
    const slides = [...slider.children].filter(el => el.classList.contains('slide'));
    const dotsContainer = document.getElementById('slider-dots');
    let currentIndex = 0;
    let autoScrollInterval;
    
    if (!dotsContainer || slides.length === 0) return;
    
    // Clear and create dots
    dotsContainer.innerHTML = '';
    
    slides.forEach((slide, i) => {
      const dot = document.createElement('button');
      dot.className = 'dot';
      dot.dataset.index = i;
      dot.onclick = () => { 
        clearInterval(autoScrollInterval); 
        currentIndex = i; 
        scrollToSlide(); 
        startAutoScroll(); 
      };
      dotsContainer.appendChild(dot);
    });
    
    const dots = [...dotsContainer.children];
    
    const updateDots = () => { 
      dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
    };
    
    const scrollToSlide = () => slider.scrollTo({ 
      left: currentIndex * slider.clientWidth, 
      behavior: 'smooth' 
    });
    
    const startAutoScroll = () => {
      clearInterval(autoScrollInterval); 
      autoScrollInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % slides.length; 
        scrollToSlide(); 
        updateDots();
      }, 5000);
    };
    
    // Setup intersection observer for dot sync
    slides.forEach(slide => {
      new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            currentIndex = slides.indexOf(entry.target);
            updateDots();
          }
        });
      }, { root: slider, threshold: 0.51 }).observe(slide);
    });
    
    slider.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
    slider.addEventListener('mouseleave', startAutoScroll);
    window.addEventListener('resize', scrollToSlide);
    
    startAutoScroll(); 
    updateDots();
  }

  // Enhanced search with database
  async function setupDatabaseSearch() {
    const searchBar = document.getElementById('search-bar');
    if (!searchBar) return;

    let searchTimeout;
    
    searchBar.addEventListener('input', async (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      
      // Clear previous timeout
      clearTimeout(searchTimeout);
      
      if (searchTerm.length < 2) {
        // Reset view if search is cleared
        if (searchTerm.length === 0) {
          await loadOurProductions();
        }
        return;
      }
      
      // Debounce search
      searchTimeout = setTimeout(async () => {
        try {
          // Search in database
          const { data: movies, error } = await supabaseClient
            .from('movies')
            .select('*')
            .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,actors.ilike.%${searchTerm}%,director.ilike.%${searchTerm}%`)
            .limit(20);

          if (error) throw error;

          // Update the film grid with search results
          const container = document.querySelector('#our-productions .film-grid');
          if (container && movies) {
            if (movies.length > 0) {
              container.innerHTML = movies.map(movie => {
                const poster = movie.poster || 'https://placehold.co/380x214/1a1a1a/eee?text=No+Poster';
                const rating = movie.rating || 0;
                const year = movie.release || 'N/A';
                const runtime = formatRuntime(movie.runtime);
                const description = truncateText(movie.description, 100);
                
                return `
                  <article class="film-card" data-movie-id="${movie.id}">
                    <div class="rating-display">
                      <i class="fas fa-star"></i>
                      <span>${parseFloat(rating).toFixed(1)}</span>
                    </div>
                    <img src="${poster}" alt="${movie.title}" 
                         onerror="this.onerror=null; this.src='https://placehold.co/380x214/1a1a1a/eee?text=No+Poster'" />
                    <div class="card-content">
                      <h3>${movie.title}</h3>
                      <div class="film-card-meta">
                        <span class="rating"><i class="fas fa-star"></i> ${parseFloat(rating).toFixed(1)}</span>
                        <span>${year}</span>
                        <span>${runtime}</span>
                      </div>
                      <p>${description}</p>
                    </div>
                  </article>
                `;
              }).join('');
            } else {
              container.innerHTML = `<p style="text-align: center; grid-column: 1/-1; color: var(--text-secondary);">No movies found for "${searchTerm}"</p>`;
            }
          }
        } catch (error) {
          console.error('Search error:', error);
        }
      }, 300); // 300ms debounce
    });

    // Handle Enter key for navigation
    searchBar.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        window.location.href = `movies.html?search=${encodeURIComponent(e.target.value)}`;
      }
    });
  }

  // Inject external HTML files
  async function inject(url, selector, position = 'beforeend') {
    try {
      // Skip featured cast injection since we're using database
      if (url.includes('featured-cast')) {
        return;
      }
      
      // Only inject continue-watching container
      if (url.includes('continue-watching')) {
        const existingContent = document.querySelector('.continue-watching-section');
        if (existingContent) {
          console.log('Continue watching section already exists');
          return;
        }
        
        const target = document.querySelector(selector);
        if (target) {
          target.insertAdjacentHTML(position, `
            <div id="continue-watching-container">
              <section class="continue-watching-section">
                <h2 class="section-title">Continue Watching</h2>
                <div class="film-grid" id="continue-watching-grid"></div>
              </section>
            </div>
          `);
        }
      }
    } catch (error) {
      console.error(`Error injecting ${url}:`, error);
    }
  }

  // Click handler for movie cards
  document.body.addEventListener('click', (e) => {
    const card = e.target.closest('[data-movie-id]');
    if (card && !e.target.closest('.btn-primary')) { 
      e.preventDefault(); 
      const movieId = card.dataset.movieId;
      
      // Check login status
      if (window.authService && !window.authService.isLoggedIn()) {
        if (window.showLoginRequired) {
          window.showLoginRequired(movieId);
        } else {
          window.location.href = `login.html?redirect=watch.html?movie=${movieId}`;
        }
      } else {
        window.location.href = `watch.html?movie=${movieId}`; 
      }
    }
  });

  // Initialize everything
  (async () => {
    try {
      // Inject continue watching container
      await inject('continue-watching.html', '#our-productions', 'beforebegin');
      
      // Load all dynamic content from database
      await Promise.all([
        loadHeroSlides(),
        loadOurProductions(),
        loadContinueWatching()
      ]);
      
      // Setup search functionality
      setupDatabaseSearch();
      
      console.log('✅ All dynamic content loaded successfully');
    } catch (error) {
      console.error('Error initializing dynamic content:', error);
    } finally {
      // Hide preloader
      const preloader = document.getElementById('preloader');
      if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
          preloader.style.display = 'none';
          document.body.classList.remove('hidden');
        }, 300);
      }
    }
  })();
});