import { baseApi } from './baseApi';

export const packsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPacks: builder.query({
      query: (params) => ({
        url: '/packs',
        params,
      }),
      providesTags: ['Packs'],
    }),
    getPacksByCategory: builder.query({
      query: (categoriaId) => `/packs/categoria/${categoriaId}`,
      providesTags: ['Packs'],
    }),
    createPack: builder.mutation({
      query: (data) => ({
        url: '/packs',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Packs'],
    }),
    updatePack: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/packs/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Packs'],
    }),
    deletePack: builder.mutation({
      query: (id) => ({
        url: `/packs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Packs'],
    }),
  }),
});

export const {
  useGetPacksQuery,
  useGetPacksByCategoryQuery,
  useCreatePackMutation,
  useUpdatePackMutation,
  useDeletePackMutation,
} = packsApi;
