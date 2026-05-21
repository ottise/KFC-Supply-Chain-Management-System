"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  isPinned: boolean;
  sidebarWidth: number;
  setCollapsed: (collapsed: boolean) => void;
  setPinned: (pinned: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: true,
  isPinned: false,
  sidebarWidth: 80,
  setCollapsed: () => {},
  setPinned: () => {},
  toggleSidebar: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isPinned, setIsPinned] = useState(false);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  const setPinned = useCallback((pinned: boolean) => {
    setIsPinned(pinned);
    if (pinned) {
      setIsCollapsed(false);
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const sidebarWidth = isCollapsed ? 80 : 256;

  return (
    <SidebarContext.Provider value={{ isCollapsed, isPinned, sidebarWidth, setCollapsed, setPinned, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  return useContext(SidebarContext);
}
