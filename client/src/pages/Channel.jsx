import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { placeholderAvatar } from '../components/CreatorCarousel';
import VideoCard from '../components/VideoCard';

export default function Channel() {
  const { id } = useParams();
  const [creator, setCreator] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setCreator(null);
    setVideos([]);
    setError('');
    setLoading(true);
    Promise.all([api.getCreators(), api.getVideos({ creator: id })])
      .then(([creators, vids]) => {
        setCreator(creators.find((c) => String(c.id) === id) || null);
        setVideos(vids);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (error) return <p className="banner error">{error}</p>;
  if (loading) return <p className="empty-state">Loading…</p>;
  if (!creator) return <p className="banner error">Channel not found.</p>;

  return (
    <div>
      <div className="channel-header">
        <div className="channel-avatar-wrap">
          <img
            className="channel-avatar"
            src={creator.avatar || placeholderAvatar(creator.name)}
            alt={creator.name}
          />
          {creator.verified && <span className="channel-verified">✓</span>}
        </div>
        <div className="channel-info">
          <h1 className="channel-name">{creator.name}</h1>
          <p className="channel-sub">{videos.length} video{videos.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {videos.length === 0 ? (
        <p className="empty-state">No videos for this channel yet.</p>
      ) : (
        <div className="video-grid">
          {videos.map((v, i) => (
            <div key={v.id} style={{ animationDelay: `${i * 0.05}s` }}>
              <VideoCard video={v} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
