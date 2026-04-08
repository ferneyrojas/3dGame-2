/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Engine } from './engine/Engine';
import { SceneConfig } from './types/scene';
import { MousePointer2, Keyboard, Move, Zap, HelpCircle, X, Smartphone } from 'lucide-react';
import nipplejs from 'nipplejs';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [engineReady, setEngineReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isFast, setIsFast] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 1024;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const mobileResult = isMobileUA || hasTouch || isSmallScreen;
      setIsMobile(mobileResult);
      console.log("Check mobile result:", mobileResult, { isMobileUA, hasTouch, isSmallScreen, width: window.innerWidth });
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadScene = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const fileName = urlParams.get('file') || 'scene.json';
        const filePath = `/assets/${fileName}`;

        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`No se pudo cargar el archivo: ${fileName}`);
        }
        const config: SceneConfig = await response.json();

        if (containerRef.current && !engineRef.current) {
          engineRef.current = new Engine(containerRef.current, config);
          setEngineReady(true);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
        setLoading(false);
      }
    };

    loadScene();
  }, [isMobile]);

  // Handle Joystick initialization separately to ensure Ref is ready
  useEffect(() => {
    let manager: any = null;

    console.log("Joystick Effect Check:", { 
      engineReady, 
      isMobile, 
      hasJoystickRef: !!joystickRef.current, 
      hasEngineRef: !!engineRef.current 
    });

    if (engineReady && isMobile && joystickRef.current && engineRef.current) {
      console.log("Initializing NippleJS...");
      try {
        manager = nipplejs.create({
          zone: joystickRef.current,
          mode: 'dynamic',
          color: 'white',
          size: 100,
          threshold: 0.1,
          catchDistance: 150
        });

        console.log("NippleJS Manager Created successfully");

        manager.on('move', (evt: any, data: any) => {
          // Some versions of nipplejs pass data as second arg, others as evt.data
          const moveData = data || evt.data;
          
          if (engineRef.current && moveData && moveData.vector) {
            // NippleJS vector.y is positive when moving UP
            // PlayerController expects positive for Forward
            engineRef.current.playerController.setExternalMove(moveData.vector.x, moveData.vector.y);
          }
        });

        manager.on('end', () => {
          if (engineRef.current) {
            engineRef.current.playerController.setExternalMove(0, 0);
          }
        });
      } catch (e) {
        console.error("Error creating NippleJS manager:", e);
      }
    }

    return () => {
      if (manager) {
        manager.destroy();
      }
    };
  }, [engineReady, isMobile]);

  // Touch look handling
  const touchStart = useRef({ x: 0, y: 0 });
  const handleTouchStart = (e: any) => {
    if (e.touches && e.touches[0]) {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: any) => {
    if (!engineRef.current || !e.touches || !e.touches[0]) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    
    // Only rotate if touching the right half of the screen
    if (touch.clientX > window.innerWidth / 2) {
      engineRef.current.playerController.addExternalLook(deltaX * 0.01, deltaY * 0.01);
    }
    
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  console.log("Rendering App State:", { isMobile, engineReady, loading, error });

  return (
    <div 
      className="relative w-full h-screen bg-black overflow-hidden font-sans touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Three.js Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Mobile Joystick Zone */}
      {isMobile && engineReady && !error && (
        <div 
          ref={joystickRef} 
          className="absolute bottom-0 left-0 w-1/2 h-1/2 pointer-events-auto z-20" 
        />
      )}

      {/* Mobile Sprint Button (Left Side) */}
      {isMobile && !loading && !error && (
        <button 
          className={`absolute bottom-48 left-8 w-14 h-14 rounded-full border border-white/30 flex items-center justify-center transition-all z-40 active:scale-90 ${isFast ? 'bg-yellow-500/40 border-yellow-400/60' : 'bg-white/10'}`}
          onClick={() => {
            const newFast = !isFast;
            setIsFast(newFast);
            if (engineRef.current) {
              engineRef.current.playerController.setFast(newFast);
            }
          }}
        >
          <Zap className={`w-6 h-6 ${isFast ? 'text-yellow-200' : 'text-white'}`} />
        </button>
      )}

      {/* Mobile Interaction Button (Right Side) */}
      {isMobile && !loading && !error && (
        <button 
          className="absolute bottom-20 right-20 w-20 h-20 bg-white/20 backdrop-blur-md rounded-full border border-white/40 flex items-center justify-center active:scale-90 transition-transform z-30 shadow-lg"
          onClick={() => {
            if (engineRef.current) {
              engineRef.current.triggerInteraction();
            }
          }}
        >
          <MousePointer2 className="w-8 h-8 text-white" />
        </button>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="text-white text-xl animate-pulse">Cargando Escenario 3D...</div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 z-50">
          <div className="text-white text-center p-8 bg-black/50 rounded-lg border border-red-500">
            <h2 className="text-2xl font-bold mb-4">Error</h2>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* UI Overlay */}
      {!loading && !error && (
        <>
          {/* Toggle Instructions Button */}
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="absolute top-6 right-6 p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white z-40 hover:bg-black/60 transition-all active:scale-95"
            title={showInstructions ? "Ocultar instrucciones" : "Mostrar instrucciones"}
          >
            {showInstructions ? <X className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
          </button>

          {/* Instructions Panel */}
          {showInstructions && (
            <div className="absolute top-20 right-6 p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 text-white max-w-xs pointer-events-none transition-all animate-in fade-in slide-in-from-top-4 duration-300">
              <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Move className="w-5 h-5 text-blue-400" />
                Motor 3D JSON
              </h1>
              
              <div className="space-y-4 text-sm opacity-90">
                {isMobile ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <span>Joystick (Izquierda) para mover</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center">
                        <Move className="w-4 h-4" />
                      </div>
                      <span>Desliza (Derecha) para mirar</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <span>Botón de rayo (Izquierda) para Correr</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MousePointer2 className="w-5 h-5 text-green-400" />
                      <span>Botón de puntero (Derecha) para Interactuar</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <kbd className="px-2 py-1 bg-white/20 rounded text-xs">W</kbd>
                        <kbd className="px-2 py-1 bg-white/20 rounded text-xs">A</kbd>
                        <kbd className="px-2 py-1 bg-white/20 rounded text-xs">S</kbd>
                        <kbd className="px-2 py-1 bg-white/20 rounded text-xs">D</kbd>
                      </div>
                      <span>Movimiento</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <kbd className="px-2 py-1 bg-white/20 rounded text-xs">CTRL</kbd>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span>Correr</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MousePointer2 className="w-4 h-4 text-green-400" />
                      <span>Click para Interactuar</span>
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-white/10 text-xs italic opacity-60">
                  {isMobile ? 'Optimizado para pantallas táctiles.' : 'Haz click en el centro para capturar el mouse. ESC para liberar.'}
                </div>
              </div>
            </div>
          )}

          {/* Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border border-white/20 rounded-full" />
          </div>

          {/* Footer Info */}
          <div className="absolute bottom-6 right-6 text-white/40 text-[10px] uppercase tracking-widest pointer-events-none">
            Powered by Three.js & JSON Engine
          </div>
        </>
      )}
    </div>
  );
}
