import React from 'react';
import { useGetSiteSettingsQuery } from '../../services/siteSettingsApi';
import { STORE } from '../../config/storeContact';

const IG_URL = STORE.instagram;

const ScrollingBanner = () => {
  const { data: settings, isLoading } = useGetSiteSettingsQuery();

  if (isLoading || !settings?.announcementActive) return null;

  return (
    <a 
      href={IG_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-ink text-white py-1.5 overflow-hidden absolute top-0 left-0 right-0 z-[60] border-b border-primary-600 h-8 flex items-center shadow-lg uppercase tracking-[0.2em] cursor-pointer hover:bg-ink-soft transition-colors"
    >
      <div className="flex whitespace-nowrap animate-marquee px-4">
        <span className="text-[10px] sm:text-[11px] font-black px-4">
          {settings.announcementText} &nbsp;&nbsp; ● &nbsp;&nbsp; {settings.announcementText} &nbsp;&nbsp; ● &nbsp;&nbsp; {settings.announcementText} &nbsp;&nbsp; ● &nbsp;&nbsp; {settings.announcementText}
        </span>
        <span className="text-[10px] sm:text-[11px] font-black px-4">
          &nbsp;&nbsp; ● &nbsp;&nbsp; {settings.announcementText} &nbsp;&nbsp; ● &nbsp;&nbsp; {settings.announcementText} &nbsp;&nbsp; ● &nbsp;&nbsp; {settings.announcementText} &nbsp;&nbsp; ● &nbsp;&nbsp; {settings.announcementText}
        </span>
      </div>
    </a>
  );
};

export default ScrollingBanner;
