import { baseApi } from './baseApi';

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query({
      query: () => '/cart',
      providesTags: ['Cart'],
    }),
    syncCart: builder.mutation({
      query: (items) => ({ url: '/cart/sync', method: 'POST', body: { items } }),
      invalidatesTags: ['Cart'],
    }),
    addToCart: builder.mutation({
      query: (data) => ({ url: '/cart/add', method: 'POST', body: data }),
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: builder.mutation({
      query: ({ productoId, cantidad, talla, color }) => ({
        url: `/cart/${productoId}`,
        method: 'PUT',
        body: { cantidad, talla, color },
      }),
      invalidatesTags: ['Cart'],
    }),
    removeFromCart: builder.mutation({
      query: ({ productoId, talla, color }) => ({ 
        url: `/cart/${productoId}?talla=${encodeURIComponent(talla || '')}&color=${encodeURIComponent(color || '')}`, 
        method: 'DELETE' 
      }),
      invalidatesTags: ['Cart'],
    }),
    clearCart: builder.mutation({
      query: () => ({ url: '/cart', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
    getStorageUsage: builder.query({
      query: () => '/upload/usage',
      providesTags: ['Upload'],
    }),
    uploadImage: builder.mutation({
      query: (formData) => ({
        url: '/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Upload'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCartQuery,
  useSyncCartMutation,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  useGetStorageUsageQuery,
  useUploadImageMutation,
} = cartApi;
