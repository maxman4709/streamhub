import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { placeholderAvatar } from '../components/CreatorCarousel';
import VideoCard from '../components/VideoCard';

export default function ActorPage() {
  const { id } = useParams();
  const [actor, setActor] = useState(null);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setActor(null);
    setVideos([]);
    setError('');
    Promise.all([api.getActor(id), api.getVideos({ actor: id })])
      .then(([a, v]) => { setActor(a); setVideos(v); })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="banner error">{error}</p>;
  if (!actor) return <p className="empty-state">Loading…</p>;

  return (
    <div>
      <div className="profile-header">
        <img className="profile-photo" src={actor.photo || placeholderAvatar(actor.name)} alt={actor.name} />
        <div>
          <h1 className="profile-name">
            {actor.name}
            {actor.gender === 'male' && <span className="gender-tag">Actor</span>}
            {actor.gender === 'female' && <span className="gender-tag">Actress</span>}
          </h1>
          {actor.bio && <p className="profile-bio">{actor.bio}</p>}
          <p className="text-dim">{videos.length} video{videos.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      {videos.length === 0 ? (
        <p className="empty-state">No videos linked to this person yet.</p>
      ) : (
        <div className="video-grid">
          {videos.map((v) => <VideoCard key={v.id} video={v} />)}
        </div>
      )}
    </div>
  );
}
