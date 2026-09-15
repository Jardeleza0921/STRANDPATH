import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

export function SiteLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-full w-full flex-col bg-canvas">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>);

}