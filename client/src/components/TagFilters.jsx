export default function TagFilters({ tags, active, onSelect }) {
  return (
    <div className="pill-row">
      <button className={`pill${!active ? ' active' : ''}`} onClick={() => onSelect(null)}>
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          className={`pill${active === tag ? ' active' : ''}`}
          onClick={() => onSelect(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
