import React, { useState, useEffect } from 'react';
import { GameEngine } from './components/GameEngine';
import { Leaderboard } from './components/Leaderboard';
import { Button } from './components/Button';
import { leaderboardService } from './services/storageService';
import { GameState } from './types';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [highScores, setHighScores] = useState(leaderboardService.getAll());

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startGame = () => {
    if (!playerName.trim()) {
      alert("Por favor, digite o nome do piloto!");
      return;
    }
    setScore(0);
    setCoins(0);
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (finalScore: number, finalCoins: number) => {
    setGameState(GameState.GAME_OVER);
    const updatedScores = leaderboardService.addScore(playerName, finalScore + (finalCoins * 50));
    setHighScores(updatedScores);
  };

  const returnToMenu = () => {
    setGameState(GameState.MENU);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      
      {/* BACKGROUND GAME LAYER */}
      <div className="absolute inset-0 z-0 opacity-100">
        <GameEngine 
          gameState={gameState}
          onGameOver={handleGameOver}
          onScoreUpdate={(s, c) => {
             // Only update React state occasionally to prevent stutter
             // Here we might just trust the game over state for final score
             // But for HUD we need updates. 
             // We can optimize this by only setting state if it changes significantly or using a ref for the HUD
             setScore(s);
             setCoins(c);
          }}
          gameWidth={dimensions.width}
          gameHeight={dimensions.height}
        />
      </div>

      {/* UI OVERLAY LAYER */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* HUD (Only visible during gameplay) */}
        {gameState === GameState.PLAYING && (
          <div className="flex justify-between items-start animate-fade-in">
            <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl border border-gray-700">
              <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">Score</div>
              <div className="text-white text-2xl font-mono">{score}</div>
            </div>
            <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl border border-yellow-700">
              <div className="text-yellow-500 text-xs font-bold uppercase tracking-widest">Coins</div>
              <div className="text-yellow-400 text-2xl font-mono">$ {coins}</div>
            </div>
          </div>
        )}
      </div>

      {/* MENU SCREEN */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="max-w-md w-full flex flex-col gap-6 items-center my-auto">
            
            {/* Logo */}
            <div className="text-center mb-2">
              <h1 className="font-retro text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                F1 RUSH
              </h1>
              <p className="text-gray-400 tracking-[0.3em] text-sm mt-2 font-bold">3D RACING EXPERIENCE</p>
            </div>

            {/* Input Form */}
            <div className="w-full bg-hero-surface p-6 rounded-2xl border border-gray-800 shadow-2xl">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Nome do Piloto</label>
              <input 
                type="text" 
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                placeholder="DIGITE SEU NOME"
                maxLength={10}
                className="w-full bg-black/50 border-2 border-gray-700 focus:border-hero-primary rounded-xl p-4 text-center text-white font-mono text-xl outline-none transition-all mb-4"
              />
              <Button onClick={startGame} fullWidth className="animate-pulse-fast">
                INICIAR CORRIDA
              </Button>
            </div>

            {/* Leaderboard */}
            <Leaderboard scores={highScores} />

            {/* Footer */}
            <div className="text-white/30 text-[10px] font-mono uppercase tracking-widest pb-4">
              Created by Victor Rocha
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="max-w-md w-full bg-hero-surface border border-red-900/50 p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-orange-600"></div>
            
            <h2 className="text-4xl font-black text-white mb-2 italic">FIM DE JOGO</h2>
            <p className="text-gray-400 text-sm mb-8">QUEBRA DE MOTOR NA VOLTA FINAL</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-black/40 p-4 rounded-xl">
                <div className="text-xs text-gray-500 uppercase">Pontos</div>
                <div className="text-3xl text-white font-mono">{score}</div>
              </div>
              <div className="bg-black/40 p-4 rounded-xl border border-yellow-900/30">
                <div className="text-xs text-yellow-600 uppercase">Bônus Ouro</div>
                <div className="text-3xl text-yellow-500 font-mono">+{coins * 50}</div>
              </div>
            </div>

            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-8">
              {(score + (coins * 50)).toLocaleString()}
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={startGame} variant="primary" fullWidth>
                CORRER NOVAMENTE
              </Button>
              <Button onClick={returnToMenu} variant="secondary" fullWidth>
                MENU PRINCIPAL
              </Button>
            </div>
          </div>
          
          <div className="mt-8 text-white/20 text-[10px] font-mono uppercase tracking-widest">
            Created by Victor Rocha
          </div>
        </div>
      )}
    </div>
  );
}

export default App;