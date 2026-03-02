'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X } from 'lucide-react';

export function FloatingVoiceButton() {
  const [isVisible, setIsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Handle scroll-based visibility (auto-hide on scroll down, peek on scroll up)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide button
        setIsVisible(false);
      } else {
        // Scrolling up - show button
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Handle drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragOffset({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragOffset.x,
        y: touch.clientY - dragOffset.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

  // Handle voice recording (simulated)
  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  return (
    <>
      {/* Floating Voice Button */}
      <div
        className={`fixed z-50 transition-all duration-300 ease-in-out ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 pointer-events-none'
        }`}
        style={{
          right: `${position.x}px`,
          bottom: `${position.y}px`,
          position: 'fixed'
        }}
      >
        <button
          ref={buttonRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={() => setShowOverlay(true)}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchEnd={stopRecording}
          className={`group relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
            isRecording 
              ? 'bg-red-500 scale-110 animate-pulse' 
              : 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 hover:scale-105'
          }`}
          aria-label="Voice assistant"
        >
          {/* Pulse animation when recording */}
          {isRecording && (
            <span className="absolute w-full h-full rounded-full bg-red-400 animate-ping opacity-75"></span>
          )}
          
          {/* Microphone icon */}
          {isRecording ? (
            <Mic className="w-7 h-7 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white group-hover:w-7 group-hover:h-7 transition-all" />
          )}
          
          {/* Tooltip on hover */}
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none">
            {isRecording ? 'Release to stop' : 'Tap to open • Hold to talk'}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </button>
      </div>

      {/* Voice Interface Overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:w-[500px] sm:max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Voice Assistant</h3>
              <button 
                onClick={() => setShowOverlay(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Voice visualization area */}
            <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
              {/* Animated voice waves */}
              <div className={`relative w-32 h-32 rounded-full flex items-center justify-center mb-6 ${
                isRecording ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                {/* Outer ring animations */}
                {isRecording && (
                  <>
                    <span className="absolute w-full h-full rounded-full border-2 border-red-400 animate-ping opacity-30"></span>
                    <span className="absolute w-24 h-24 rounded-full border-2 border-red-400 animate-ping opacity-50" style={{ animationDelay: '0.2s' }}></span>
                    <span className="absolute w-20 h-20 rounded-full border-2 border-red-400 animate-ping opacity-70" style={{ animationDelay: '0.4s' }}></span>
                  </>
                )}
                
                {/* Center microphone */}
                <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isRecording ? 'bg-red-500 scale-110' : 'bg-orange-500'
                }`}>
                  {isRecording ? (
                    <Mic className="w-8 h-8 text-white animate-pulse" />
                  ) : (
                    <Mic className="w-7 h-7 text-white" />
                  )}
                </div>
              </div>

              {/* Status text */}
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isRecording ? 'Listening...' : 'Tap & hold to speak'}
              </p>
              <p className="text-sm text-gray-500 text-center">
                {isRecording 
                  ? 'Speak your query clearly' 
                  : 'Or tap to open voice commands'}
              </p>

              {/* Quick action buttons */}
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors">
                  Find a technician
                </button>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors">
                  COC status
                </button>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors">
                  Sizing calculator
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
