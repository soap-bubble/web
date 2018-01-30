export const isPano = (sceneData) => {
  const { casts } = sceneData;
  return !!(casts.find(c => c.__t === 'PanoCast'));
};

export function forMorpheusType(type) {
  return casts => casts.filter(c => c.__t === type, []);
}
