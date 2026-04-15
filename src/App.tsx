import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';

// --- Constants ---
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = 400;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 100;

const TRACKS = [
  { id: 1, title: 'CYBERNETIC_PULSE.WAV', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'NEON_DRIFT.WAV', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'SYNTHWAVE_PROTOCOL.WAV', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

export default function App() {
  // --- Game State ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);

  // --- Music State ---
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // --- Game Logic ---
  const generateFood = useCallback(() => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Ensure food doesn't spawn on snake
      if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setFood({ x: 15, y: 15 });
    setIsGameRunning(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && (!isGameRunning || gameOver)) {
        resetGame();
        return;
      }

      if (!isGameRunning) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (direction.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
          if (direction.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          if (direction.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          if (direction.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isGameRunning, gameOver]);

  useEffect(() => {
    if (!isGameRunning || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setIsGameRunning(false);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          setIsGameRunning(false);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood());
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [direction, food, gameOver, isGameRunning, generateFood]);

  // --- Canvas Rendering ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)'; // Cyan grid
    for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }

    // Draw food (Magenta)
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    // Draw snake (Cyan)
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';
    snake.forEach((segment, index) => {
      if (index === 0) {
        ctx.fillStyle = '#ffffff'; // White head
      } else {
        ctx.fillStyle = '#00ffff';
      }
      ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE - 2, CELL_SIZE - 2);
    });

    ctx.shadowBlur = 0;

  }, [snake, food]);

  // --- Music Logic ---
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipForward = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const skipBackward = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = TRACKS[currentTrackIndex].url;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
    }
  }, [currentTrackIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      skipForward();
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);


  return (
    <div className="min-h-screen bg-[#050505] text-white font-pixel flex flex-col items-center justify-between p-8 selection:bg-[#ff00ff] selection:text-black overflow-hidden relative">
      
      {/* Glitch Overlays */}
      <div className="scanlines"></div>
      <div className="crt-flicker"></div>

      {/* Header */}
      <header className="w-full max-w-2xl flex flex-col md:flex-row justify-between items-center mb-8 z-10 screen-tear">
        <h1 
          className="text-xl md:text-2xl font-bold text-[#00ffff] glitch mb-4 md:mb-0" 
          data-text="SYS.SNAKE_PROTOCOL"
        >
          SYS.SNAKE_PROTOCOL
        </h1>
        <div className="text-xs md:text-sm text-[#ff00ff] border-b-2 border-[#ff00ff] pb-1">
          DATA_FRAGMENTS: {score.toString().padStart(4, '0')}
        </div>
      </header>

      {/* Game Area */}
      <main className="relative flex-1 flex items-center justify-center w-full z-10">
        <div className="relative p-2 bg-[#050505] border-4 border-[#00ffff] shadow-[10px_10px_0px_0px_#ff00ff] screen-tear">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="bg-[#050505] block"
          />
          
          {/* Overlays */}
          {(!isGameRunning && !gameOver) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <p className="text-[#00ffff] text-xs md:text-sm mb-6 animate-pulse">INITIATE SEQUENCE [SPACE]</p>
                <p className="text-[#ff00ff] text-[10px]">INPUT: ARROWS // WASD</p>
              </div>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 border-2 border-[#ff00ff]">
              <h2 
                className="text-xl md:text-2xl text-[#ff00ff] mb-6 glitch"
                data-text="SYSTEM FAILURE"
              >
                SYSTEM FAILURE
              </h2>
              <p className="text-[10px] md:text-xs text-white mb-8">
                FRAGMENTS RECOVERED: <span className="text-[#00ffff]">{score}</span>
              </p>
              <button 
                onClick={resetGame}
                className="px-4 py-3 bg-transparent border-2 border-[#00ffff] text-[#00ffff] text-[10px] hover:bg-[#00ffff] hover:text-black transition-colors uppercase"
              >
                REBOOT SYSTEM
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Music Player */}
      <footer className="w-full max-w-2xl mt-12 bg-[#050505] border-2 border-[#ff00ff] p-4 shadow-[5px_5px_0px_0px_#00ffff] flex flex-col md:flex-row items-center justify-between z-10 screen-tear">
        <div className="flex items-center gap-4 w-full md:w-auto mb-4 md:mb-0">
          <div className="w-10 h-10 border-2 border-[#00ffff] flex items-center justify-center bg-[#ff00ff]/20">
            {isPlaying ? (
              <div className="w-full h-full bg-[#00ffff] animate-pulse"></div>
            ) : (
              <div className="w-full h-full bg-transparent"></div>
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[8px] text-[#ff00ff] uppercase mb-2">AUDIO_STREAM_ACTIVE</span>
            <span className="text-[10px] text-[#00ffff] truncate pr-4">{TRACKS[currentTrackIndex].title}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={skipBackward} className="text-[#00ffff] hover:text-[#ff00ff] transition-colors">
            <SkipBack size={20} />
          </button>
          
          <button 
            onClick={togglePlayPause}
            className="w-12 h-12 flex items-center justify-center border-2 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-colors"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
          </button>
          
          <button onClick={skipForward} className="text-[#00ffff] hover:text-[#ff00ff] transition-colors">
            <SkipForward size={20} />
          </button>

          <div className="w-px h-8 bg-[#ff00ff] mx-2"></div>

          <button onClick={toggleMute} className="text-[#00ffff] hover:text-[#ff00ff] transition-colors">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        <audio ref={audioRef} preload="auto" />
      </footer>
    </div>
  );
}
