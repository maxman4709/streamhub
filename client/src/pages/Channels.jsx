import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { placeholderAvatar } from '../components/CreatorCarousel';


export default function Channels() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getCreators()
      .then(setCreators)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title"><span>Channels</span></h1>
      </div>

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : creators.length === 0 ? (
        <p className="empty-state">No channels yet.</p>
      ) : (
        <div className="browse-grid">
          {creators.map((c, i) => (
            <div
              key={c.id}
              className="browse-card"
              style={{ animationDelay: `${i * 0.06}s` }}
              onClick={() => navigate(`/channel/${c.id}`)}
            >
              <img
                className="browse-card-img"
                src={c.avatar || placeholderAvatar(c.name)}
                alt={c.name}
              />
              <div className="browse-card-body">
                <div className="browse-card-name">
                  {c.name}
                  {c.verified ? ' ✓' : ''}
                </div>
                <div className="browse-card-sub">Channel</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
