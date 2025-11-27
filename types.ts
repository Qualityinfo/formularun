export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  date: string;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface PlayerState {
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
  positionOnTrack: number; // -1 to 1 (approx)
}

export interface RoadObject {
  x: number; // -2 to 2 typically for lanes
  y: number; // Z-depth essentially
  initialWidth: number;
  initialHeight: number;
  color: string;
  type: 'obstacle' | 'coin' | 'scenery';
}
