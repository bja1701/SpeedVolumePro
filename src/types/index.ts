export interface CurvePoint {
  id: string;
  speed: number;
  volume: number;
}

export interface Profile {
  id: string;
  name: string;
  curve: CurvePoint[];
  minSpeed: number;
  minVolume: number;
  maxSpeed: number;
  maxVolume: number;
}
