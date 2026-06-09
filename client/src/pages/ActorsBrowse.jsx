import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { placeholderAvatar } from '../components/CreatorCarousel';

export default function ActorsBrowse() {
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getActors({ gender: 'male' })
      .then(setActors)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title"><span>Actors</span></h1>
      </div>

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : actors.length === 0 ? (
        <p className="empty-state">No actors yet.</p>
      ) : (
        <div className="browse-grid">
          {actors.map((a, i) => (
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
                <span className="gender-badge gender-badge--male">♂ Actor</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
