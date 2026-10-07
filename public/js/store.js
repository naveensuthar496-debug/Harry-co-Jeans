import { API, showToast } from './api.js';

// Safe HTML entity escaping
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
window.escapeHtml = escapeHtml;

// State Management
export const State = {
  settings: {},
  navigation: [],
  sections: [],
  products: [],
  categories: [],
  collections: [],
  cart: JSON.parse(localStorage.getItem('hc_cart') || '[]'),
  currentFilter: 'all',
  selectedProduct: null,
  appliedCoupon: null,
  paymentMethods: []
};

// Immediate attachment of global UI helper methods
window.openCartDrawer = openCartDrawer;
window.closeCartDrawer = closeCartDrawer;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.addToCart = addToCart;
window.__hc_openCartDrawer = openCartDrawer;
window.__hc_closeCartDrawer = closeCartDrawer;
window.__hc_updateCartQuantity = updateCartQuantity;
window.__hc_removeFromCart = removeFromCart;
window.__hc_addToCart = addToCart;
window.__hc_renderCartDrawer = renderCartDrawer;

// Resilient Initialization (fires even if DOMContentLoaded already dispatched)
async function startApp() {
  initEventListeners();
  await loadStoreData();
  await handleRouting();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

window.addEventListener('hashchange', () => {
  handleRouting();
});

// Load all dynamic data from backend APIs
async function loadStoreData() {
  try {
    const [settingsRes, navRes, sectionsRes, categoriesRes] = await Promise.all([
      API.getStoreSettings(),
      API.getNavigation(),
      API.getHomepageSections(),
      API.getCategories()
    ]);

    State.settings = settingsRes.settings || {};
    State.navigation = navRes.menu || [];
    State.sections = sectionsRes.sections || [];
    State.categories = categoriesRes.categories || [];

    // Check maintenance mode
    if (State.settings.maintenance_mode === 'true') {
      renderMaintenanceMode();
      return;
    }

    applyStoreSettings();
  } catch (err) {
    console.error('Failed to load store baseline data:', err);
  }
}

function applyStoreSettings() {
  const brandName = State.settings.brand_name || 'HARRY & CO';
  document.title = State.settings.seo_title || `${brandName} | Artisanal Denim`;

  // Update dynamic brand name in headers and footers
  document.querySelectorAll('.brand-name-target').forEach(el => {
    el.textContent = brandName;
  });

  const currencySymbol = State.settings.currency_symbol || '₹';
  State.currency = currencySymbol;

  // Render navigation dynamically
  renderNavigation();
  // Render footer information dynamically
  renderFooter();
  // Update cart badge
  updateCartBadge();
}

function renderNavigation() {
  const navContainer = document.getElementById('desktop-nav-container');
  const mobileNavContainer = document.getElementById('mobile-nav-links');

  if (navContainer) {
    navContainer.innerHTML = State.navigation.map(item => `
      <a href="${item.url}" class="nav-link">${escapeHtml(item.label)}</a>
    `).join('');
  }

  if (mobileNavContainer) {
    mobileNavContainer.innerHTML = State.navigation.map(item => `
      <a href="${item.url}" class="mobile-nav-link" onclick="closeMobileNav()">${escapeHtml(item.label)}</a>
    `).join('');
  }
}

function renderFooter() {
  const brandName = State.settings.brand_name || 'HARRY & CO';
  const tagLine = State.settings.tag_line || 'Bespoke Denim Heritage';
  const address = State.settings.store_address || 'India';
  const email = State.settings.store_email || 'harry23yt@gmail.com';
  const phone = State.settings.store_phone || '907617347';
  const returnPolicy = State.settings.return_policy || 'Complimentary 14-day unworn returns and exchanges on all artisanal denim items.';
  const copyrightYear = new Date().getFullYear();

  const footerContainer = document.getElementById('footer-dynamic-content');
  if (footerContainer) {
    footerContainer.innerHTML = `
      <div class="footer-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:2.5rem; margin-bottom:3rem;">
        <!-- Brand & Heritage -->
        <div class="footer-brand">
          <div class="brand-logo" style="margin-bottom:0.75rem;">
            <img src="/assets/logo.jpg" alt="Harry &amp; Co Jeans" style="height:60px; width:auto; object-fit:contain; filter:brightness(0) invert(1); opacity:0.92;">
          </div>
          <p class="footer-desc" style="color:#7a8fa8; font-size:0.85rem; line-height:1.65; max-width:280px; margin-bottom:1.25rem;">
            Imagined by us. Crafted by hand. Made for you.
          </p>
          <div class="footer-social-links" style="display:flex; gap:0.6rem; flex-wrap:wrap; align-items:center;">
            <a href="https://www.instagram.com/harrycojeans/" target="_blank" rel="noopener" title="Follow us on Instagram" aria-label="Instagram" style="display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:8px; background:linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color:#fff; text-decoration:none; transition:opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
          </div>
        </div>

        <!-- Shop Navigation -->
        <div>
          <h4 class="footer-col-title" style="color:#DAA520; font-size:0.75rem; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:1.2rem;">Shop</h4>
          <ul class="footer-links" style="list-style:none; padding:0; display:flex; flex-direction:column; gap:0.65rem;">
            <li><a href="#shop" class="footer-link">All Denim</a></li>
            <li><a href="#shop?filter=new" class="footer-link">New Arrivals</a></li>
            <li><a href="#shop?filter=bestseller" class="footer-link">Best Sellers</a></li>
            <li><a href="#about" class="footer-link">Heritage & Craft</a></li>
            <li><a href="#shop" class="footer-link" style="color:#DAA520; font-weight:600;">Sale Archive</a></li>
          </ul>
        </div>

        <!-- Support -->
        <div>
          <h4 class="footer-col-title" style="color:#DAA520; font-size:0.75rem; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:1.2rem;">Support</h4>
          <ul class="footer-links" style="list-style:none; padding:0; display:flex; flex-direction:column; gap:0.65rem;">
            <li><a href="/track" class="footer-link">Track My Order</a></li>
            <li><a href="/login" class="footer-link">My Account / Sign In</a></li>
            <li><a href="/return-policy" class="footer-link">Returns & Exchanges</a></li>
            <li><a href="/refund-policy" class="footer-link">Refund Policy</a></li>
            <li><a href="#about" class="footer-link">Size Consultation</a></li>
          </ul>
        </div>

        <!-- Contact Us Section -->
        <div class="footer-contact-section" id="footer-contact-us">
          <h4 class="footer-col-title" style="color:#DAA520; font-size:0.75rem; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:1.2rem;">Contact Us</h4>
          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            <a href="tel:${escapeHtml(phone)}" class="footer-link" style="display:flex; align-items:center; gap:0.6rem; color:#e2e8f0; font-weight:500; font-size:0.88rem; text-decoration:none;" onmouseover="this.style.color='#DAA520'" onmouseout="this.style.color='#e2e8f0'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DAA520" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.64A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.27-.63a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              <span>${escapeHtml(phone)}</span>
            </a>
            <a href="mailto:${escapeHtml(email)}" class="footer-link" style="display:flex; align-items:center; gap:0.6rem; color:#e2e8f0; font-weight:500; font-size:0.88rem; text-decoration:none;" onmouseover="this.style.color='#DAA520'" onmouseout="this.style.color='#e2e8f0'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DAA520" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span>${escapeHtml(email)}</span>
            </a>
            <div style="font-size:0.78rem; color:#7a8fa8; line-height:1.5; margin-top:0.25rem;">
              <div>🕒 Mon – Sat: 10:00 AM – 7:00 PM IST</div>
              <div>📍 Atelier &amp; Logistics, ${escapeHtml(address)}</div>
            </div>
          </div>
        </div>

        <!-- Policies & Legal -->
        <div>
          <h4 class="footer-col-title" style="color:#DAA520; font-size:0.75rem; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:1.2rem;">Policies &amp; Legal</h4>
          <ul class="footer-links" style="list-style:none; padding:0; display:flex; flex-direction:column; gap:0.65rem;">
            <li><a href="/privacy-policy" class="footer-link">Privacy Policy</a></li>
            <li><a href="/refund-policy" class="footer-link">Refund Policy</a></li>
            <li><a href="/return-policy" class="footer-link">Return Policy</a></li>
            <li><a href="/disclaimer" class="footer-link">Disclaimer</a></li>
          </ul>
        </div>
      </div>

      <!-- Newsletter Bar -->
      <div style="background:rgba(184,134,11,0.06); border:1px solid rgba(184,134,11,0.18); border-radius:12px; padding:1.5rem 2rem; margin:2.5rem 0 2rem 0; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1.25rem;">
        <div>
          <div style="font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:600; color:#DAA520; margin-bottom:0.2rem;">The Denim Archive &bull; Concierge Newsletter</div>
          <div style="font-size:0.82rem; color:#7a8fa8;">Get exclusive early access to small-batch drops, raw selvedge restocks &amp; private releases.</div>
        </div>
        <form onsubmit="subscribeNewsletter(event)" style="display:flex; gap:0.75rem; flex-wrap:wrap;">
          <input id="footer-nl-email" type="email" placeholder="your@email.com" required style="
            background:#0d1a2e; border:1px solid rgba(255,255,255,0.12); border-radius:6px;
            padding:0.65rem 1rem; color:#e8dcc8; font-family:'Outfit',sans-serif; font-size:0.88rem;
            outline:none; min-width:220px;
          ">
          <button type="submit" style="
            background:linear-gradient(135deg,#B8860B,#DAA520); border:none; border-radius:6px;
            padding:0.65rem 1.4rem; color:#fff; font-family:'Outfit',sans-serif; font-size:0.8rem;
            font-weight:700; letter-spacing:0.1em; cursor:pointer;
          ">JOIN ARCHIVE</button>
        </form>
      </div>

      <!-- Footer Bottom -->
      <div class="footer-bottom" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; padding-top:1.5rem; border-top:1px solid rgba(255,255,255,0.08); font-size:0.78rem; color:#7a8fa8;">
        <div>&copy; ${copyrightYear} ${escapeHtml(brandName)} Jeans Co. All Rights Reserved.</div>
        <div style="display:flex; gap:1.5rem; flex-wrap:wrap;">
          <a href="/privacy-policy" style="color:#7a8fa8; text-decoration:none;" onmouseover="this.style.color='#DAA520'" onmouseout="this.style.color='#7a8fa8'">Privacy Policy</a>
          <a href="/refund-policy" style="color:#7a8fa8; text-decoration:none;" onmouseover="this.style.color='#DAA520'" onmouseout="this.style.color='#7a8fa8'">Refund Policy</a>
          <a href="/return-policy" style="color:#7a8fa8; text-decoration:none;" onmouseover="this.style.color='#DAA520'" onmouseout="this.style.color='#7a8fa8'">Return Policy</a>
          <a href="/disclaimer" style="color:#7a8fa8; text-decoration:none;" onmouseover="this.style.color='#DAA520'" onmouseout="this.style.color='#7a8fa8'">Disclaimer</a>
        </div>
        <div style="color:var(--color-copper-light); font-weight:600;">Handcrafted Precision &bull; Raw Denim Heritage</div>
      </div>
    `;
  }
}

// Router & View Switcher
export async function handleRouting() {
  const hash = window.location.hash || '#home';
  const mainContent = document.getElementById('main-dynamic-view');
  if (!mainContent) return;

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (hash.startsWith('#shop')) {
    await renderShopView(hash);
  } else if (hash.startsWith('#product/')) {
    const slug = hash.replace('#product/', '');
    await renderProductDetailView(slug);
  } else if (hash === '#checkout') {
    await renderCheckoutView();
  } else if (hash === '#track') {
    renderTrackOrderView();
  } else if (hash === '#about') {
    renderAboutView();
  } else if (hash === '#policies') {
    renderPoliciesView();
  } else {
    // Default to Dynamic Homepage Builder
    await renderHomepageView();
  }
}

// 1. DYNAMIC HOMEPAGE BUILDER RENDERER
async function renderHomepageView() {
  const mainContent = document.getElementById('main-dynamic-view');
  mainContent.innerHTML = '<div style="text-align:center; padding:5rem;"><div class="spinner"></div><p style="margin-top:1rem; color:var(--color-text-muted);">Retrieving Atelier Collection...</p></div>';

  try {
    // Fetch products to feed carousels
    const [prodsRes, reviewsRes] = await Promise.all([
      API.getProducts({ limit: 20 }),
      API.getRecentReviews()
    ]);

    State.products = prodsRes.products || [];
    const reviews = reviewsRes.reviews || [];

    // Build homepage based strictly on DB sections in order
    let html = '';

    for (const section of State.sections) {
      if (!section.enabled) continue;

      switch (section.section_type) {
        case 'announcement_bar':
          // Rendered at top of page
          break;

        case 'hero_banner':
          html += renderHeroSection(section);
          break;

        case 'featured_categories':
          html += renderCategoriesSection(section);
          break;

        case 'product_carousel':
          html += renderProductCarouselSection(section, State.products);
          break;

        case 'promo_banner':
          html += renderPromoBannerSection(section);
          break;

        case 'brand_story':
          html += renderBrandStorySection(section);
          break;

        case 'customer_reviews':
          html += renderReviewsSection(section, reviews);
          break;

        case 'newsletter':
          html += renderNewsletterSection(section);
          break;

        default:
          html += renderGenericSection(section);
          break;
      }
    }

    mainContent.innerHTML = html;
  } catch (err) {
    mainContent.innerHTML = `
      <div class="container section-padding">
        <div class="empty-state">
          <h3 class="empty-state-title">Unable to load storefront</h3>
          <p class="empty-state-desc">${escapeHtml(err.message)}</p>
          <button class="btn btn-primary" onclick="window.location.reload()">Reload</button>
        </div>
      </div>
    `;
  }
}

function renderHeroSection(s) {
  const meta = s.metadata || {};
  return `
    <section class="hero-section">
      <div class="hero-bg-media" style="background-image: url('${s.image_url || 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1600&auto=format&fit=crop'}')"></div>
      <div class="hero-overlay"></div>
      <div class="container">
        <div class="hero-content">
          ${meta.badge ? `<div class="hero-badge">◈ ${escapeHtml(meta.badge)}</div>` : ''}
          ${s.subtitle ? `<div class="hero-subtitle">${escapeHtml(s.subtitle)}</div>` : ''}
          <h1 class="hero-title">${escapeHtml(s.title || 'MASTERPIECES IN INDIGO')}</h1>
          <p class="hero-desc">${escapeHtml(s.description || '')}</p>
          <div class="hero-actions">
            ${s.cta_text ? `<a href="${s.cta_url || '#shop'}" class="btn btn-primary">${escapeHtml(s.cta_text)}</a>` : ''}
            ${meta.secondary_cta_text ? `<a href="${meta.secondary_cta_url || '#about'}" class="btn btn-outline-white">${escapeHtml(meta.secondary_cta_text)}</a>` : ''}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderCategoriesSection(s) {
  if (!State.categories || State.categories.length === 0) {
    return `
      <section class="section-padding">
        <div class="container">
          <div class="section-header">
            ${s.subtitle ? `<div class="section-pretitle">${escapeHtml(s.subtitle)}</div>` : ''}
            <h2 class="section-title">${escapeHtml(s.title || 'Categories')}</h2>
          </div>
          <div class="empty-state">
            <h4 class="empty-state-title">No categories available right now.</h4>
            <p class="empty-state-desc">Categories added via the admin panel will appear here.</p>
          </div>
        </div>
      </section>
    `;
  }

  return `
    <section class="section-padding" style="background:var(--color-bg-subtle);">
      <div class="container">
        <div class="section-header">
          ${s.subtitle ? `<div class="section-pretitle">${escapeHtml(s.subtitle)}</div>` : ''}
          <h2 class="section-title">${escapeHtml(s.title || 'Curated Silhouettes')}</h2>
          ${s.description ? `<p class="section-desc">${escapeHtml(s.description)}</p>` : ''}
        </div>
        <div class="categories-grid">
          ${State.categories.map(c => `
            <div class="category-card" onclick="window.location.hash='#shop?category=${c.slug}'">
              <img src="${c.image_url || 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=800&auto=format&fit=crop'}" alt="${escapeHtml(c.name)}" loading="lazy">
              <div class="category-card-overlay">
                <h3 class="category-card-title">${escapeHtml(c.name)}</h3>
                <p class="category-card-desc">${escapeHtml(c.description || '')}</p>
                <span class="category-card-link">Explore Cut &rarr;</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderProductCarouselSection(s, allProducts) {
  const meta = s.metadata || {};
  let filtered = [...allProducts];

  if (meta.filter === 'new_arrivals' || s.section_key === 'new_arrivals') {
    filtered = filtered.filter(p => p.is_new_arrival);
  } else if (meta.filter === 'best_sellers' || s.section_key === 'best_sellers') {
    filtered = filtered.filter(p => p.is_bestseller);
  }

  const limit = meta.limit || 8;
  const displayItems = filtered.slice(0, limit);

  return `
    <section class="section-padding">
      <div class="container">
        <div class="section-header">
          ${s.subtitle ? `<div class="section-pretitle">${escapeHtml(s.subtitle)}</div>` : ''}
          <h2 class="section-title">${escapeHtml(s.title || 'Products')}</h2>
          ${s.description ? `<p class="section-desc">${escapeHtml(s.description)}</p>` : ''}
        </div>
        
        ${displayItems.length === 0 ? `
          <div class="empty-state">
            <h4 class="empty-state-title">No products available right now.</h4>
            <p class="empty-state-desc">New artisanal cuts are being loomed. Check back shortly.</p>
          </div>
        ` : `
          <div class="products-grid">
            ${displayItems.map(p => renderProductCard(p)).join('')}
          </div>
          ${s.cta_text ? `
            <div style="text-align:center; margin-top:3rem;">
              <a href="${s.cta_url || '#shop'}" class="btn btn-dark">${escapeHtml(s.cta_text)}</a>
            </div>
          ` : ''}
        `}
      </div>
    </section>
  `;
}

function renderProductCard(p) {
  const currency = State.currency || '₹';
  const img = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=800&auto=format&fit=crop';
  const isOutOfStock = p.total_stock <= 0;

  return `
    <div class="product-card">
      <div class="product-media-wrap" onclick="window.location.hash='#product/${p.slug}'" style="cursor:pointer;">
        <img src="${img}" alt="${escapeHtml(p.name)}" loading="lazy">
        <div class="product-badges">
          ${isOutOfStock ? '<span class="badge badge-outofstock">OUT OF STOCK</span>' : ''}
          ${p.is_new_arrival && !isOutOfStock ? '<span class="badge badge-new">NEW DROP</span>' : ''}
          ${p.is_bestseller && !isOutOfStock ? '<span class="badge badge-bestseller">BESTSELLER</span>' : ''}
          ${p.is_sale && !isOutOfStock ? '<span class="badge badge-sale">SALE</span>' : ''}
        </div>
      </div>
      <div class="product-content">
        <div class="product-category-meta">${escapeHtml(p.category_name || p.fit || 'Artisanal Denim')}</div>
        <h3 class="product-name">
          <a href="#product/${p.slug}">${escapeHtml(p.name)}</a>
        </h3>
        <div class="product-specs-tag">${escapeHtml(p.wash || '')} ${p.fabric ? `• ${escapeHtml(p.fabric.substring(0, 30))}...` : ''}</div>
        
        <div class="product-price-row">
          <span class="price-current">${currency}${Number(p.price).toLocaleString('en-IN')}</span>
          ${p.compare_at_price ? `<span class="price-compare">${currency}${Number(p.compare_at_price).toLocaleString('en-IN')}</span>` : ''}
        </div>

        <div class="product-quick-actions">
          <button class="btn-quick-add" onclick="window.location.hash='#product/${p.slug}'">
            ${isOutOfStock ? 'VIEW DETAILS' : 'SELECT SIZE & BUY'}
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderPromoBannerSection(s) {
  const meta = s.metadata || {};
  return `
    <section class="promo-banner-section">
      <div class="promo-banner-bg" style="background-image: url('${s.image_url || 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=1600&auto=format&fit=crop'}')"></div>
      <div class="container">
        <div class="promo-banner-content">
          ${meta.banner_badge ? `<div class="hero-badge" style="margin-bottom:1rem;">◈ ${escapeHtml(meta.banner_badge)}</div>` : ''}
          ${s.subtitle ? `<div class="section-pretitle" style="color:var(--color-copper-light);">${escapeHtml(s.subtitle)}</div>` : ''}
          <h2 class="section-title" style="color:#fff; font-size:2.8rem; margin-bottom:1rem;">${escapeHtml(s.title || 'Selvedge Archive')}</h2>
          <p class="section-desc" style="color:#e2e8f0; font-size:1.05rem; margin-bottom:2rem;">${escapeHtml(s.description || '')}</p>
          ${s.cta_text ? `<a href="${s.cta_url || '#shop'}" class="btn btn-primary">${escapeHtml(s.cta_text)}</a>` : ''}
        </div>
      </div>
    </section>
  `;
}

function renderBrandStorySection(s) {
  const meta = s.metadata || {};
  const stats = meta.stats || [
    { label: 'Weight', value: '14.5 oz' },
    { label: 'Origin', value: 'Okayama, Japan' },
    { label: 'Warranty', value: 'Lifetime Seams' }
  ];

  return `
    <section class="section-padding">
      <div class="container">
        <div class="brand-story-grid">
          <div class="brand-story-media">
            <img src="${s.image_url || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop'}" alt="Atelier Story" style="width:100%; height:480px; object-fit:cover;">
          </div>
          <div>
            ${s.subtitle ? `<div class="section-pretitle">${escapeHtml(s.subtitle)}</div>` : ''}
            <h2 class="section-title">${escapeHtml(s.title || 'The Harry & Co Philosophy')}</h2>
            <p class="section-desc" style="font-size:1rem; margin-bottom:1.5rem;">${escapeHtml(s.description || '')}</p>
            ${s.cta_text ? `<a href="${s.cta_url || '#about'}" class="btn btn-dark">${escapeHtml(s.cta_text)}</a>` : ''}

            <div class="brand-story-stats">
              ${stats.map(st => `
                <div>
                  <div class="stat-val">${escapeHtml(st.value)}</div>
                  <div class="stat-lbl">${escapeHtml(st.label)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderReviewsSection(s, reviews) {
  return `
    <section class="section-padding" style="background:var(--color-bg-subtle);">
      <div class="container">
        <div class="section-header">
          ${s.subtitle ? `<div class="section-pretitle">${escapeHtml(s.subtitle)}</div>` : ''}
          <h2 class="section-title">${escapeHtml(s.title || 'Patron Testimonials')}</h2>
          ${s.description ? `<p class="section-desc">${escapeHtml(s.description)}</p>` : ''}
        </div>

        ${reviews.length === 0 ? `
          <div class="empty-state">
            <h4 class="empty-state-title">No reviews yet.</h4>
            <p class="empty-state-desc">Be the first to review a Harry & Co denim piece.</p>
          </div>
        ` : `
          <div class="reviews-grid">
            ${reviews.slice(0, 6).map(r => `
              <div class="review-card">
                <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                <h4 class="review-title">${escapeHtml(r.title || 'Exceptional Quality')}</h4>
                <p class="review-comment">"${escapeHtml(r.comment)}"</p>
                <div class="review-author">
                  <span class="author-name">${escapeHtml(r.customer_name)}</span>
                  ${r.verified_purchase ? `<span class="author-verified">✓ Verified Patron</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </section>
  `;
}

function renderNewsletterSection(s) {
  const meta = s.metadata || {};
  return `
    <section class="newsletter-section">
      <div class="container">
        <div class="section-header" style="margin-bottom:1.5rem;">
          ${s.subtitle ? `<div class="section-pretitle" style="color:var(--color-copper-light);">${escapeHtml(s.subtitle)}</div>` : ''}
          <h2 class="section-title" style="color:#fff;">${escapeHtml(s.title || 'Join The Atelier Archive')}</h2>
          <p class="section-desc" style="color:#94a3b8; max-width:540px; margin:0 auto;">${escapeHtml(s.description || '')}</p>
        </div>

        <form class="newsletter-form" onsubmit="event.preventDefault(); showToast('Welcome to the Harry & Co Archive.', 'info'); this.reset();">
          <input type="email" required class="newsletter-input" placeholder="${escapeHtml(meta.placeholder || 'Enter your email address...')}">
          <button type="submit" class="btn btn-primary">${escapeHtml(s.cta_text || 'Subscribe')}</button>
        </form>
      </div>
    </section>
  `;
}

function renderGenericSection(s) {
  return `
    <section class="section-padding">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">${escapeHtml(s.title || '')}</h2>
          <p class="section-desc">${escapeHtml(s.description || '')}</p>
        </div>
      </div>
    </section>
  `;
}

// 2. SHOP CATALOG VIEW (Filterable, Searchable, Dynamic)
async function renderShopView(hash) {
  const mainContent = document.getElementById('main-dynamic-view');
  mainContent.innerHTML = '<div style="text-align:center; padding:5rem;"><div class="spinner"></div><p style="margin-top:1rem; color:var(--color-text-muted);">Loading Denim Catalog...</p></div>';

  const params = new URLSearchParams(hash.split('?')[1] || '');
  const filter = params.get('filter') || '';
  const category = params.get('category') || '';
  const fit = params.get('fit') || '';
  const search = params.get('search') || '';

  const apiParams = {};
  if (filter === 'new') apiParams.new_arrivals = 1;
  if (filter === 'bestseller') apiParams.bestsellers = 1;
  if (filter === 'sale') apiParams.sale = 1;
  if (category) apiParams.category = category;
  if (fit) apiParams.fit = fit;
  if (search) apiParams.search = search;

  try {
    const res = await API.getProducts(apiParams);
    const products = res.products || [];

    mainContent.innerHTML = `
      <div class="container section-padding">
        <div class="section-header" style="margin-bottom:2.5rem;">
          <div class="section-pretitle">The Atelier Archive</div>
          <h1 class="section-title">Handcrafted Denim Catalog</h1>
          <p class="section-desc">Every piece is precision cut, rope dyed, and assembled using heritage workwear techniques.</p>
        </div>

        <!-- Filters Bar -->
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:2rem; padding:1.2rem; background:#fff; border:1px solid var(--color-border); border-radius:var(--radius-md);">
          <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
            <button class="btn btn-quick-add ${!filter && !category && !fit ? 'btn-primary' : ''}" onclick="window.location.hash='#shop'">All Cuts</button>
            <button class="btn btn-quick-add ${filter === 'new' ? 'btn-primary' : ''}" onclick="window.location.hash='#shop?filter=new'">New Arrivals</button>
            <button class="btn btn-quick-add ${filter === 'bestseller' ? 'btn-primary' : ''}" onclick="window.location.hash='#shop?filter=bestseller'">Best Sellers</button>
            <button class="btn btn-quick-add ${category === 'selvedge' ? 'btn-primary' : ''}" onclick="window.location.hash='#shop?category=selvedge'">Selvedge</button>
            <button class="btn btn-quick-add ${fit === 'slim' ? 'btn-primary' : ''}" onclick="window.location.hash='#shop?fit=slim'">Slim Cuts</button>
            <button class="btn btn-quick-add ${fit === 'relaxed' ? 'btn-primary' : ''}" onclick="window.location.hash='#shop?fit=relaxed'">Relaxed</button>
          </div>

          <div style="font-size:0.85rem; font-weight:700; color:var(--color-text-muted);">
            Showing ${products.length} Products
          </div>
        </div>

        <!-- Products Grid / Empty State -->
        ${products.length === 0 ? `
          <div class="empty-state">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <h3 class="empty-state-title">No products available right now.</h3>
            <p class="empty-state-desc">We could not find any denim matching this selection. Try clearing filters or check back shortly.</p>
            <button class="btn btn-primary" onclick="window.location.hash='#shop'">View All Cuts</button>
          </div>
        ` : `
          <div class="products-grid">
            ${products.map(p => renderProductCard(p)).join('')}
          </div>
        `}
      </div>
    `;
  } catch (err) {
    mainContent.innerHTML = `<div class="container section-padding"><div class="empty-state"><p>${escapeHtml(err.message)}</p></div></div>`;
  }
}

// 3. PRODUCT DETAIL VIEW (Dynamic, Size Selection, Real-Time Stock)
async function renderProductDetailView(slug) {
  const mainContent = document.getElementById('main-dynamic-view');
  mainContent.innerHTML = '<div style="text-align:center; padding:5rem;"><div class="spinner"></div><p style="margin-top:1rem; color:var(--color-text-muted);">Fetching Product Details...</p></div>';

  try {
    const res = await API.getProduct(slug);
    const p = res.product;
    State.selectedProduct = p;

    const currency = State.currency || '₹';
    const images = p.images && p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=900&auto=format&fit=crop'];
    const variants = p.variants || [];
    const isOutOfStock = p.total_stock <= 0;

    mainContent.innerHTML = `
      <div class="container section-padding">
        <div style="margin-bottom:1.5rem; font-size:0.8rem; color:var(--color-text-muted);">
          <a href="#home">Home</a> / <a href="#shop">Denim</a> / <span style="color:var(--color-raw-indigo); font-weight:700;">${escapeHtml(p.name)}</span>
        </div>

        <div style="display:grid; grid-template-columns:1fr; gap:3.5rem;" class="product-detail-layout">
          <style>
            @media (min-width: 1024px) {
              .product-detail-layout { grid-template-columns: 1.1fr 1fr !important; }
            }
          </style>

          <!-- Image Gallery -->
          <div>
            <div style="aspect-ratio:3/4; border-radius:var(--radius-md); overflow:hidden; background:#eee; margin-bottom:1rem; border:1px solid var(--color-border);">
              <img id="main-product-img" src="${images[0]}" alt="${escapeHtml(p.name)}" style="width:100%; height:100%; object-fit:cover;">
            </div>
            ${images.length > 1 ? `
              <div style="display:flex; gap:0.75rem; overflow-x:auto;">
                ${images.map((imgUrl, idx) => `
                  <img src="${imgUrl}" alt="Thumbnail" onclick="document.getElementById('main-product-img').src='${imgUrl}'" style="width:80px; height:95px; object-fit:cover; border-radius:var(--radius-sm); cursor:pointer; border:2px solid ${idx === 0 ? 'var(--color-copper)' : 'transparent'};">
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Product Details & Purchase Controls -->
          <div>
            <div class="product-category-meta">${escapeHtml(p.category_name || 'Bespoke Atelier Cut')}</div>
            <h1 style="font-family:var(--font-heading); font-size:2.2rem; font-weight:800; color:var(--color-raw-indigo); line-height:1.2; margin-bottom:0.75rem;">
              ${escapeHtml(p.name)}
            </h1>

            <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem;">
              <span style="font-size:1.6rem; font-weight:800; color:var(--color-raw-indigo);">${currency}${Number(p.price).toLocaleString('en-IN')}</span>
              ${p.compare_at_price ? `<span style="font-size:1.1rem; color:var(--color-text-light); text-decoration:line-through;">${currency}${Number(p.compare_at_price).toLocaleString('en-IN')}</span>` : ''}
              ${p.compare_at_price ? `<span class="badge badge-sale">SAVE ${currency}${Number(p.compare_at_price - p.price).toLocaleString('en-IN')}</span>` : ''}
            </div>

            <p style="font-size:0.95rem; line-height:1.7; color:var(--color-text-muted); margin-bottom:1.5rem;">
              ${escapeHtml(p.description || p.short_description || '')}
            </p>

            <!-- Specifications Table -->
            <div style="background:var(--color-bg-subtle); padding:1.2rem; border-radius:var(--radius-md); border:1px solid var(--color-border); margin-bottom:2rem; font-size:0.85rem;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
                <div><strong>Fit Profile:</strong> ${escapeHtml(p.fit || 'Regular Straight')}</div>
                <div><strong>Wash:</strong> ${escapeHtml(p.wash || 'Raw Indigo')}</div>
                <div><strong>Fabric:</strong> ${escapeHtml(p.fabric || '100% Selvedge Cotton')}</div>
                <div><strong>SKU:</strong> ${escapeHtml(p.sku)}</div>
              </div>
            </div>

            <!-- Size Selector with Real Inventory Check -->
            <div style="margin-bottom:2rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                <label class="form-label">Select Waist / Size</label>
                <span id="stock-feedback" style="font-size:0.75rem; font-weight:700; color:var(--color-copper);"></span>
              </div>

              ${variants.length === 0 ? `
                <p style="color:var(--color-danger); font-size:0.85rem;">No size variants registered for this product.</p>
              ` : `
                <div style="display:flex; flex-wrap:wrap; gap:0.6rem;" id="size-options-container">
                  ${variants.map(v => {
      const out = v.stock <= 0;
      return `
                      <button type="button" 
                              class="size-chip ${out ? 'disabled' : ''}" 
                              data-size="${escapeHtml(v.size)}" 
                              data-stock="${v.stock}"
                              ${out ? 'disabled' : ''}
                              onclick="selectProductSize('${escapeHtml(v.size)}', ${v.stock})"
                              style="padding:0.7rem 1.25rem; border:1.5px solid var(--color-border); border-radius:var(--radius-sm); font-weight:700; font-size:0.85rem; background:#fff; cursor:${out ? 'not-allowed' : 'pointer'}; opacity:${out ? '0.4' : '1'}; transition:var(--transition);">
                        ${escapeHtml(v.size)} ${out ? '(Out of Stock)' : ''}
                      </button>
                    `;
    }).join('')}
                </div>
              `}
            </div>

            <!-- Add to Cart / Checkout Action -->
            <div style="display:flex; gap:1rem; margin-bottom:2rem;">
              <button id="add-to-cart-btn" class="btn btn-primary btn-block" style="flex:2;" onclick="handleAddToCart()" ${isOutOfStock ? 'disabled' : ''}>
                ${isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
              </button>
              <button class="btn btn-dark" style="flex:1;" onclick="handleBuyNow()" ${isOutOfStock ? 'disabled' : ''}>
                BUY NOW
              </button>
            </div>

            <!-- Perks -->
            <div style="border-top:1px solid var(--color-border); padding-top:1.5rem; display:flex; flex-direction:column; gap:0.6rem; font-size:0.8rem; color:var(--color-text-muted);">
              <div>✓ Complimentary Nationwide Express Shipping on orders over ₹2,499</div>
              <div>✓ Cash on Delivery (COD) available subject to pin code verification</div>
              <div>✓ 14-Day Unworn Returns and Tailor Alterations Guarantee</div>
            </div>
          </div>
        </div>

        <!-- Verified Reviews Section -->
        <div style="margin-top:5rem; padding-top:3rem; border-top:1px solid var(--color-border);">
          <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; margin-bottom:2rem; gap:1rem;">
            <div>
              <h3 style="font-family:var(--font-heading); font-size:1.6rem; font-weight:700;">Client Reviews (${p.reviewCount})</h3>
              <div style="color:var(--color-copper); font-size:1.1rem; margin-top:0.25rem;">
                ${'★'.repeat(Math.round(p.averageRating || 5))}${'☆'.repeat(5 - Math.round(p.averageRating || 5))} 
                <span style="font-size:0.9rem; color:var(--color-text-main); font-weight:700; margin-left:0.5rem;">${p.averageRating} / 5.0</span>
              </div>
            </div>
            <button class="btn btn-outline-white" style="border-color:var(--color-raw-indigo); color:var(--color-raw-indigo);" onclick="openReviewModal(${p.id})">
              Write a Review
            </button>
          </div>

          ${p.reviews && p.reviews.length > 0 ? `
            <div class="reviews-grid">
              ${p.reviews.map(r => `
                <div class="review-card">
                  <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                  <h4 class="review-title">${escapeHtml(r.title || 'Exceptional Quality')}</h4>
                  <p class="review-comment">${escapeHtml(r.comment)}</p>
                  <div class="review-author">
                    <span class="author-name">${escapeHtml(r.customer_name)}</span>
                    ${r.verified_purchase ? `<span class="author-verified">✓ Verified Purchase</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state" style="margin:1rem 0;">
              <h4 class="empty-state-title">No reviews yet.</h4>
              <p class="empty-state-desc">Be the first to review this product.</p>
              <button class="btn btn-primary" onclick="openReviewModal(${p.id})">Be the First to Review</button>
            </div>
          `}
        </div>
      </div>
    `;

    // Auto-select first in-stock variant
    const firstInStock = variants.find(v => v.stock > 0);
    if (firstInStock) {
      selectProductSize(firstInStock.size, firstInStock.stock);
    }
  } catch (err) {
    mainContent.innerHTML = `<div class="container section-padding"><div class="empty-state"><p>${escapeHtml(err.message)}</p></div></div>`;
  }
}

let selectedProductSize = null;

window.selectProductSize = function (size, stock) {
  selectedProductSize = size;
  const container = document.getElementById('size-options-container');
  if (container) {
    container.querySelectorAll('.size-chip').forEach(btn => {
      if (btn.dataset.size === size) {
        btn.style.borderColor = 'var(--color-copper)';
        btn.style.background = 'var(--color-raw-indigo)';
        btn.style.color = '#fff';
      } else {
        btn.style.borderColor = 'var(--color-border)';
        btn.style.background = '#fff';
        btn.style.color = 'var(--color-text-main)';
      }
    });
  }

  const feedback = document.getElementById('stock-feedback');
  if (feedback) {
    if (stock <= 5) {
      feedback.textContent = `Only ${stock} items left in Size ${size}!`;
      feedback.style.color = 'var(--color-selvedge-red)';
    } else {
      feedback.textContent = `Size ${size} in stock (${stock} available)`;
      feedback.style.color = '#15803d';
    }
  }
};

window.handleAddToCart = function () {
  if (!State.selectedProduct) return;
  if (!selectedProductSize) {
    showToast('Please select a size first.', 'error');
    return;
  }

  addToCart(State.selectedProduct, selectedProductSize, 1);
  openCartDrawer();
};

window.handleBuyNow = function () {
  handleAddToCart();
  window.location.hash = '#checkout';
};

// 4. CART & CHECKOUT ENGINE
export function addToCart(product, size, qty = 1) {
  if (!product) return;
  const pId = String(product.id);
  const existingIdx = State.cart.findIndex(i => String(i.productId) === pId && String(i.size) === String(size));
  if (existingIdx > -1) {
    State.cart[existingIdx].quantity += qty;
  } else {
    State.cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: size,
      image: (product.images && product.images[0]) || '',
      quantity: qty
    });
  }

  localStorage.setItem('hc_cart', JSON.stringify(State.cart));
  updateCartBadge();
  renderCartDrawer();
  showToast(`Added "${product.name}" (Size ${size}) to bag.`, 'info');
}

export function removeFromCart(productId, size) {
  State.cart = State.cart.filter(i => !(String(i.productId) === String(productId) && String(i.size) === String(size)));
  localStorage.setItem('hc_cart', JSON.stringify(State.cart));
  updateCartBadge();
  renderCartDrawer();
  if (window.location.hash === '#checkout') {
    renderCheckoutView();
  }
}

export function updateCartQuantity(productId, size, newQty) {
  const qty = parseInt(newQty, 10);
  if (isNaN(qty) || qty <= 0) {
    removeFromCart(productId, size);
    return;
  }
  const item = State.cart.find(i => String(i.productId) === String(productId) && String(i.size) === String(size));
  if (item) {
    item.quantity = qty;
    localStorage.setItem('hc_cart', JSON.stringify(State.cart));
    updateCartBadge();
    renderCartDrawer();
    if (window.location.hash === '#checkout') {
      renderCheckoutView();
    }
  }
}

// Ensure functions are immediately accessible for inline onclick handlers
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.openCartDrawer = openCartDrawer;
window.closeCartDrawer = closeCartDrawer;

function updateCartBadge() {
  const totalCount = State.cart.reduce((acc, i) => acc + (parseInt(i.quantity, 10) || 1), 0);
  document.querySelectorAll('.cart-badge-count').forEach(el => {
    el.textContent = totalCount;
  });
}

function renderCartDrawer() {
  const itemsContainer = document.getElementById('cart-drawer-items-list');
  const subtotalEl = document.getElementById('cart-drawer-subtotal');
  const currency = State.currency || '₹';

  if (!itemsContainer || !subtotalEl) return;

  if (State.cart.length === 0) {
    itemsContainer.innerHTML = `
      <div style="text-align:center; padding:3.5rem 1rem;">
        <div style="font-size:2.5rem; margin-bottom:1rem; opacity:0.3;">🛍️</div>
        <p style="color:var(--color-text-muted); font-size:0.95rem; margin-bottom:1.5rem;">Your shopping bag is currently empty.</p>
        <button class="btn btn-dark" onclick="closeCartDrawer(); window.location.hash='#shop';">Explore Atelier Denim &rarr;</button>
      </div>
    `;
    subtotalEl.textContent = `${currency}0`;
    return;
  }

  const subtotal = State.cart.reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);

  itemsContainer.innerHTML = State.cart.map(item => `
    <div class="cart-item" style="display:flex; gap:1rem; padding:1.1rem 0; border-bottom:1px solid rgba(0,0,0,0.06); align-items:center;">
      <img src="${item.image || 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=300&auto=format&fit=crop'}" 
           alt="${escapeHtml(item.name)}" 
           class="cart-item-img" 
           onerror="this.src='https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=300&auto=format&fit=crop'"
           style="width:68px; height:80px; object-fit:cover; border-radius:6px; background:#f1f5f9; flex-shrink:0;">
      <div class="cart-item-details" style="flex:1; min-width:0;">
        <h4 class="cart-item-title" style="font-size:0.92rem; font-weight:700; margin-bottom:0.2rem; color:var(--color-raw-indigo);">${escapeHtml(item.name)}</h4>
        <div class="cart-item-meta" style="font-size:0.8rem; color:var(--color-text-muted); margin-bottom:0.5rem;">Size: <strong>${escapeHtml(item.size)}</strong></div>
        
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <!-- Stepper Counter -->
          <div style="display:inline-flex; align-items:center; border:1px solid #d1d5db; border-radius:6px; overflow:hidden; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,0.04);">
            <button type="button" 
                    title="Decrease quantity"
                    style="width:28px; height:28px; display:flex; align-items:center; justify-content:center; background:#f9fafb; border:none; cursor:pointer; font-weight:700; color:#374151; font-size:15px; user-select:none;" 
                    onclick="updateCartQuantity('${item.productId}', '${item.size}', ${item.quantity - 1})">-</button>
            <span style="min-width:32px; text-align:center; font-weight:700; font-size:0.88rem; color:#111827; padding:0 4px;">${item.quantity}</span>
            <button type="button" 
                    title="Increase quantity"
                    style="width:28px; height:28px; display:flex; align-items:center; justify-content:center; background:#f9fafb; border:none; cursor:pointer; font-weight:700; color:#374151; font-size:15px; user-select:none;" 
                    onclick="updateCartQuantity('${item.productId}', '${item.size}', ${item.quantity + 1})">+</button>
          </div>

          <button type="button" 
                  title="Remove item"
                  style="background:none; border:none; color:#ef4444; font-size:0.78rem; font-weight:600; cursor:pointer; padding:0.25rem; text-decoration:underline;" 
                  onclick="removeFromCart('${item.productId}', '${item.size}')">Remove</button>
        </div>
      </div>
      <div style="text-align:right; flex-shrink:0;">
        <div style="font-weight:800; font-size:1rem; color:var(--color-raw-indigo);">${currency}${Number(item.price * item.quantity).toLocaleString('en-IN')}</div>
        ${item.quantity > 1 ? `<div style="font-size:0.72rem; color:var(--color-text-muted);">${currency}${Number(item.price).toLocaleString('en-IN')} each</div>` : ''}
      </div>
    </div>
  `).join('');

  subtotalEl.textContent = `${currency}${Number(subtotal).toLocaleString('en-IN')}`;
}

// 5. CHECKOUT VIEW WITH SAVED USER PROFILE ADDRESS & RAZORPAY INTEGRATION
async function renderCheckoutView() {
  const mainContent = document.getElementById('main-dynamic-view');
  const currency = State.currency || '₹';

  if (State.cart.length === 0) {
    mainContent.innerHTML = `
      <div class="container section-padding">
        <div class="empty-state" style="text-align:center; padding:5rem 1rem;">
          <h3 class="empty-state-title" style="font-size:1.6rem; margin-bottom:0.5rem;">Your shopping bag is empty</h3>
          <p class="empty-state-desc" style="color:var(--color-text-muted); margin-bottom:1.5rem;">Select handcrafted denim pieces from our catalog to proceed to checkout.</p>
          <a href="#shop" class="btn btn-primary">Browse Denim Archive &rarr;</a>
        </div>
      </div>
    `;
    return;
  }

  mainContent.innerHTML = '<div style="text-align:center; padding:5rem;"><div class="spinner"></div><p style="margin-top:1rem; color:var(--color-text-muted);">Loading secure checkout concierge...</p></div>';

  try {
    // 1. Fetch active payment methods strictly from database
    const paymentRes = await API.getPaymentMethods();
    State.paymentMethods = paymentRes.paymentMethods || [];

    // 2. Fetch logged in customer profile (if authenticated)
    let savedCustomer = null;
    const custToken = localStorage.getItem('hc_customer_token');
    if (custToken) {
      try {
        const profRes = await fetch('/api/v1/auth/customer/profile', {
          headers: { 'Authorization': `Bearer ${custToken}` }
        });
        const profData = await profRes.json();
        if (profData.success && profData.customer) {
          savedCustomer = profData.customer;
        }
      } catch (e) { }
    }
    if (!savedCustomer) {
      try {
        savedCustomer = JSON.parse(localStorage.getItem('hc_customer_user') || 'null');
      } catch (e) { }
    }

    const subtotal = State.cart.reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);
    const freeShippingThreshold = parseFloat(State.settings.free_shipping_threshold || '2499');
    const standardShippingFee = parseFloat(State.settings.standard_shipping_fee || '149');
    const shippingFee = subtotal >= freeShippingThreshold ? 0 : standardShippingFee;
    const discount = State.appliedCoupon ? State.appliedCoupon.calculatedDiscount : 0;
    const total = Math.max(0, subtotal - discount + shippingFee);

    mainContent.innerHTML = `
      <div class="container section-padding">
        <div class="section-header" style="margin-bottom:2.5rem;">
          <div class="section-pretitle">Direct Atelier Concierge</div>
          <h1 class="section-title">Secure Checkout</h1>
        </div>

        <div class="checkout-grid">
          <!-- Checkout Form -->
          <div>
            ${savedCustomer ? `
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; padding:0.85rem 1.15rem; border-radius:8px; font-size:0.88rem; margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
                <div style="display:flex; align-items:center; gap:0.6rem;">
                  <span style="font-size:1.1rem;">✓</span>
                  <span>Signed in as <strong>${escapeHtml(savedCustomer.name || savedCustomer.email)}</strong>. Saved address details applied.</span>
                </div>
                <a href="/login" style="color:#15803d; font-weight:700; text-decoration:underline;">View/Edit Profile &rarr;</a>
              </div>
            ` : `
              <div style="background:#fefce8; border:1px solid #fef08a; color:#854d0e; padding:0.85rem 1.15rem; border-radius:8px; font-size:0.88rem; margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
                <span>Have a Harry & Co account? <a href="/login" style="color:#a16207; font-weight:700; text-decoration:underline;">Sign In</a> to auto-fill your saved address &amp; track orders.</span>
              </div>
            `}

            <form id="checkout-order-form" onsubmit="event.preventDefault(); submitCheckoutOrder();">
              <!-- Customer Contact -->
              <div class="checkout-box">
                <h3 class="checkout-box-title">1. Contact Information</h3>
                <div class="form-grid form-grid-2">
                  <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input type="text" id="cust-name" required class="form-input" placeholder="e.g. Aditya Kashyap" value="${escapeHtml(savedCustomer?.name || '')}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Mobile Number *</label>
                    <input type="tel" id="cust-phone" required class="form-input" placeholder="e.g. 9820012345" value="${escapeHtml(savedCustomer?.phone || '')}">
                  </div>
                </div>
                <div class="form-group" style="margin-top:1rem;">
                  <label class="form-label">Email Address *</label>
                  <input type="email" id="cust-email" required class="form-input" placeholder="e.g. aditya@example.com" value="${escapeHtml(savedCustomer?.email || '')}">
                </div>
              </div>

              <!-- Shipping Address -->
              <div class="checkout-box">
                <h3 class="checkout-box-title">2. Shipping Address</h3>
                <div class="form-group" style="margin-bottom:1rem;">
                  <label class="form-label">Street Address &amp; Landmark *</label>
                  <input type="text" id="cust-address" required class="form-input" placeholder="House/Flat No., Building, Street Name" value="${escapeHtml(savedCustomer?.address || '')}">
                </div>
                <div class="form-grid form-grid-2">
                  <div class="form-group">
                    <label class="form-label">City *</label>
                    <input type="text" id="cust-city" required class="form-input" placeholder="e.g. Mumbai" value="${escapeHtml(savedCustomer?.city || '')}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">State *</label>
                    <input type="text" id="cust-state" required class="form-input" placeholder="e.g. Maharashtra" value="${escapeHtml(savedCustomer?.state || '')}">
                  </div>
                </div>
                <div class="form-grid form-grid-2" style="margin-top:1rem;">
                  <div class="form-group">
                    <label class="form-label">PIN Code *</label>
                    <input type="text" id="cust-pincode" required class="form-input" placeholder="e.g. 400001" value="${escapeHtml(savedCustomer?.pincode || '')}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Delivery Instructions</label>
                    <input type="text" id="cust-notes" class="form-input" placeholder="e.g. Leave with security">
                  </div>
                </div>

                ${custToken ? `
                  <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.83rem; color:var(--color-text-muted); margin-top:1rem; cursor:pointer;">
                    <input type="checkbox" id="save-address-to-profile" checked style="accent-color:var(--color-copper);">
                    <span>Save / update this shipping address in my profile</span>
                  </label>
                ` : ''}
              </div>

              <!-- Dynamic Payment Method Selection (SERVER CONTROLLED) -->
              <div class="checkout-box">
                <h3 class="checkout-box-title">3. Payment Selection</h3>
                
                ${State.paymentMethods.length === 0 ? `
                  <div class="empty-state" style="margin:1rem 0;">
                    <p style="color:var(--color-danger); font-weight:700;">No payment methods are currently active in store settings.</p>
                  </div>
                ` : `
                  <div id="payment-methods-list">
                    ${State.paymentMethods.map((pm, idx) => {
      const isCod = pm.code.toUpperCase() === 'COD';
      const isRazorpay = pm.code.toUpperCase() === 'RAZORPAY' || pm.code.toUpperCase() === 'ONLINE';
      let feeNote = '';
      if (isCod) {
        if (pm.fee > 0) {
          if (pm.free_threshold > 0) {
            feeNote = `(Free above ${currency}${pm.free_threshold}, otherwise ${currency}${pm.fee} COD fee)`;
          } else {
            feeNote = `(${currency}${pm.fee} handling fee)`;
          }
        }
      }

      return `
                        <div class="payment-option-card ${idx === 0 ? 'selected' : ''}" onclick="selectPaymentOption('${pm.code}', this)" style="cursor:pointer;">
                          <input type="radio" name="paymentMethod" value="${pm.code}" ${idx === 0 ? 'checked' : ''} class="payment-radio">
                          <div class="payment-info" style="flex:1;">
                            <div class="payment-title-row" style="display:flex; align-items:center; justify-content:space-between;">
                              <span class="payment-method-name" style="font-weight:700;">
                                ${escapeHtml(pm.name)} ${feeNote}
                              </span>
                              ${isRazorpay ? `
                                <span class="payment-badge" style="background:#0c2340; color:#58a6ff; font-size:0.7rem; padding:0.2rem 0.5rem; border-radius:4px; font-weight:700;">
                                  ⚡ RAZORPAY SECURE
                                </span>
                              ` : `
                                <span class="payment-badge">${escapeHtml(pm.code)}</span>
                              `}
                            </div>
                            <p class="payment-desc" style="font-size:0.8rem; color:var(--color-text-muted); margin-top:0.25rem;">${escapeHtml(pm.description || '')}</p>
                          </div>
                        </div>
                      `;
    }).join('')}
                  </div>
                `}
              </div>

              <button type="submit" id="place-order-submit-btn" class="btn btn-primary btn-block" style="padding:1.15rem; font-size:1.02rem; font-weight:700; box-shadow:var(--shadow-gold);">
                CONFIRM &amp; PLACE ORDER &rarr;
              </button>
            </form>
          </div>

          <!-- Order Summary Sidebar -->
          <div>
            <div class="checkout-box" style="position:sticky; top:6rem;">
              <h3 class="checkout-box-title">Order Summary</h3>

              <div style="display:flex; flex-direction:column; gap:1rem; margin-bottom:1.5rem; max-height:280px; overflow-y:auto;">
                ${State.cart.map(i => `
                  <div style="display:flex; gap:0.75rem; align-items:center;">
                    <img src="${i.image || 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=200&auto=format&fit=crop'}" style="width:50px; height:60px; object-fit:cover; border-radius:4px;">
                    <div style="flex:1;">
                      <div style="font-size:0.85rem; font-weight:700;">${escapeHtml(i.name)}</div>
                      <div style="font-size:0.75rem; color:var(--color-text-muted);">Size: ${i.size} × ${i.quantity}</div>
                    </div>
                    <div style="font-weight:800; font-size:0.9rem;">${currency}${Number(i.price * i.quantity).toLocaleString('en-IN')}</div>
                  </div>
                `).join('')}
              </div>

              <!-- Coupon Code Form -->
              <div style="margin-bottom:1.5rem; border-top:1px solid var(--color-border); padding-top:1.25rem;">
                <label class="form-label" style="margin-bottom:0.4rem; display:block;">Promotional Code</label>
                <div style="display:flex; gap:0.5rem;">
                  <input type="text" id="promo-coupon-input" class="form-input" placeholder="e.g. RAWHERITAGE10" style="text-transform:uppercase;" value="${State.appliedCoupon ? State.appliedCoupon.code : ''}">
                  <button type="button" class="btn btn-dark" style="padding:0.6rem 1rem;" onclick="applyPromoCoupon()">Apply</button>
                </div>
                ${State.appliedCoupon ? `
                  <div style="font-size:0.75rem; color:#15803d; font-weight:700; margin-top:0.4rem;">
                    ✓ Coupon ${State.appliedCoupon.code} applied (-${currency}${State.appliedCoupon.calculatedDiscount})
                  </div>
                ` : ''}
              </div>

              <!-- Receipt Calculations -->
              <div style="border-top:1px solid var(--color-border); padding-top:1.25rem; display:flex; flex-direction:column; gap:0.6rem; font-size:0.9rem;">
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:var(--color-text-muted);">Subtotal</span>
                  <span style="font-weight:700;">${currency}${Number(subtotal).toLocaleString('en-IN')}</span>
                </div>
                ${discount > 0 ? `
                  <div style="display:flex; justify-content:space-between; color:#15803d;">
                    <span>Promotional Discount</span>
                    <span style="font-weight:700;">-${currency}${Number(discount).toLocaleString('en-IN')}</span>
                  </div>
                ` : ''}
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:var(--color-text-muted);">Express Shipping</span>
                  <span style="font-weight:700;">${shippingFee === 0 ? '<span style="color:#15803d">FREE</span>' : `${currency}${shippingFee}`}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:1.2rem; font-weight:800; border-top:2px solid var(--color-raw-indigo); padding-top:0.85rem; margin-top:0.5rem; color:var(--color-raw-indigo);">
                  <span>Total Amount</span>
                  <span id="checkout-final-total">${currency}${Number(total).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    mainContent.innerHTML = `<div class="container section-padding"><div class="empty-state"><p>${escapeHtml(err.message)}</p></div></div>`;
  }
}

window.selectPaymentOption = function (code, el) {
  document.querySelectorAll('.payment-option-card').forEach(card => card.classList.remove('selected'));
  el.classList.add('selected');
  const radio = el.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;
};

window.applyPromoCoupon = async function () {
  const input = document.getElementById('promo-coupon-input');
  if (!input || !input.value.trim()) {
    showToast('Please enter a coupon code.', 'error');
    return;
  }

  const subtotal = State.cart.reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);
  try {
    const res = await API.validateCoupon(input.value.trim(), subtotal);
    State.appliedCoupon = res.coupon;
    showToast(res.message, 'info');
    renderCheckoutView();
  } catch (err) {
    showToast(err.message || 'Invalid coupon code.', 'error');
  }
};

window.submitCheckoutOrder = async function () {
  const submitBtn = document.getElementById('place-order-submit-btn');
  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const email = document.getElementById('cust-email').value.trim();
  const address = document.getElementById('cust-address').value.trim();
  const city = document.getElementById('cust-city').value.trim();
  const state = document.getElementById('cust-state').value.trim();
  const pincode = document.getElementById('cust-pincode').value.trim();
  const notes = document.getElementById('cust-notes')?.value || '';

  const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
  if (!paymentRadio) {
    showToast('Please select a payment method.', 'error');
    return;
  }
  const paymentMethod = paymentRadio.value;
  const isRazorpay = paymentMethod.toUpperCase() === 'RAZORPAY' || paymentMethod.toUpperCase() === 'ONLINE';

  const orderPayload = {
    customerName: name,
    customerEmail: email,
    customerPhone: phone,
    shippingAddress: {
      street: address,
      city,
      state,
      pincode,
      country: 'India'
    },
    items: State.cart.map(i => ({
      productId: i.productId,
      size: i.size,
      quantity: i.quantity
    })),
    paymentMethod,
    couponCode: State.appliedCoupon ? State.appliedCoupon.code : null,
    customerNotes: notes
  };

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" style="display:inline-block; width:16px; height:16px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; vertical-align:middle; margin-right:6px;"></span> Generating Order...';

    // 1. Create order in backend
    const res = await API.placeOrder(orderPayload);
    const order = res.order;

    // 2. Auto-save/update address in profile if requested
    const saveToProfileChecked = document.getElementById('save-address-to-profile')?.checked;
    const custToken = localStorage.getItem('hc_customer_token');
    if (saveToProfileChecked && custToken) {
      try {
        await fetch('/api/v1/auth/customer/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${custToken}`
          },
          body: JSON.stringify({
            name,
            phone,
            address,
            city,
            state,
            pincode,
            country: 'India'
          })
        });
      } catch (e) {
        console.warn('Address auto-save to profile skipped:', e);
      }
    }

    // 3. If Razorpay / Online payment selected, open Razorpay Checkout modal
    if (isRazorpay && typeof window.Razorpay !== 'undefined') {
      submitBtn.innerHTML = 'Connecting to Razorpay...';

      try {
        const rzpRes = await fetch('/api/v1/payment-methods/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: order.totalAmount,
            orderNumber: order.orderNumber,
            currency: 'INR'
          })
        });
        const rzpData = await rzpRes.json();
        const keyId = rzpData.keyId || 'rzp_test_AtelierHarryCo';

        const rzpOptions = {
          key: keyId,
          amount: Math.round(Number(order.totalAmount) * 100),
          currency: 'INR',
          name: 'HARRY & CO JEANS',
          description: `Order #${order.orderNumber} Atelier Denim Heritage`,
          image: '/assets/logo.jpg',
          order_id: rzpData.razorpayOrderId.startsWith('rzp_order_') ? undefined : rzpData.razorpayOrderId,
          prefill: {
            name: name,
            email: email,
            contact: phone
          },
          theme: {
            color: '#DAA520'
          },
          handler: async function (paymentResponse) {
            try {
              await fetch('/api/v1/payment-methods/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderNumber: order.orderNumber,
                  razorpayPaymentId: paymentResponse.razorpay_payment_id || `pay_${Date.now()}`,
                  razorpayOrderId: paymentResponse.razorpay_order_id,
                  razorpaySignature: paymentResponse.razorpay_signature
                })
              });
              order.paymentStatus = 'PAID';
              order.paymentMethod = 'RAZORPAY';
              showToast('✓ Razorpay Payment Verified & Received!', 'info');
            } catch (err) {
              console.warn('Verification notification failed:', err);
            }

            // Clear cart upon successful payment
            State.cart = [];
            localStorage.removeItem('hc_cart');
            updateCartBadge();
            State.appliedCoupon = null;
            renderOrderSuccessView(order);
          },
          modal: {
            ondismiss: function () {
              showToast('Payment window closed. Order reference saved.', 'info');
              State.cart = [];
              localStorage.removeItem('hc_cart');
              updateCartBadge();
              State.appliedCoupon = null;
              renderOrderSuccessView(order);
            }
          }
        };

        const rzpInstance = new window.Razorpay(rzpOptions);
        rzpInstance.on('payment.failed', function (failed) {
          showToast(`Payment failed: ${failed.error?.description || 'Cancelled'}`, 'error');
          renderOrderSuccessView(order);
        });
        rzpInstance.open();
        return;
      } catch (rzpErr) {
        console.error('Razorpay popup error:', rzpErr);
      }
    }

    // 4. Default / COD completion
    State.cart = [];
    localStorage.removeItem('hc_cart');
    updateCartBadge();
    State.appliedCoupon = null;
    renderOrderSuccessView(order);
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'CONFIRM & PLACE ORDER →';
    showToast(err.message || 'Order placement failed.', 'error');
  }
};

function renderOrderSuccessView(order) {
  const mainContent = document.getElementById('main-dynamic-view');
  const currency = State.currency || '₹';

  mainContent.innerHTML = `
    <div class="container section-padding">
      <div style="max-width:640px; margin:0 auto; background:#fff; border:1px solid var(--color-border); border-radius:var(--radius-lg); padding:3rem 2rem; text-align:center; box-shadow:var(--shadow-lg);">
        <div style="width:4.5rem; height:4.5rem; border-radius:var(--radius-pill); background:#dcfce7; color:#15803d; display:flex; align-items:center; justify-content:center; font-size:2rem; margin:0 auto 1.5rem auto;">
          ✓
        </div>
        <div class="section-pretitle" style="color:var(--color-copper);">Order Confirmed</div>
        <h1 style="font-family:var(--font-heading); font-size:2rem; font-weight:800; color:var(--color-raw-indigo); margin-bottom:0.5rem;">
          Thank You, ${escapeHtml(order.customerName)}!
        </h1>
        <p style="color:var(--color-text-muted); font-size:0.95rem; margin-bottom:2rem;">
          Your artisanal denim order has been received and logged into our atelier production queue.
        </p>

        <!-- Order Details Card -->
        <div style="background:var(--color-bg-subtle); border-radius:var(--radius-md); padding:1.5rem; text-align:left; margin-bottom:2rem; font-size:0.85rem; border:1px solid var(--color-border);">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem;">
            <span style="color:var(--color-text-muted);">Order Reference Number:</span>
            <strong style="color:var(--color-raw-indigo); font-family:var(--font-heading); font-size:1rem;">${escapeHtml(order.orderNumber)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem;">
            <span style="color:var(--color-text-muted);">Payment Method:</span>
            <strong>${escapeHtml(order.paymentMethod)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem;">
            <span style="color:var(--color-text-muted);">Payment Status:</span>
            <span class="badge-status badge-status-${order.paymentStatus}">${order.paymentStatus}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem;">
            <span style="color:var(--color-text-muted);">Order Status:</span>
            <span class="badge-status badge-status-${order.orderStatus}">${order.orderStatus}</span>
          </div>
          <div style="display:flex; justify-content:space-between; border-top:1px solid var(--color-border); padding-top:0.75rem; font-weight:800; font-size:1rem; color:var(--color-raw-indigo);">
            <span>Total Amount:</span>
            <span>${currency}${Number(order.totalAmount).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div style="display:flex; gap:1rem; justify-content:center;">
          <a href="#track" class="btn btn-dark" onclick="setTimeout(() => searchOrderTracking('${order.orderNumber}'), 200);">Track Order Status</a>
          <a href="#shop" class="btn btn-primary">Continue Shopping</a>
        </div>
      </div>
    </div>
  `;
}

// 6. ORDER TRACKING VIEW
function renderTrackOrderView() {
  const mainContent = document.getElementById('main-dynamic-view');
  mainContent.innerHTML = `
    <div class="container section-padding">
      <div class="section-header" style="max-width:540px;">
        <div class="section-pretitle">Order Status & Dispatch</div>
        <h1 class="section-title">Track Your Denim</h1>
        <p class="section-desc">Enter your order number below to check real-time processing and courier dispatch.</p>
      </div>

      <div style="max-width:500px; margin:0 auto; background:#fff; padding:2rem; border-radius:var(--radius-md); border:1px solid var(--color-border); box-shadow:var(--shadow-sm);">
        <form onsubmit="event.preventDefault(); searchOrderTracking(document.getElementById('track-order-num-input').value);">
          <div class="form-group" style="margin-bottom:1.25rem;">
            <label class="form-label">Order Number *</label>
            <input type="text" id="track-order-num-input" required class="form-input" placeholder="e.g. HC-2026-432541" style="text-transform:uppercase;">
          </div>
          <button type="submit" class="btn btn-primary btn-block">Track Order &rarr;</button>
        </form>

        <div id="tracking-result-box" style="margin-top:2rem;"></div>
      </div>
    </div>
  `;
}

window.searchOrderTracking = async function (orderNumber) {
  const resultBox = document.getElementById('tracking-result-box');
  if (!resultBox || !orderNumber) return;

  resultBox.innerHTML = '<div style="text-align:center;"><div class="spinner"></div><p style="font-size:0.8rem; color:var(--color-text-muted); margin-top:0.5rem;">Checking database records...</p></div>';

  try {
    const res = await API.trackOrder(orderNumber.trim());
    const o = res.order;
    const currency = State.currency || '₹';

    resultBox.innerHTML = `
      <div style="background:var(--color-bg-subtle); padding:1.25rem; border-radius:var(--radius-md); border:1px solid var(--color-border); font-size:0.85rem;">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
          <strong style="color:var(--color-raw-indigo);">${escapeHtml(o.order_number)}</strong>
          <span class="badge-status badge-status-${o.order_status}">${o.order_status}</span>
        </div>
        <div style="color:var(--color-text-muted); font-size:0.8rem; margin-bottom:0.75rem;">
          Ordered by ${escapeHtml(o.customer_name)} on ${new Date(o.created_at).toLocaleDateString()}
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
          <span>Payment Method:</span>
          <strong>${escapeHtml(o.payment_method)} (${o.payment_status})</strong>
        </div>
        ${o.tracking_number ? `
          <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; color:#0369a1; font-weight:700;">
            <span>Tracking Number:</span>
            <span>${escapeHtml(o.tracking_number)}</span>
          </div>
        ` : '<div style="font-size:0.75rem; color:var(--color-text-muted);">Tracking code will be assigned upon dispatch.</div>'}
        <div style="display:flex; justify-content:space-between; border-top:1px solid var(--color-border); padding-top:0.5rem; margin-top:0.75rem; font-weight:800;">
          <span>Total:</span>
          <span>${currency}${Number(o.total_amount).toLocaleString('en-IN')}</span>
        </div>
      </div>
    `;
  } catch (err) {
    resultBox.innerHTML = `
      <div style="background:#fee2e2; color:#b91c1c; padding:1rem; border-radius:var(--radius-sm); font-size:0.85rem; text-align:center;">
        ${escapeHtml(err.message || 'Order not found in records.')}
      </div>
    `;
  }
};

// 7. ABOUT & POLICIES VIEWS
function renderAboutView() {
  const mainContent = document.getElementById('main-dynamic-view');
  mainContent.innerHTML = `
    <div class="container section-padding">
      <div class="section-header">
        <div class="section-pretitle">The Atelier Heritage</div>
        <h1 class="section-title">The Harry & Co Manifesto</h1>
        <p class="section-desc">Born from a refusal to compromise on raw selvedge density, craftsmanship, and longevity.</p>
      </div>

      <div style="max-width:800px; margin:0 auto; font-size:1.05rem; line-height:1.9; color:var(--color-text-main);">
        <p style="margin-bottom:1.5rem;">
          Harry & Co was established as an antidote to fast fashion denim. Where commercial brands blend petrochemical fibers to accelerate degradation, our master tailors source pure Zimbabwe long-staple cotton and weave it slowly on vintage shuttle looms in Okayama and Kurashiki.
        </p>
        <div style="margin:2.5rem 0; border-radius:var(--radius-md); overflow:hidden;">
          <img src="https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1200&auto=format&fit=crop" alt="Denim Heritage" style="width:100%; height:400px; object-fit:cover;">
        </div>
        <h3 style="font-family:var(--font-heading); font-size:1.5rem; font-weight:700; margin-bottom:1rem; color:var(--color-raw-indigo);">
          Rope Dyeing & The Living Indigo
        </h3>
        <p style="margin-bottom:1.5rem;">
          Our yarn is dipped up to sixteen times in deep natural indigo vats and exposed to air to oxidize. The core of each yarn remains pristine white. As you wear your Harry & Co jeans, friction chips away the indigo surface, revealing razor-sharp fades that record your life's journeys.
        </p>
      </div>
    </div>
  `;
}

function renderPoliciesView() {
  const mainContent = document.getElementById('main-dynamic-view');
  mainContent.innerHTML = `
    <div class="container section-padding">
      <div class="section-header">
        <div class="section-pretitle">Transparency & Terms</div>
        <h1 class="section-title">Atelier Policies</h1>
      </div>

      <div style="max-width:760px; margin:0 auto; display:flex; flex-direction:column; gap:2.5rem;">
        <div class="checkout-box">
          <h3 class="checkout-box-title">Return & Exchange Policy</h3>
          <p style="font-size:0.9rem; line-height:1.7; color:var(--color-text-muted);">
            ${escapeHtml(State.settings.return_policy || 'Complimentary 14-day unworn returns and exchanges on all artisanal denim pieces.')}
          </p>
        </div>

        <div class="checkout-box">
          <h3 class="checkout-box-title">Privacy Policy</h3>
          <p style="font-size:0.9rem; line-height:1.7; color:var(--color-text-muted);">
            ${escapeHtml(State.settings.privacy_policy || 'Your privacy is paramount. We never sell customer records.')}
          </p>
        </div>

        <div class="checkout-box">
          <h3 class="checkout-box-title">Terms & Conditions</h3>
          <p style="font-size:0.9rem; line-height:1.7; color:var(--color-text-muted);">
            ${escapeHtml(State.settings.terms_conditions || 'All bespoke denim pieces are handcrafted subject to the quality standards of Harry & Co Atelier.')}
          </p>
        </div>
      </div>
    </div>
  `;
}

function renderMaintenanceMode() {
  document.body.innerHTML = `
    <div style="min-height:100vh; background:#070d19; color:#fff; display:flex; align-items:center; justify-content:center; padding:2rem; text-align:center;">
      <div style="max-width:540px;">
        <div style="font-family:'Cinzel', serif; font-size:2rem; font-weight:800; letter-spacing:0.2em; color:#fff; margin-bottom:0.5rem;">
          ${escapeHtml(State.settings.brand_name || 'HARRY & CO')}
        </div>
        <div style="color:var(--color-copper); font-size:0.8rem; letter-spacing:0.25em; font-weight:700; margin-bottom:2rem;">
          ATELIER MAINTENANCE
        </div>
        <h1 style="font-family:'Syne', sans-serif; font-size:1.8rem; margin-bottom:1rem;">
          Scheduled Atelier Maintenance
        </h1>
        <p style="color:#94a3b8; font-size:0.95rem; line-height:1.7; margin-bottom:2rem;">
          Our digital store is temporarily offline while we sync seasonal selvedge inventories. Please check back shortly.
        </p>
        <a href="/login?tab=admin" style="font-size:0.75rem; color:var(--color-copper); text-decoration:underline;">Staff Login</a>
      </div>
    </div>
  `;
}

// Review submission modal
window.openReviewModal = function (productId) {
  let overlay = document.getElementById('review-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'review-modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content" style="max-width:500px; padding:2rem;">
        <button class="modal-close-btn" onclick="document.getElementById('review-modal-overlay').classList.remove('open')">×</button>
        <h3 style="font-family:var(--font-heading); font-size:1.3rem; font-weight:700; margin-bottom:1.5rem;">Write a Review</h3>
        <form onsubmit="event.preventDefault(); submitProductReview(${productId});">
          <div class="form-group" style="margin-bottom:1rem;">
            <label class="form-label">Your Name *</label>
            <input type="text" id="rev-name" required class="form-input" placeholder="e.g. Rohan Mehra">
          </div>
          <div class="form-group" style="margin-bottom:1rem;">
            <label class="form-label">Email Address (Optional)</label>
            <input type="email" id="rev-email" class="form-input" placeholder="e.g. rohan@example.com">
          </div>
          <div class="form-group" style="margin-bottom:1rem;">
            <label class="form-label">Rating *</label>
            <select id="rev-rating" class="form-input" required>
              <option value="5">★★★★★ (5 - Masterpiece)</option>
              <option value="4">★★★★☆ (4 - Excellent)</option>
              <option value="3">★★★☆☆ (3 - Good)</option>
              <option value="2">★★☆☆☆ (2 - Fair)</option>
              <option value="1">★☆☆☆☆ (1 - Poor)</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:1rem;">
            <label class="form-label">Review Title</label>
            <input type="text" id="rev-title" class="form-input" placeholder="e.g. Best raw selvedge I have worn">
          </div>
          <div class="form-group" style="margin-bottom:1.5rem;">
            <label class="form-label">Your Feedback *</label>
            <textarea id="rev-comment" required class="form-input" rows="4" placeholder="Describe the fit, fading, comfort, and fabric weight..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Submit Review</button>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  overlay.classList.add('open');
};

window.submitProductReview = async function (productId) {
  const name = document.getElementById('rev-name').value;
  const email = document.getElementById('rev-email').value;
  const rating = document.getElementById('rev-rating').value;
  const title = document.getElementById('rev-title').value;
  const comment = document.getElementById('rev-comment').value;

  try {
    await API.submitReview(productId, {
      customerName: name,
      customerEmail: email,
      rating: parseInt(rating, 10),
      title,
      comment
    });
    document.getElementById('review-modal-overlay').classList.remove('open');
    showToast('Thank you! Your verified review has been published.', 'info');
    if (window.location.hash.startsWith('#product/')) {
      const slug = window.location.hash.replace('#product/', '');
      renderProductDetailView(slug);
    }
  } catch (err) {
    showToast(err.message || 'Error submitting review.', 'error');
  }
};

// UI Helpers (Drawer, Escaping)
export function openCartDrawer() {
  renderCartDrawer();
  const drawer = document.getElementById('cart-drawer-backdrop');
  if (drawer) drawer.classList.add('open');
}

export function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer-backdrop');
  if (drawer) drawer.classList.remove('open');
}

window.openMobileNav = function () {
  const nav = document.getElementById('mobile-nav-drawer');
  if (nav) nav.classList.add('open');
};

window.closeMobileNav = function () {
  const nav = document.getElementById('mobile-nav-drawer');
  if (nav) nav.classList.remove('open');
};

function initEventListeners() {
  const cartToggle = document.getElementById('cart-drawer-toggle');
  if (cartToggle) {
    cartToggle.addEventListener('click', openCartDrawer);
  }

  const cartClose = document.getElementById('cart-drawer-close');
  if (cartClose) {
    cartClose.addEventListener('click', closeCartDrawer);
  }

  const drawerBackdrop = document.getElementById('cart-drawer-backdrop');
  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', (e) => {
      if (e.target === drawerBackdrop) closeCartDrawer();
    });
  }
}
