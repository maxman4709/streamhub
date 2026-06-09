import { useEffect, useRef, useState } from 'react';

// Free-text input with a name-suggestion dropdown. In `multi` mode the value is
// a comma-separated list (e.g. cast names) and suggestions filter/replace the
// last (currently-typed) entry; otherwise the whole value is replaced.
export default function SuggestInput({ value, onChange, options, multi = false, placeholder }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const token = (multi ? value.split(',').pop() : value).trim().toLowerCase();
  const matches = token
    ? options.filter((o) => o.toLowerCase().includes(token) && o.toLowerCase() !== token).slice(0, 6)
    : [];

  function pick(name) {
    if (multi) {
      const parts = value.split(',');
      parts[parts.length - 1] = ` ${name}`;
      onChange(parts.map((p) => p.trim()).filter(Boolean).join(', ') + ', ');
    } else {
      onChange(name);
    }
    setOpen(false);
  }

  return (
    <div className="suggest-wrap" ref={wrapRef}>
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
      />
      {open && matches.length > 0 && (
        <ul className="suggest-list">
          {matches.map((name) => (
            <li key={name} onMouseDown={(e) => { e.preventDefault(); pick(name); }}>{name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
