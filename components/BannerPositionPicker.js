'use client';

// Shows the banner image in the same 16:9 crop it'll appear in on the public
// profile, with a slider to move the vertical focus point (0 = show the top
// of the image, 100 = show the bottom) so a face or logo doesn't get cut off.
// `value` / `onChange` carry just the vertical percentage (0-100); horizontal
// stays centered, which covers the vast majority of real cover photos.
export default function BannerPositionPicker({ src, value, onChange }) {
  if (!src) return null;
  const vPercent = value ?? 50;

  return (
    <div style={{ marginTop: 10, marginBottom: 4 }}>
      <div style={{
        width: '100%', aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden',
        border: '1.5px solid var(--line-strong)', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${src})`, backgroundSize: 'cover',
          backgroundPosition: `center ${vPercent}%`,
        }} />
      </div>
      <label style={{ fontSize: 12, marginTop: 6, display: 'block' }}>Adjust position (move up/down so nothing important gets cropped)</label>
      <input
        type="range" min="0" max="100" value={vPercent}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}
