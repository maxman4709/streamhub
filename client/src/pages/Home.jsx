import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, isEmbeddable } from '../api';
import CreatorCarousel from '../components/CreatorCarousel';
import TagFilters from '../components/TagFilters';
import VideoCard from '../components/VideoCard';
import { placeholderAvatar } from '../components/CreatorCarousel';

/* ── Hero banner (featured first video) ── */
function HeroCard({ video }) {
  const external = !isEmbeddable(video.videoUrl);
  const watchTo = external
    ? { href: video.videoUrl, target: '_blank', rel: 'noopener noreferrer' }
    : `/watch/${video.id}`;
  const WatchComp = external ? 'a' : Link;

  return (
    <div className="hero-card">
      <div
        className="hero-bg"
        style={{ backgroundImage: `url(${video.thumbnail || placeholderAvatar(video.title)})` }}
      />
      <div className="hero-overlay" />
      <div className="hero-content">
        {video.category && <span className="hero-tag">{video.category.name}</span>}
        <h2 className="hero-title">{video.title}</h2>
        {video.description && (
          <p className="hero-desc">{video.description.slice(0, 140)}{video.description.length > 140 ? '…' : ''}</p>
        )}
        <div className="hero-actions">
          <WatchComp to={watchTo} href={watchTo} className="hero-play-btn">
            ▶ Watch Now
          </WatchComp>
          {video.creator && (
            <Link to={`/channel/${video.creator.id}`} className="hero-channel-btn">
              {video.creator.name}
            </Link>
          )}
        </div>
        {video.duration && <span className="hero-duration">{video.duration}</span>}
      </div>
      <div className="hero-thumb">
        <img
          src={video.thumbnail || placeholderAvatar(video.title)}
          alt={video.title}
        />
      </div>
    </div>
  );
}

/* ── Search with suggestions ── */
function SearchBar({ value, onChange, suggestions, onPick }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const shown = open && value.length >= 1 ? suggestions : [];

  return (
    <div className="search-wrap" ref={wrapRef}>
      <input
        className="search-input"
        placeholder="Search videos, cast, tags…"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {shown.length > 0 && (
        <ul className="search-sugg-list">
          {shown.map((item) => (
            <li
              key={item.label + item.type}
              className="search-sugg-item"
              onMouseDown={(e) => { e.preventDefault(); onPick(item.label); setOpen(false); }}
            >
              <span className={`sugg-type sugg-type--${item.type}`}>
                {item.type === 'video' ? '▶' : item.type === 'person' ? '♟' : '#'}
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Main page ── */
export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState([]);
  const [creators, setCreators] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);  // for search suggestions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const activeTag      = searchParams.get('tag');
  const activeCreator  = searchParams.get('creator');
  const activeCategory = searchParams.get('category');
  const noFilters = !search && !activeTag && !activeCreator && !activeCategory;

  // fetch lists used in filters + suggestions
  useEffect(() => {
    api.getCreators().then(setCreators).catch(() => {});
    api.getCategories().then(setCategories).catch(() => {});
    // fetch all videos once for suggestion data
    api.getVideos().then((all) => {
      const map = new Map();
      all.forEach((v) => {
        map.set('v_' + v.id, { label: v.title, type: 'video' });
        v.cast.forEach((p) => map.set('p_' + p.id, { label: p.name, type: 'person' }));
        v.tags.forEach((t) => map.set('t_' + t, { label: t, type: 'tag' }));
      });
      setAllItems([...map.values()]);
    }).catch(() => {});
  }, []);

  // main video list (filtered)
  useEffect(() => {
    setLoading(true);
    setError('');
    const params = {};
    if (activeTag)      params.tag      = activeTag;
    if (activeCreator)  params.creator  = activeCreator;
    if (activeCategory) params.category = activeCategory;
    if (search)         params.q        = search;

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

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allItems.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 8);
  }, [search, allItems]);

  function selectTag(tag) {
    const next = new URLSearchParams(searchParams);
    if (tag) next.set('tag', tag); else next.delete('tag');
    setSearchParams(next);
  }

  function clearFilter(key) {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
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

  const gridVideos = noFilters && videos.length > 1 ? videos.slice(1) : videos;
  const heroVideo  = noFilters && videos.length > 0  ? videos[0] : null;

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title"><span>Home</span></h1>
        <div className="topbar-actions">
          <SearchBar
            value={search}
            onChange={setSearch}
            suggestions={suggestions}
            onPick={(label) => setSearch(label)}
          />
        </div>
      </div>

      <CreatorCarousel creators={creators} />
      <TagFilters tags={allTags} active={activeTag} onSelect={selectTag} />

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
        <p className="empty-state">Loading…</p>
      ) : videos.length === 0 ? (
        <p className="empty-state">No videos match your filters yet.</p>
      ) : (
        <>
          {heroVideo && <HeroCard video={heroVideo} />}

          {gridVideos.length > 0 && (
            <>
              <h3 className="section-title">
                <span className="section-title-icon">▶</span>
                {noFilters ? 'Trending Now' : 'Results'}
              </h3>
              <div className="video-grid">
                {gridVideos.map((v, i) => (
                  <div key={v.id} style={{ animationDelay: `${i * 0.05}s` }}>
                    <VideoCard video={v} />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
