import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, RoadObject } from '../types';
import { TRACK_BOTTOM_WIDTH_RATIO, TRACK_TOP_WIDTH_RATIO, ROAD_SPEED_BASE } from '../constants';

interface GameEngineProps {
  gameState: GameState;
  onGameOver: (score: number, coins: number) => void;
  onScoreUpdate: (score: number, coins: number) => void;
  gameWidth: number;
  gameHeight: number;
}

export const GameEngine: React.FC<GameEngineProps> = ({ 
  gameState, 
  onGameOver, 
  onScoreUpdate,
  gameWidth,
  gameHeight
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Game Mutable State (Refs to avoid re-renders during loop)
  const stateRef = useRef({
    carX: 0, // Position on track (-1 to 1 mostly)
    roadCurvature: 0,
    curveDirection: 1,
    curveTimer: 0,
    score: 0,
    coins: 0,
    speed: 10,
    obstacles: [] as RoadObject[],
    coinsList: [] as RoadObject[],
    scenery: [] as RoadObject[],
    roadLines: [] as { y: number }[],
    keys: {} as Record<string, boolean>,
    touchX: null as number | null,
    horizonY: 0
  });

  // Init logic
  const initGame = useCallback(() => {
    const horizonY = gameHeight * 0.4;
    stateRef.current = {
      ...stateRef.current,
      carX: 0,
      roadCurvature: 0,
      score: 0,
      coins: 0,
      speed: ROAD_SPEED_BASE,
      obstacles: [],
      coinsList: [],
      scenery: [],
      roadLines: Array.from({ length: 12 }).map((_, i) => ({ 
        y: horizonY + (i * (gameHeight - horizonY) / 12) 
      })),
      horizonY: horizonY
    };

    // Pre-populate scenery
    for(let i=0; i<10; i++) {
       stateRef.current.scenery.push({
         x: -2.5,
         y: horizonY + Math.random() * gameHeight,
         initialWidth: 400,
         initialHeight: 150,
         color: '#444',
         type: 'scenery'
       });
       stateRef.current.scenery.push({
         x: 2.5,
         y: horizonY + Math.random() * gameHeight,
         initialWidth: 400,
         initialHeight: 150,
         color: '#444',
         type: 'scenery'
       });
    }
  }, [gameHeight]);

  // Handle Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { stateRef.current.keys[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { stateRef.current.keys[e.key] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Initialize game state when component mounts or resets
    if (gameState === GameState.PLAYING) {
      initGame();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, initGame]);

  // Touch Controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      stateRef.current.touchX = e.touches[0].clientX;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling
      if (stateRef.current.touchX !== null) {
        const newX = e.touches[0].clientX;
        const diff = newX - stateRef.current.touchX;
        // Sensitivity factor
        stateRef.current.carX += diff * 0.005; 
        stateRef.current.touchX = newX;
      }
    };
    
    const handleTouchEnd = () => {
      stateRef.current.touchX = null;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Main Game Loop
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Helper functions for drawing
    const getProjection = (obj: RoadObject, horizonY: number) => {
      const { roadCurvature } = stateRef.current;
      const perspective = (obj.y - horizonY) / (gameHeight - horizonY);
      
      // Cull objects behind or too far
      if (perspective < 0 || perspective > 1.2) return null;

      const scale = perspective;
      const scaledWidth = obj.initialWidth * scale;
      const scaledHeight = obj.initialHeight * scale;

      const roadWidthAtY = (gameWidth * TRACK_TOP_WIDTH_RATIO) + 
                          (gameWidth * (TRACK_BOTTOM_WIDTH_RATIO - TRACK_TOP_WIDTH_RATIO) * perspective);
      
      const curveOffsetAtY = roadCurvature * (1 - perspective);
      
      const screenX = (gameWidth / 2) + (roadWidthAtY * obj.x * 0.25) + curveOffsetAtY;
      
      return {
        x: screenX,
        y: obj.y,
        width: scaledWidth,
        height: scaledHeight,
        zIndex: perspective // For sorting
      };
    };

    const drawPlayer = () => {
        const { carX, roadCurvature } = stateRef.current;
        const trackWidthBase = gameWidth * TRACK_BOTTOM_WIDTH_RATIO;
        
        // Clamp car position
        stateRef.current.carX = Math.max(-1.8, Math.min(1.8, carX));

        const playerX = (gameWidth / 2) + (stateRef.current.carX * trackWidthBase * 0.06); // 0.06 is a magic number to align with lanes
        const playerY = gameHeight - 80;
        const width = 100;
        const height = 45;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(playerX, playerY + height - 5, width/2, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Car Body (F1 Style)
        // Main chassis
        const gradient = ctx.createLinearGradient(playerX - width/2, playerY, playerX + width/2, playerY);
        gradient.addColorStop(0, '#cc0000');
        gradient.addColorStop(0.5, '#ff0000');
        gradient.addColorStop(1, '#990000');
        ctx.fillStyle = gradient;
        
        // Rear wing
        ctx.fillRect(playerX - width/2, playerY + 10, width, 15);
        
        // Nose
        ctx.beginPath();
        ctx.moveTo(playerX - 15, playerY + 10);
        ctx.lineTo(playerX + 15, playerY + 10);
        ctx.lineTo(playerX, playerY - 30);
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(playerX, playerY, 12, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = '#yellow';
        ctx.beginPath();
        ctx.arc(playerX, playerY - 5, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24'; // Amber
        ctx.fill();

        // Tires
        ctx.fillStyle = '#1a1a1a';
        // Rear Left
        ctx.fillRect(playerX - width/2 - 15, playerY + 15, 20, 30);
        // Rear Right
        ctx.fillRect(playerX + width/2 - 5, playerY + 15, 20, 30);
        // Front Left
        ctx.fillRect(playerX - 25, playerY - 20, 15, 25);
        // Front Right
        ctx.fillRect(playerX + 10, playerY - 20, 15, 25);

        return { x: playerX, y: playerY, width, height };
    };

    const render = () => {
        const { horizonY, roadCurvature } = stateRef.current;

        // 1. Clear & Sky
        ctx.clearRect(0, 0, gameWidth, gameHeight);
        
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0, '#0f172a'); // Slate 900
        skyGrad.addColorStop(1, '#1e3a8a'); // Blue 900
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, gameWidth, horizonY);

        // 2. Ground
        ctx.fillStyle = '#064e3b'; // Emerald 900
        ctx.fillRect(0, horizonY, gameWidth, gameHeight - horizonY);

        // 3. Road Projection
        const roadTopWidth = gameWidth * TRACK_TOP_WIDTH_RATIO;
        const roadBottomWidth = gameWidth * TRACK_BOTTOM_WIDTH_RATIO;
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo((gameWidth / 2) - (roadBottomWidth / 2), gameHeight);
        ctx.lineTo((gameWidth / 2) - (roadTopWidth / 2) + roadCurvature, horizonY);
        ctx.lineTo((gameWidth / 2) + (roadTopWidth / 2) + roadCurvature, horizonY);
        ctx.lineTo((gameWidth / 2) + (roadBottomWidth / 2), gameHeight);
        ctx.fill();

        // 4. Update & Draw Road Lines
        stateRef.current.roadLines.forEach(line => {
            line.y += stateRef.current.speed;
            
            // Loop lines
            if (line.y > gameHeight) {
                line.y = horizonY;
            }

            const p = (line.y - horizonY) / (gameHeight - horizonY);
            if (p < 0 || p > 1) return;

            const currentRoadWidth = (gameWidth * TRACK_TOP_WIDTH_RATIO) + 
                                   (gameWidth * (TRACK_BOTTOM_WIDTH_RATIO - TRACK_TOP_WIDTH_RATIO) * p);
            
            const curveOffset = roadCurvature * (1 - p);
            const lineW = 15 * p;
            const lineH = 50 * p;

            // Center markings
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            const centerX = (gameWidth / 2) + curveOffset;
            ctx.fillRect(centerX - lineW/2, line.y, lineW, lineH);

            // Curbs (Red/White)
            const segment = Math.floor(Date.now() / 200) % 2;
            const isRed = Math.floor((line.y / 100) % 2) === segment;
            
            ctx.fillStyle = isRed ? '#ef4444' : '#ffffff';
            // Left Curb
            ctx.fillRect(centerX - (currentRoadWidth * 0.25) - (lineW * 2), line.y, lineW * 2, lineH);
            // Right Curb
            ctx.fillRect(centerX + (currentRoadWidth * 0.25), line.y, lineW * 2, lineH);
        });

        // 5. Update & Draw Objects
        const allObjects = [
          ...stateRef.current.obstacles, 
          ...stateRef.current.coinsList,
          ...stateRef.current.scenery
        ];

        // Sort by Y for painters algorithm (draw back to front)
        allObjects.sort((a, b) => a.y - b.y);

        allObjects.forEach(obj => {
          // Update position
          obj.y += stateRef.current.speed;

          const proj = getProjection(obj, horizonY);
          if (proj) {
            if (obj.type === 'obstacle') {
               // Draw Enemy Car
               const w = proj.width;
               const h = proj.height;
               ctx.fillStyle = obj.color;
               // Simple blocky car
               ctx.fillRect(proj.x - w/2, proj.y, w, h);
               // Tail lights
               ctx.fillStyle = '#ff0000';
               ctx.fillRect(proj.x - w/2 + 2, proj.y + h - 5, w/3, 5);
               ctx.fillRect(proj.x + w/2 - w/3 - 2, proj.y + h - 5, w/3, 5);
            } else if (obj.type === 'coin') {
               const w = proj.width;
               const h = proj.height;
               // Rotating effect
               const rotation = Math.sin(Date.now() / 100) * (w * 0.2);
               
               ctx.fillStyle = '#fbbf24'; // Amber 400
               ctx.beginPath();
               ctx.ellipse(proj.x, proj.y + h/2, w/2 - Math.abs(rotation), h/2, 0, 0, Math.PI * 2);
               ctx.fill();
               ctx.strokeStyle = '#d97706';
               ctx.lineWidth = 2;
               ctx.stroke();
               
               ctx.fillStyle = '#fff';
               ctx.font = `bold ${Math.floor(h*0.6)}px Arial`;
               ctx.textAlign = 'center';
               ctx.textBaseline = 'middle';
               ctx.fillText('$', proj.x, proj.y + h/2);

            } else if (obj.type === 'scenery') {
               // Draw bleachers/buildings
               ctx.fillStyle = '#3f3f46';
               ctx.fillRect(proj.x - proj.width/2, proj.y, proj.width, proj.height);
               // Lights
               for(let i=0; i<5; i++) {
                 ctx.fillStyle = Math.random() > 0.5 ? '#ffff00' : '#ffffff';
                 ctx.fillRect(proj.x - proj.width/2 + (i * proj.width/5), proj.y + 10, 5, 5);
               }
            }
          }
        });

        // 6. Player
        const player = drawPlayer();

        // 7. Logic Updates
        
        // Spawn Obstacles
        if (Math.random() < 0.02 && stateRef.current.obstacles.length < 5) {
            const lane = (Math.random() * 4) - 2; // -2 to 2
            stateRef.current.obstacles.push({
                x: lane,
                y: horizonY - 50,
                initialWidth: 80,
                initialHeight: 40,
                color: ['#2563eb', '#db2777', '#9333ea'][Math.floor(Math.random()*3)],
                type: 'obstacle'
            });
        }

        // Spawn Coins
        if (Math.random() < 0.03) {
            const lane = (Math.random() * 4) - 2;
            stateRef.current.coinsList.push({
                x: lane,
                y: horizonY - 50,
                initialWidth: 40,
                initialHeight: 40,
                color: 'gold',
                type: 'coin'
            });
        }

        // Cleanup
        stateRef.current.obstacles = stateRef.current.obstacles.filter(o => o.y < gameHeight + 100);
        stateRef.current.coinsList = stateRef.current.coinsList.filter(o => o.y < gameHeight + 100);
        stateRef.current.scenery.forEach(s => {
             if (s.y > gameHeight + 200) s.y = horizonY - 200;
        });

        // Collision Detection
        const hitBoxPadding = 20;
        
        // Check Enemy Collisions
        for (const obs of stateRef.current.obstacles) {
            const proj = getProjection(obs, horizonY);
            if (proj && proj.y > player.y - 20 && proj.y < player.y + 20) {
                 const obsLeft = proj.x - proj.width/2;
                 const obsRight = proj.x + proj.width/2;
                 const playerLeft = player.x - player.width/2 + hitBoxPadding;
                 const playerRight = player.x + player.width/2 - hitBoxPadding;

                 if (playerRight > obsLeft && playerLeft < obsRight) {
                     onGameOver(Math.floor(stateRef.current.score), stateRef.current.coins);
                     return; // Stop rendering
                 }
            }
        }

        // Check Coin Collisions
        for (let i = stateRef.current.coinsList.length - 1; i >= 0; i--) {
            const coin = stateRef.current.coinsList[i];
            const proj = getProjection(coin, horizonY);
            if (proj && proj.y > player.y - 30 && proj.y < player.y + 30) {
                 const coinLeft = proj.x - proj.width/2;
                 const coinRight = proj.x + proj.width/2;
                 const playerLeft = player.x - player.width/2;
                 const playerRight = player.x + player.width/2;

                 if (playerRight > coinLeft && playerLeft < coinRight) {
                     stateRef.current.coins++;
                     stateRef.current.score += 50;
                     stateRef.current.coinsList.splice(i, 1);
                 }
            }
        }

        // Move Car based on input
        if (stateRef.current.keys['ArrowLeft'] || stateRef.current.keys['a']) {
            stateRef.current.carX -= 0.05;
        }
        if (stateRef.current.keys['ArrowRight'] || stateRef.current.keys['d']) {
            stateRef.current.carX += 0.05;
        }

        // Update Curve
        stateRef.current.curveTimer--;
        if (stateRef.current.curveTimer <= 0) {
            stateRef.current.curveTimer = Math.random() * 200 + 100;
            stateRef.current.curveDirection = Math.random() > 0.5 ? 1 : -1;
        }
        const targetCurve = stateRef.current.curveDirection * 200;
        stateRef.current.roadCurvature += (targetCurve - stateRef.current.roadCurvature) * 0.01;
        
        // Centrifugal force on car
        stateRef.current.carX -= stateRef.current.roadCurvature * 0.0001;

        // Score
        stateRef.current.score += 0.5;
        
        // Report stats to UI (throttled inside react state usually, but calling here is fine for this scale)
        if (Math.floor(stateRef.current.score) % 10 === 0) {
          onScoreUpdate(Math.floor(stateRef.current.score), stateRef.current.coins);
        }

        requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, gameWidth, gameHeight, onGameOver, onScoreUpdate]);

  return (
    <canvas 
      ref={canvasRef}
      width={gameWidth}
      height={gameHeight}
      className="block w-full h-full"
    />
  );
};
