import morpheusMap from './morpheus.map.json';

export async function fetchInitial() {
  return morpheusMap.filter((m) => m.type === 'GameState').map((g) => g.data);
}

export function lint() {}
