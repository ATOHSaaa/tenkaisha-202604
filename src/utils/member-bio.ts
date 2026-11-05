/** bio 内の改行（`\n`）で段落に分割 */
export function memberBioParagraphs(bio: string): string[] {
  return bio
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** meta description など1行用 */
export function memberBioPlainText(bio: string): string {
  return memberBioParagraphs(bio).join('');
}
