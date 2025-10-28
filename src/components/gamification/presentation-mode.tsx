/**
 * PRESENTATION MODE - CEO MODE
 * Modo fullscreen para apresentações épicas
 * - Tema premium dark
 * - Transições cinematográficas
 * - Controle por teclado
 * - Foco em dados principais
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface PresentationSlide {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  backgroundColor?: string;
  icon?: string;
}

interface PresentationModeProps {
  slides: PresentationSlide[];
  title?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onClose?: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  slides,
  title = 'Apresentação Delta',
  autoPlay = false,
  autoPlayInterval = 5000,
  onClose,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          nextSlide();
          break;
        case 'ArrowLeft':
          previousSlide();
          break;
        case 'Escape':
          onClose?.();
          break;
        case 'm':
          setIsMuted(!isMuted);
          break;
        case 'p':
          setIsPlaying(!isPlaying);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, isMuted, currentSlide, onClose]);

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPlaying, slides.length, autoPlayInterval]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const previousSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(Math.max(0, Math.min(index, slides.length - 1)));
  };

  const slide = slides[currentSlide];

  return (
    <motion.div
      className="fixed inset-0 bg-black z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Slide Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          className={`
            absolute inset-0 flex flex-col items-center justify-center
            ${slide.backgroundColor || 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'}
          `}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
        >
          {/* Top accent line */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />

          {/* Content */}
          <div className="relative z-10 max-w-6xl mx-auto px-12 py-12 text-center">
            {/* Icon */}
            {slide.icon && (
              <motion.div
                className="text-6xl mb-6"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {slide.icon}
              </motion.div>
            )}

            {/* Title */}
            <motion.h1
              className="text-6xl md:text-7xl font-bold mb-4 text-white leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {slide.title}
            </motion.h1>

            {/* Subtitle */}
            {slide.subtitle && (
              <motion.p
                className="text-2xl text-gray-300 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {slide.subtitle}
              </motion.p>
            )}

            {/* Custom Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {slide.content}
            </motion.div>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      {showControls && (
        <motion.div
          className="absolute bottom-8 left-0 right-0 flex items-center justify-between px-8 z-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          {/* Left controls */}
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => goToSlide(0)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Primeiro slide (Home)"
            >
              <SkipBack className="w-6 h-6" />
            </motion.button>

            <motion.button
              onClick={previousSlide}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Slide anterior (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Center info */}
          <div className="text-white text-center">
            <p className="text-sm font-semibold mb-2">{title}</p>
            <div className="flex items-center justify-center gap-2">
              {slides.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1 rounded-full transition-all ${
                    index === currentSlide ? 'bg-white w-6' : 'bg-white/30 w-2'
                  }`}
                  whileHover={{ backgroundColor: '#ffffff' }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {currentSlide + 1} / {slides.length}
            </p>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-4">
            <motion.button
              onClick={nextSlide}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Próximo slide (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>

            <motion.button
              onClick={() => goToSlide(slides.length - 1)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Último slide (End)"
            >
              <SkipForward className="w-6 h-6" />
            </motion.button>

            <div className="w-px h-6 bg-white/20" />

            <motion.button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Mutar som (M)"
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </motion.button>

            <motion.button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isPlaying
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Auto-play (P)"
            >
              {isPlaying ? '⏸ Parar' : '▶ Auto'}
            </motion.button>

            <motion.button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white ml-2"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Sair (ESC)"
            >
              <Minimize className="w-6 h-6" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Keyboard hints */}
      <motion.div
        className="absolute bottom-8 left-8 text-gray-400 text-xs space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <p>→ / ← Navegue</p>
        <p>ESC Sair</p>
        <p>M Mutar</p>
        <p>P Auto</p>
      </motion.div>

      {/* Hide controls on idle */}
      <motion.div
        className="absolute inset-0 cursor-none"
        onMouseMove={() => {
          setShowControls(true);
          // Hide after 3 seconds of no movement
          setTimeout(() => {
            if (showControls) setShowControls(false);
          }, 3000);
        }}
      />
    </motion.div>
  );
};

/**
 * Hook para usar Presentation Mode facilmente
 */
export const usePresentationMode = () => {
  const [isActive, setIsActive] = useState(false);

  const slides: PresentationSlide[] = [
    {
      id: 'welcome',
      title: 'Delta Navigator',
      subtitle: 'Sistema de Gestão Avançado',
      icon: '🚀',
      content: (
        <div className="space-y-4">
          <p className="text-xl text-gray-200">Bem-vindo à sua apresentação</p>
          <p className="text-gray-400">Use as setas ou espaço para navegar</p>
        </div>
      ),
    },
    {
      id: 'features',
      title: 'Funcionalidades Principais',
      subtitle: 'Tudo que você precisa',
      icon: '⚡',
      content: (
        <div className="grid grid-cols-2 gap-8 text-left">
          <div>
            <p className="text-xl font-bold text-blue-300">📊 Analytics</p>
            <p className="text-gray-300">Dados em tempo real</p>
          </div>
          <div>
            <p className="text-xl font-bold text-purple-300">🎮 Gamificação</p>
            <p className="text-gray-300">Engajamento total</p>
          </div>
          <div>
            <p className="text-xl font-bold text-pink-300">🤖 IA</p>
            <p className="text-gray-300">Assistente inteligente</p>
          </div>
          <div>
            <p className="text-xl font-bold text-cyan-300">📱 Mobile</p>
            <p className="text-gray-300">Sempre conectado</p>
          </div>
        </div>
      ),
    },
    {
      id: 'performance',
      title: 'Seu Desempenho',
      subtitle: 'Métricas que importam',
      icon: '📈',
      content: (
        <div className="text-2xl space-y-4">
          <p>
            <span className="text-yellow-400 font-bold">1,250</span>{' '}
            <span className="text-gray-300">XP Totais</span>
          </p>
          <p>
            <span className="text-blue-400 font-bold">Nível 8</span>{' '}
            <span className="text-gray-300">Consultor</span>
          </p>
          <p>
            <span className="text-purple-400 font-bold">12</span>{' '}
            <span className="text-gray-300">Conquistas Desbloqueadas</span>
          </p>
        </div>
      ),
    },
  ];

  return {
    isActive,
    setIsActive,
    slides,
  };
};
