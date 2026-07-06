export type Place = {
  id: string;
  name: string;
  district: string;
  region: string;
  type: string;
  lat: number;
  lng: number;
  entryFee: number;
  duration: number;
  rating: number;
  image: string;
  description: string;
  famous: string;
  bestTime: string;
};

export type Holiday = {
  date: string;
  name: string;
  type: string;
};
