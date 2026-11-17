import React, { createContext, useContext, useEffect, useState } from 'react';

interface PageScrollState {
  scrollY: number;
  collapsed: boolean;
}

const PageScrollContext = createContext<PageScrollState>({
  scrollY: 0,
  collapsed: false,
});

export function usePageScroll(): PageScrollState {
  return useContext(PageScrollContext);
}

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  bottomNavPadding?: boolean;
  collapseThreshold?: number;
}

/**
 * L0 Shared Screen Shell
 * Renders the approved Mintly drifting mesh-gradient atmosphere, subtle noise grain,
 * safe-area padding, consistent 20px side gutters, floating-nav clearance, and scroll context.
 */
export const PageShell: React.FC<PageShellProps> = ({
  children,
  className = '',
  contentClassName = '',
  bottomNavPadding = true,
  collapseThreshold = 96,
}) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => setScrollY(window.scrollY || 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <PageScrollContext.Provider
      value={{ scrollY, collapsed: scrollY > collapseThreshold }}
    >
      <div
        className={`min-h-screen relative overflow-x-clip text-[var(--ink)] flex flex-col ${className}`}
      >
        {/* L0 Atmospheric Drifting Mesh Gradient + Grain Overlay */}
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-20 mintly-atmosphere-bg mintly-atmosphere-drift pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 mintly-grain-overlay pointer-events-none"
        />

        {/* Centered Mobile-First App Column with 20px side gutters & safe areas */}
        <main
          className={`flex-1 w-full max-w-[430px] mx-auto px-5 pt-[calc(env(safe-area-inset-top,0px)+16px)] ${
            bottomNavPadding ? 'pb-[calc(env(safe-area-inset-bottom,0px)+112px)]' : 'pb-16'
          } ${contentClassName}`}
        >
          {children}
        </main>
      </div>
    </PageScrollContext.Provider>
  );
};
