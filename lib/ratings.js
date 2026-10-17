// Kam reviews wali listing par average star nahi dikhate (1-2 nakli rating se score na bigde).
export const MIN_RATINGS_FOR_AVG = 3;

export function ratingLabel(count) {
  return count === 1 ? '1 review' : `${count} reviews`;
}
