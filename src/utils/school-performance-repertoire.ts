import { getSchoolPerformancePiece, type SchoolPerformancePiece } from '../data/school-performance-repertoire';
import { withBase } from './path';

export function schoolPerformancePieceHref(piece: SchoolPerformancePiece | string): string {
  const slug = typeof piece === 'string' ? piece : piece.slug;
  return withBase(`/education/school/${slug}/`);
}

export { getSchoolPerformancePiece };
