import React from 'react';
import { ScoreEntry } from '../types';

interface LeaderboardProps {
  scores: ScoreEntry[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ scores }) => {
  return (
    <div className="w-full max-w-md bg-hero-surface/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-2xl">
      <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4 text-center tracking-wider">
        TOP PILOTOS
      </h3>
      
      {scores.length === 0 ? (
        <div className="text-center text-gray-500 py-4 italic">
          Nenhum registro encontrado.
        </div>
      ) : (
        <div className="space-y-2">
          {scores.map((entry, index) => (
            <div 
              key={entry.id} 
              className={`flex justify-between items-center p-3 rounded-lg border ${
                index === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 
                index === 1 ? 'bg-gray-400/10 border-gray-400/30' : 
                index === 2 ? 'bg-orange-700/10 border-orange-700/30' : 
                'bg-gray-800/30 border-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`font-mono font-bold text-lg w-6 ${
                   index === 0 ? 'text-yellow-400' : 
                   index === 1 ? 'text-gray-300' : 
                   index === 2 ? 'text-orange-400' : 
                   'text-gray-600'
                }`}>
                  #{index + 1}
                </span>
                <span className="text-gray-200 font-medium truncate max-w-[120px]">
                  {entry.name}
                </span>
              </div>
              <span className="text-hero-primary font-mono font-bold">
                {entry.score.toLocaleString()} PTS
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
