import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatViews, timeAgo, isDirectMediaUrl, isStreamtapeUrl, getStreamtapeEmbedUrl } from '../api';
import { placeholderAvatar } from '../components/CreatorCarousel';

export default function Watch() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const viewCounted = useRef(false);

  useEffect(() => {
    setVideo(null);
    setError('');
    setLiked(false);
    viewCounted.current = false;
    api.getVideo(id).then(setVideo).catch((e) => setError(e.message));
  }, [id]);

  function handlePlay() {
    if (viewCounted.current) return;
    viewCounted.current = true;
    api.registerView(id).then(setVideo).catch(() => {});
  }

  function toggleLike() {
    setLiked((prev) => !prev);
    setVideo((prev) => prev && { ...prev, likes: prev.likes + (liked ? -1 : 1) });
  }

  if (error) return <p className="banner error">{error}</p>;
  if (!video) return <p className="empty-state">Loading…</p>;

  return (
    <div className="watch-layout">
      <div className="player-wrap">
        {isStreamtapeUrl(video.videoUrl) ? (
          <iframe
            src={getStreamtapeEmbedUrl(video.videoUrl)}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            allowFullScreen
            onLoad={handlePlay}
          />
        ) : isDirectMediaUrl(video.videoUrl) ? (
          <video controls poster={video.thumbnail} onPlay={handlePlay} src={video.videoUrl} />
        ) : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:16 }}>
            <img src={video.thumbnail} alt={video.title} style={{ maxHeight:200, borderRadius:10, objectFit:'cover' }} />
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              onClick={handlePlay}
            >
              ▶ Watch on source site
            </a>
          </div>
        )}
      </div>

      <h1 className="watch-title">{video.title}</h1>

      <div className="watch-creator-row">
        {video.creator && (
          <Link to={`/?creator=${video.creator.id}`} className="watch-creator">
            <img
              className="creator-avatar"
              src={video.creator.avatar || placeholderAvatar(video.creator.name)}
              alt={video.creator.name}
            />
            <div>
              <div>{video.creator.name}{video.creator.verified ? ' ✓' : ''}</div>
              <div className="watch-stats">{formatViews(video.views)} views · {timeAgo(video.createdAt)}</div>
            </div>
          </Link>
        )}
        <button className="like-btn" onClick={toggleLike}>
          {liked ? '♥' : '♡'} {formatViews(video.likes)}
        </button>
      </div>

      {video.description && <p className="watch-description">{video.description}</p>}

      {video.category && (
        <div className="meta-row">
          <span className="meta-label">Category</span>
          <Link to={`/?category=${video.category.id}`} className="tag-chip category-chip">{video.category.name}</Link>
        </div>
      )}

      {video.cast.length > 0 && (
        <div className="meta-row">
          <span className="meta-label">Cast</span>
          <div className="cast-list">
            {video.cast.map((person) => (
              <Link key={person.id} to={`/actor/${person.id}`} className="cast-chip">
                <img src={person.photo || placeholderAvatar(person.name)} alt={person.name} />
                {person.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {video.tags.length > 0 && (
        <div className="tag-list">
          {video.tags.map((tag) => (
            <Link key={tag} to={`/?tag=${encodeURIComponent(tag)}`} className="tag-chip">#{tag}</Link>
          ))}
        </div>
      )}
    </div>
  );
}
