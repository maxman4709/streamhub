import { Link } from 'react-router-dom';

export default function CreatorCarousel({ creators }) {
  if (!creators.length) return null;
  return (
    <div className="carousel">
      {creators.map((c) => (
        <Link key={c.id} to={`/?creator=${c.id}`} className="creator-chip" title={c.name}>
          <img className="creator-avatar" src={c.avatar || placeholderAvatar(c.name)} alt={c.name} />
          <span className="creator-name">{c.name}</span>
        </Link>
      ))}
    </div>
  );
}

export function placeholderAvatar(name) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return `https://placehold.co/96x96/20242b/f2f3f5?text=${encodeURIComponent(initial)}`;
}
