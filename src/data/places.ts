export type MarsPlace = {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  source?: string;
  minZoom: number;
};

// The project currently contains verified naming data for Jezero only.
export const marsPlaces: MarsPlace[] = [
  { id: 'jezero-crater', name: 'Cráter Jezero', type: 'Cráter', lat: 18.44, lon: 77.45, source: 'NASA Mars Trek / USGS Astrogeology', minZoom: 1 },
];
