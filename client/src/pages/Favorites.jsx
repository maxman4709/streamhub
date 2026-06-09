import { useEffect, useState } from 'react';
import { api, likedVideos } from '../api';
import VideoCard from '../components/VideoCard';

export default function Favorites() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = likedVideos.all();
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    api.getVideos()
      .then((all) => setVideos(all.filter((v) => ids.includes(String(v.id)))))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title"><span>Favorites</span></h1>
      </div>

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : videos.length === 0 ? (
        <p className="empty-state">No liked videos yet. Hit ♥ on any video to save it here.</p>
      ) : (
        <div className="video-grid">
          {videos.map((v) => <VideoCard key={v.id} video={v} />)}
        </div>
      )}
    </div>
  );
}
