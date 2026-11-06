/* ==========================================================================
   AURA ATELIER — Modular Feature Stylesheets Barrel
   Imported in strict cascade order so responsive overrides always win
   ========================================================================== */

// 1. Base Shell & Shared Primitives
import './base.css'

// 2. Top Navigation Layout
import './layouts/header.css'

// 3. Storefront Pages & Product Cards
import './pages/home.css'
import './components/product-card.css'
import './components/skeleton.css'
import './pages/shop.css'
import './pages/product-detail.css'
import './pages/cart.css'
import './pages/checkout.css'
import './pages/account.css'

// 4. Footer, Shared Modals, Maps, Wishlist & Mobile Bottom Nav
import './layouts/footer.css'
import './components/modals.css'
import './components/store-locator.css'
import './components/wishlist.css'
import './layouts/mobile-nav.css'

// 5. Tablet & Phone Responsive Overrides (must remain last)
import './responsive.css'

export {}

