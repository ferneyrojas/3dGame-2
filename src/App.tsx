/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Engine } from './engine/Engine';
import { SceneConfig } from './types/scene';
import { MousePointer2, Keyboard, Move, Zap, HelpCircle, X } from 'lucide-react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

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
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
        setLoading(false);
      }
    };

    loadScene();

    return () => {
      // Cleanup if necessary
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      {/* Three.js Container */}
      <div ref={containerRef} className="w-full h-full" />

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

                <div className="pt-4 border-t border-white/10 text-xs italic opacity-60">
                  Haz click en el centro para capturar el mouse. ESC para liberar.
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
