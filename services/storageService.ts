import { ScoreEntry } from '../types';
import { STORAGE_KEY, MAX_LEADERBOARD_ENTRIES } from '../constants';

// Simulating a database connection and query execution
const getDB = (): ScoreEntry[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Database read error", e);
    return [];
  }
};

const saveDB = (data: ScoreEntry[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Database write error", e);
  }
};

export const leaderboardService = {
  getAll: (): ScoreEntry[] => {
    return getDB().sort((a, b) => b.score - a.score);
  },

  addScore: (name: string, score: number): ScoreEntry[] => {
    const db = getDB();
    const newEntry: ScoreEntry = {
      id: crypto.randomUUID(),
      name: name.toUpperCase().substring(0, 10) || "PILOTO",
      score,
      date: new Date().toISOString()
    };
    
    db.push(newEntry);
    
    // Sort and limit
    const updated = db
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_LEADERBOARD_ENTRIES);
      
    saveDB(updated);
    return updated;
  }
};
