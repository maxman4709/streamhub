import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import CreatorCarousel, { placeholderAvatar } from '../components/CreatorCarousel';
import TagFilters from '../components/TagFilters';
import VideoCard from '../components/VideoCard';

function CastRow({ title, people, gender }) {
  if (people.length === 0) return null;
  return (
    <div className={`cast-browse-row cast-row--${gender}`}>
      <h3 className="section-label">{title}</h3>
      <div className="carousel">
        {people.map((p) => (
          <Link key={p.id} to={`/actor/${p.id}`} className="cast-pill">
            <img src={p.photo || placeholderAvatar(p.name)} alt={p.name} />
            <span>{p.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState([]);
  const [creators, setCreators] = useState([]);
  const [categories, setCategories] = useState([]);
  const [actors, setActors] = useState([]);
  const [actresses, setActresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const activeTag = searchParams.get('tag');
  const activeCreator = searchParams.get('creator');
  const activeCategory = searchParams.get('category');

  useEffect(() => {
    api.getCreators().then(setCreators).catch(() => {});
    api.getCategories().then(setCategories).catch(() => {});
    api.getActors({ gender: 'male' }).then(setActors).catch(() => {});
    api.getActors({ gender: 'female' }).then(setActresses).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = {};
    if (activeTag) params.tag = activeTag;
    if (activeCreator) params.creator = activeCreator;
    if (activeCategory) params.category = activeCategory;
    if (search) params.q = search;

    api.getVideos(params)
      .then(setVideos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeTag, activeCreator, activeCategory, search]);

  const allTags = useMemo(() => {
    const set = new Set();
    videos.forEach((v) => v.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [videos]);

  function selectTag(tag) {
    const next = new URLSearchParams(searchParams);
    if (tag) next.set('tag', tag); else next.delete('tag');
    setSearchParams(next);
  }

  const filterChips = [];
  if (activeCategory) {
    const cat = categories.find((c) => String(c.id) === activeCategory);
    filterChips.push(['category', `Category: ${cat ? cat.name : '#' + activeCategory}`]);
  }
  if (activeCreator) {
    const ch = creators.find((c) => String(c.id) === activeCreator);
    filterChips.push(['creator', `Channel: ${ch ? ch.name : '#' + activeCreator}`]);
  }

  function clearFilter(key) {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    setSearchParams(next);
  }

  return (
    <div>
      <div className="topbar">
        <div className="brand">▶ StreamHub</div>
        <div className="topbar-actions">
          <input
            className="search-input"
            placeholder="Search videos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <a className="admin-link" href="/admin">Manage</a>
        </div>
      </div>

      <CreatorCarousel creators={creators} />
      <TagFilters tags={allTags} active={activeTag} onSelect={selectTag} />

      <CastRow title="Actors" people={actors} gender="male" />
      <CastRow title="Actresses" people={actresses} gender="female" />

      {filterChips.length > 0 && (
        <div className="active-filters">
          {filterChips.map(([key, label]) => (
            <button key={key} className="pill active" onClick={() => clearFilter(key)}>
              {label} ✕
            </button>
          ))}
        </div>
      )}

      {error && <div className="banner error">{error}</div>}
      {loading ? (
        <p className="empty-state">Loading videos…</p>
      ) : videos.length === 0 ? (
        <p className="empty-state">No videos match your filters yet.</p>
      ) : (
        <div className="video-grid">
          {videos.map((v) => <VideoCard key={v.id} video={v} />)}
        </div>
      )}
    </div>
  );
}
