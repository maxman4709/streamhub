import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { placeholderAvatar } from '../components/CreatorCarousel';

export default function ActressesBrowse() {
  const [actresses, setActresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getActors({ gender: 'female' })
      .then(setActresses)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title"><span>Actresses</span></h1>
      </div>

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : actresses.length === 0 ? (
        <p className="empty-state">No actresses yet.</p>
      ) : (
        <div className="browse-grid">
          {actresses.map((a, i) => (
            <div
              key={a.id}
              className="browse-card"
              style={{ animationDelay: `${i * 0.06}s` }}
              onClick={() => navigate(`/actor/${a.id}`)}
            >
              <img
                className="browse-card-img"
                src={a.photo || placeholderAvatar(a.name)}
                alt={a.name}
              />
              <div className="browse-card-body">
                <div className="browse-card-name">{a.name}</div>
                <span className="gender-badge gender-badge--female">♀ Actress</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
