import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatViews, timeAgo, isDirectMediaUrl, likedVideos, savedVideos, watchLaterVideos } from '../api';
import { placeholderAvatar } from './CreatorCarousel';

export default function VideoCard({ video }) {
  const external = !isDirectMediaUrl(video.videoUrl);
  const watchTo = external
    ? { href: video.videoUrl, target: '_blank', rel: 'noopener noreferrer' }
    : { to: `/watch/${video.id}` };
  const WatchLink = external ? 'a' : Link;

  const [liked, setLiked] = useState(() => likedVideos.has(video.id));
  const [saved, setSaved] = useState(() => savedVideos.has(video.id));
  const [watchLater, setWatchLater] = useState(() => watchLaterVideos.has(video.id));

  function action(e, store, setter) {
    e.preventDefault();
    e.stopPropagation();
    setter(store.toggle(video.id));
  }

  return (
    <div className="video-card">
      <WatchLink {...watchTo} className="thumb-link">
        <div className="thumb-wrap">
          <img src={video.thumbnail || placeholderAvatar(video.title)} alt={video.title} loading="lazy" />
          <div className="thumb-gradient" />
          {video.duration && <span className="duration-badge">{video.duration}</span>}
        </div>
      </WatchLink>

      <div className="video-card-body">
        <WatchLink {...watchTo}>
          <p className="video-title">{video.title}</p>
        </WatchLink>

        <div className="card-actions">
          <button
            className={`card-action-btn ${liked ? 'active' : ''}`}
            onClick={(e) => action(e, likedVideos, setLiked)}
          >
            {liked ? '♥' : '♡'} Like
          </button>
          <button
            className={`card-action-btn ${saved ? 'active' : ''}`}
            onClick={(e) => action(e, savedVideos, setSaved)}
          >
            {saved ? '★' : '☆'} Save
          </button>
          <button
            className={`card-action-btn ${watchLater ? 'active' : ''}`}
            onClick={(e) => action(e, watchLaterVideos, setWatchLater)}
          >
            {watchLater ? '✓' : '+'} Later
          </button>
        </div>

        <div className="video-meta">
          {video.creator && (
            <Link to={`/?creator=${video.creator.id}`}>
              <img
                className="creator-avatar"
                src={video.creator.avatar || placeholderAvatar(video.creator.name)}
                alt={video.creator.name}
              />
            </Link>
          )}
          <div className="video-info">
            {video.creator && (
              <Link to={`/?creator=${video.creator.id}`} className="video-creator-name">
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
              <span>♥ {formatViews(video.likes)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
