import { useEffect, useRef, useState } from 'react';

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

  // show all options when focused with no text, filter when typing
  const matches = open
    ? (token
        ? options.filter((o) => o.toLowerCase().includes(token) && o.toLowerCase() !== token)
        : options
      ).slice(0, 8)
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
