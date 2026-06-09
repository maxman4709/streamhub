import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatViews, timeAgo, isEmbeddable, likedVideos } from '../api';
import { placeholderAvatar } from './CreatorCarousel';

export default function VideoCard({ video }) {
  const external = !isEmbeddable(video.videoUrl);
  const watchTo = external
    ? { href: video.videoUrl, target: '_blank', rel: 'noopener noreferrer' }
    : { to: `/watch/${video.id}` };
  const WatchLink = external ? 'a' : Link;

  const [liked, setLiked] = useState(() => likedVideos.has(video.id));

  function toggleLike(e) {
    e.preventDefault();
    e.stopPropagation();
    setLiked(likedVideos.toggle(video.id));
  }

  return (
    <div className="video-card">
      <WatchLink {...watchTo} className="thumb-link">
        <div className="thumb-wrap">
          <img src={video.thumbnail || placeholderAvatar(video.title)} alt={video.title} loading="lazy" />
          <div className="thumb-gradient" />
        </div>
      </WatchLink>

      <div className="video-card-body">
        <div className="card-top-row">
          {video.duration && <span className="card-duration">{video.duration}</span>}
          <WatchLink {...watchTo} className="video-title-link">
            <p className="video-title">{video.title}</p>
          </WatchLink>
        </div>

        <div className="video-meta">
          {video.creator && (
            <Link to={`/channel/${video.creator.id}`}>
              <img
                className="creator-avatar"
                src={video.creator.avatar || placeholderAvatar(video.creator.name)}
                alt={video.creator.name}
              />
            </Link>
          )}
          <div className="video-info">
            {video.creator && (
              <Link to={`/channel/${video.creator.id}`} className="video-creator-name">
                {video.creator.name}
              </Link>
            )}
            {video.cast.length > 0 && (
              <div className="video-cast-links">
                {video.cast.map((p, i) => (
                  <span key={p.id}>
                    <Link to={`/actor/${p.id}`}>{p.name}</Link>
                    {i < video.cast.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}
            <div className="video-stats">
              <span>{formatViews(video.views)} views</span>
              <span className="dot">{timeAgo(video.createdAt)}</span>
            </div>
          </div>
          <button
            className={`like-pill ${liked ? 'active' : ''}`}
            onClick={toggleLike}
            title={liked ? 'Unlike' : 'Like'}
          >
            {liked ? '♥' : '♡'}
          </button>
        </div>
      </div>
    </div>
  );
}
