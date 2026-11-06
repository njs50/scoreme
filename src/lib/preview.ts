/** "branch · abc1234" for preview builds; empty for production, which sets neither. */
export function previewLabel(ref: string, sha: string): string {
	return ref && sha ? `${ref} · ${sha.slice(0, 7)}` : '';
}
