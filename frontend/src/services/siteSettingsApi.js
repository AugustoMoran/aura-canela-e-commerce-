import { baseApi } from './baseApi';

export const siteSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSiteSettings: builder.query({
      query: () => '/site-settings',
      providesTags: ['SiteSettings'],
    }),
    updateSiteSettings: builder.mutation({
      query: (settings) => ({
        url: '/site-settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['SiteSettings'],
    }),
  }),
});

export const { useGetSiteSettingsQuery, useUpdateSiteSettingsMutation } = siteSettingsApi;
