import { useContext } from 'react'
import { Package, X } from 'lucide-react'
import { AuthModal, PaywayModal, ProductDetailSkeleton, WishlistDrawer } from '@/components'
import { StorefrontContext, StorefrontProvider, useStorefront } from '@/context'
import {
  AccountPage,
  CartPage,
  CheckoutPage,
  HomePage,
  ProductDetailPage,
  ShopPage,
} from '@/pages'
import { Footer } from './Footer'
import { Header } from './Header'
import { MobileBottomNav } from './MobileBottomNav'

function StorefrontContent() {
  const {
    activePage,
    activeNavHighlight,
    accountTab,
    setAccountTab,
    toast,
    setToast,
    showToast,
    navigateToPage,
    openProductDetails,
    handleBackFromProduct,
    navigateHeaderCategory,
    handleSelectCategory,
    goToAccountTab,
    user,
    setUser,
    authModalMode,
    setAuthModalMode,
    hasExistingProfile,
    profileForm,
    setProfileForm,
    savingProfile,
    handleSaveProfile,
    handleLogout,
    handleAuthSuccess,
    categories,
    products,
    catalogLoading,
    catalogError,
    handleReloadCatalog,
    brokenImages,
    setBrokenImages,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedSize,
    setSelectedSize,
    selectedColor,
    setSelectedColor,
    priceRange,
    setPriceRange,
    appliedMinPrice,
    setAppliedMinPrice,
    appliedMaxPrice,
    setAppliedMaxPrice,
    availabilityFilter,
    setAvailabilityFilter,
    sortBy,
    setSortBy,
    mobileFiltersOpen,
    setMobileFiltersOpen,
    activeProduct,
    selectedDetailPricing,
    isWishlistOpen,
    setIsWishlistOpen,
    wishlist,
    wishlistProducts,
    handleToggleWishlist,
    clearWishlist,
    resolvePrimaryImage,
    cart,
    cartSubtotal,
    shippingEstimate,
    checkoutTotalEstimate,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    showCheckoutNewAddr,
    setShowCheckoutNewAddr,
    editingAddress,
    setEditingAddress,
    addressForm,
    setAddressForm,
    savingAddress,
    handleSaveAddress,
    handleSetDefaultAddress,
    handleRemoveAddress,
    orders,
    orderStatusFilter,
    setOrderStatusFilter,
    handleCancelOrder,
    handleDownloadInvoice,
    payments,
    handleVerifyPayment,
    myReviewedProducts,
    handleDeleteReview,
    checkoutPaymentMethod,
    setCheckoutPaymentMethod,
    creditCardForm,
    setCreditCardForm,
    promoCode,
    setPromoCode,
    discountAmount,
    handleApplyPromo,
    placingOrder,
    handlePlaceOrder,
    confirmedOrder,
    setConfirmedOrder,
    paywayModalOrder,
    setPaywayModalOrder,
    openingPayway,
    handleOpenPaywayModal,
    handlePaymentUpdated,
    handleAddToCart,
    handleOurProductAddToCart,
    handleUpdateCartQty,
    handleRemoveCartItem,
    handleAddWishlistToCart,
    handleAddAllWishlistToCart,
  } = useStorefront()

  return (
    <div className="nx-app">
      {/* Toast Notification */}
      {toast && (
        <div className={`ug-toast ug-toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Fixed Top Navigation Header */}
      <Header
        activePage={activePage}
        activeNavHighlight={activeNavHighlight}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        wishlistCount={wishlistProducts.length}
        isWishlistOpen={isWishlistOpen}
        setIsWishlistOpen={setIsWishlistOpen}
        cartTotalQty={Number(cart?.total_qty || 0)}
        onNavigateHeaderCategory={navigateHeaderCategory}
        onNavigatePage={navigateToPage}
        onOpenAuthModal={() => setAuthModalMode('login')}
        showToast={showToast}
      />

      {/* Main Feature Pages Router */}
      <main className="nx-main">
        {activePage === 'home' && (
          <HomePage
            categories={categories}
            products={products}
            catalogLoading={catalogLoading}
            catalogError={catalogError}
            onReloadCatalog={() => void handleReloadCatalog()}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onNavigateHeaderCategory={navigateHeaderCategory}
            onSelectCategory={handleSelectCategory}
            onOpenProductDetails={openProductDetails}
            onAddOurProductToCart={(item) => void handleOurProductAddToCart(item)}
            getProductPrimaryImage={resolvePrimaryImage}
          />
        )}

        {activePage === 'shop' && (
          <ShopPage
            categories={categories}
            products={products}
            catalogLoading={catalogLoading}
            catalogError={catalogError}
            onReloadCatalog={() => void handleReloadCatalog()}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            appliedMinPrice={appliedMinPrice}
            setAppliedMinPrice={setAppliedMinPrice}
            appliedMaxPrice={appliedMaxPrice}
            setAppliedMaxPrice={setAppliedMaxPrice}
            availabilityFilter={availabilityFilter}
            setAvailabilityFilter={setAvailabilityFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            mobileFiltersOpen={mobileFiltersOpen}
            setMobileFiltersOpen={setMobileFiltersOpen}
            brokenImages={brokenImages}
            setBrokenImages={setBrokenImages}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onOpenProductDetails={(prod) => openProductDetails(prod)}
            onAddProductToCart={(prod) => void handleOurProductAddToCart(prod)}
            getProductPrimaryImage={resolvePrimaryImage}
          />
        )}

        {activePage === 'product' &&
          (catalogLoading ? (
            <div className="nx-container nx-page-product">
              <ProductDetailSkeleton />
            </div>
          ) : activeProduct ? (
            <ProductDetailPage
              activeProduct={activeProduct}
              products={products}
              selectedDetailPricing={selectedDetailPricing}
              user={user}
              wishlist={wishlist}
              brokenImages={brokenImages}
              setBrokenImages={setBrokenImages}
              onToggleWishlist={handleToggleWishlist}
              onBack={handleBackFromProduct}
              onAddToCart={handleAddToCart}
              onOpenProductDetails={(prod) => openProductDetails(prod)}
              onAddRelatedToCart={(prod) => void handleOurProductAddToCart(prod)}
              onOpenAuthModal={() => setAuthModalMode('login')}
              onReloadCatalog={handleReloadCatalog}
              showToast={showToast}
              getProductPrimaryImage={resolvePrimaryImage}
            />
          ) : (
            <div className="nx-container nx-page-product">
              <div className="nx-empty-card" style={{ marginTop: '36px' }}>
                <Package size={36} />
                <h3>Product not found</h3>
                <button
                  type="button"
                  className="nx-btn nx-btn-dark"
                  onClick={() => navigateToPage('shop')}
                >
                  Back to Shop
                </button>
              </div>
            </div>
          ))}

        {activePage === 'cart' && (
          <CartPage
            user={user}
            cart={cart}
            cartSubtotal={cartSubtotal}
            shippingEstimate={shippingEstimate}
            onOpenAuthModal={() => setAuthModalMode('login')}
            onNavigateShop={() => navigateToPage('shop')}
            onProceedToCheckout={() => {
              if (!user) {
                showToast('Please sign in or register to complete checkout', 'info')
                setAuthModalMode('login')
                return
              }
              setConfirmedOrder(null)
              navigateToPage('checkout')
            }}
            onUpdateCartQty={(id, qty, max) => void handleUpdateCartQty(id, qty, max)}
            onRemoveCartItem={(id) => void handleRemoveCartItem(id)}
            getProductPrimaryImage={resolvePrimaryImage}
          />
        )}

        {activePage === 'checkout' && (
          <CheckoutPage
            user={user}
            cart={cart}
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            setSelectedAddressId={setSelectedAddressId}
            showCheckoutNewAddr={showCheckoutNewAddr}
            setShowCheckoutNewAddr={setShowCheckoutNewAddr}
            addressForm={addressForm}
            setAddressForm={setAddressForm}
            savingAddress={savingAddress}
            onSaveAddress={handleSaveAddress}
            promoCode={promoCode}
            setPromoCode={setPromoCode}
            discountAmount={discountAmount}
            onApplyPromo={handleApplyPromo}
            checkoutPaymentMethod={checkoutPaymentMethod}
            setCheckoutPaymentMethod={setCheckoutPaymentMethod}
            creditCardForm={creditCardForm}
            setCreditCardForm={setCreditCardForm}
            cartSubtotal={cartSubtotal}
            shippingEstimate={shippingEstimate}
            checkoutTotalEstimate={checkoutTotalEstimate}
            placingOrder={placingOrder}
            onPlaceOrder={handlePlaceOrder}
            confirmedOrder={confirmedOrder}
            setConfirmedOrder={setConfirmedOrder}
            openingPayway={openingPayway}
            onOpenPaywayModal={(order) => {
              void handleOpenPaywayModal(order, checkoutPaymentMethod)
            }}
            onGoToAccountTab={goToAccountTab}
            onNavigateShop={() => navigateToPage('shop')}
            onOpenAuthModal={() => setAuthModalMode('login')}
            showToast={showToast}
            getProductPrimaryImage={resolvePrimaryImage}
          />
        )}

        {activePage === 'account' && (
          <AccountPage
            user={user}
            accountTab={accountTab}
            setAccountTab={setAccountTab}
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            hasExistingProfile={hasExistingProfile}
            onAvatarUpdated={(newAvatar) => {
              setUser((prev) => (prev ? { ...prev, avatar: newAvatar } : prev))
              setProfileForm((prev) => ({ ...prev, avatar: newAvatar || '' }))
            }}
            savingProfile={savingProfile}
            onSaveProfile={handleSaveProfile}
            addresses={addresses}
            editingAddress={editingAddress}
            setEditingAddress={setEditingAddress}
            addressForm={addressForm}
            setAddressForm={setAddressForm}
            savingAddress={savingAddress}
            onSaveAddress={handleSaveAddress}
            onSetDefaultAddress={handleSetDefaultAddress}
            onRemoveAddress={handleRemoveAddress}
            orders={orders}
            orderStatusFilter={orderStatusFilter}
            onFilterOrders={(status) => setOrderStatusFilter(status)}
            onCancelOrder={handleCancelOrder}
            onDownloadInvoice={handleDownloadInvoice}
            onOpenPaywayModal={(order) => {
              void handleOpenPaywayModal(order)
            }}
            payments={payments}
            onVerifyPayment={handleVerifyPayment}
            myReviewedProducts={myReviewedProducts}
            onOpenProductDetails={(prod) => openProductDetails(prod)}
            onDeleteReview={handleDeleteReview}
            onNavigateShop={() => navigateToPage('shop')}
            onOpenAuthModal={() => setAuthModalMode('login')}
            onLogout={handleLogout}
            showToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigatePage={(page) => navigateToPage(page)}
        onGoToAccountTab={goToAccountTab}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activePage={activePage}
        activeNavHighlight={activeNavHighlight}
        onNavigateHeaderCategory={navigateHeaderCategory}
      />

      {/* Wishlist Slide-Over Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistProducts={wishlistProducts}
        onToggleWishlist={handleToggleWishlist}
        onAddWishlistToCart={handleAddWishlistToCart}
        onAddAllToCart={() => void handleAddAllWishlistToCart()}
        onClearWishlist={clearWishlist}
        onOpenProduct={(prod) => openProductDetails(prod)}
        onNavigateShop={() => navigateToPage('shop')}
        getProductPrimaryImage={resolvePrimaryImage}
      />

      {/* Auth & PayWay Modals */}
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSuccess={handleAuthSuccess}
          showToast={showToast}
        />
      )}

      {paywayModalOrder && (
        <PaywayModal
          order={paywayModalOrder}
          initialPaymentOption={checkoutPaymentMethod}
          onClose={() => setPaywayModalOrder(null)}
          onPaymentUpdated={handlePaymentUpdated}
          showToast={showToast}
        />
      )}
    </div>
  )
}

export function Storefront() {
  const existingCtx = useContext(StorefrontContext)
  if (existingCtx) {
    return <StorefrontContent />
  }
  return (
    <StorefrontProvider>
      <StorefrontContent />
    </StorefrontProvider>
  )
}

export default Storefront
