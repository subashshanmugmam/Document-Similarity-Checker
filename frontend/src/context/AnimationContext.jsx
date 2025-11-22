/**
 * Animation Settings Context
 * Manages user preferences for animations and accessibility
 */

import { createContext, useContext, useState, useEffect } from 'react';

const AnimationContext = createContext();

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within AnimationProvider');
  }
  return context;
};

export const AnimationProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    enableAnimations: true,
    reducedMotion: false,
    enableParticles: true,
    enableTransitions: true,
  });

  useEffect(() => {
    // Check for user's system preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e) => {
      if (e.matches) {
        setSettings(prev => ({
          ...prev,
          reducedMotion: true,
          enableAnimations: false,
          enableParticles: false,
        }));
      }
    };

    // Initial check
    if (mediaQuery.matches) {
      handleChange({ matches: true });
    }

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const value = {
    settings,
    updateSettings,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};
