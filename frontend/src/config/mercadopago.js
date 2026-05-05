/**
 * Initialize Mercado Pago SDK
 * Waits for SDK to load before initializing
 */
export const initializeMercadoPago = async () => {
  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
  
  if (!publicKey) {
    console.warn('⚠️ VITE_MP_PUBLIC_KEY not configured. Mercado Pago checkout will not work.');
    return;
  }

  try {
    // Wait for the script promise to resolve
    if (window.mpScriptReady) {
      await window.mpScriptReady;
    }

    // Check if window.MercadoPago is available (v2 API)
    if (typeof window.MercadoPago !== 'undefined') {
      console.log('✅ Mercado Pago SDK initialized successfully');
      window.MercadoPago.init({
        publicKey: publicKey,
      });
    } else {
      console.error('❌ window.MercadoPago not found. SDK may not have loaded correctly.');
    }
  } catch (error) {
    console.error('❌ Error initializing MP SDK:', error);
  }
};
