/**
 * Animation Settings Panel
 * Allows users to customize animation preferences
 */

import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { useAnimation } from '../context/AnimationContext';

const AnimationSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings } = useAnimation();

  return (
    <>
      {/* Settings Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 hover:scale-110 z-50"
        title="Animation Settings"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card max-w-md w-full animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-blue-400" />
                Animation Settings
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Enable Animations */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300">
                <div>
                  <label className="text-white font-medium cursor-pointer">
                    Enable Animations
                  </label>
                  <p className="text-gray-400 text-sm mt-1">
                    Turn on/off all animations
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableAnimations}
                  onChange={(e) => updateSettings({ enableAnimations: e.target.checked })}
                  className="ml-4"
                />
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300">
                <div>
                  <label className="text-white font-medium cursor-pointer">
                    Reduced Motion
                  </label>
                  <p className="text-gray-400 text-sm mt-1">
                    Minimize motion for accessibility
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => updateSettings({ 
                    reducedMotion: e.target.checked,
                    enableAnimations: !e.target.checked,
                    enableParticles: !e.target.checked,
                  })}
                  className="ml-4"
                />
              </div>

              {/* Enable Particles */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300">
                <div>
                  <label className="text-white font-medium cursor-pointer">
                    Background Particles
                  </label>
                  <p className="text-gray-400 text-sm mt-1">
                    Show floating particle effects
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableParticles}
                  onChange={(e) => updateSettings({ enableParticles: e.target.checked })}
                  disabled={settings.reducedMotion}
                  className="ml-4"
                />
              </div>

              {/* Enable Transitions */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300">
                <div>
                  <label className="text-white font-medium cursor-pointer">
                    Page Transitions
                  </label>
                  <p className="text-gray-400 text-sm mt-1">
                    Smooth transitions between sections
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableTransitions}
                  onChange={(e) => updateSettings({ enableTransitions: e.target.checked })}
                  disabled={settings.reducedMotion}
                  className="ml-4"
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border-2 border-blue-400/30 rounded-xl">
              <p className="text-blue-300 text-sm flex items-start gap-2">
                <span>ℹ️</span>
                <span>
                  These settings help customize your experience. System preferences for reduced motion are automatically detected.
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnimationSettings;
