import { baseApi } from './baseApi';

export const shippingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getShippingConfig: builder.query({
      query: () => '/shipping/config',
      providesTags: ['ShippingConfig'],
    }),
    updateShippingConfig: builder.mutation({
      query: (data) => ({
        url: '/shipping/config',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ShippingConfig'],
    }),
    quoteShipping: builder.mutation({
      query: (data) => ({
        url: '/shipping/cotizar',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetShippingConfigQuery,
  useUpdateShippingConfigMutation,
  useQuoteShippingMutation,
} = shippingApi;
