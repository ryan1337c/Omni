"use client";
import { ReactNode, useState, useRef, useEffect } from "react";

interface SidebarTooltipProps {
  text: string;
  isSidebarExpanded: boolean;
  children: ReactNode;
}

export default function SidebarTooltip({ 
  text, 
  isSidebarExpanded, 
  children 
}: SidebarTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const childRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!isSidebarExpanded && childRef.current) {
      const rect = childRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height / 2, 
        left: rect.right + 8, 
      });
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  // Attach the original child to the ref
  const childWithRef = (
    <div 
      ref={childRef} 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      onClick={handleMouseLeave}
    >
      {children}
    </div>
  );

  return (
    <>
      {childWithRef}

      {isVisible && (
        <div 
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
          className="
            fixed z-50 
            -translate-y-1/2 
            px-3 py-1.5 
            bg-slate-800 text-white text-sm whitespace-nowrap 
            rounded-md shadow-lg
            
            transition-opacity duration-200
            animate-fade-in-sm
          "
        >
          {text}
          <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-slate-800 rotate-45"></div>
        </div>
      )}
    </>
  );
}
