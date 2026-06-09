import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import SuggestInput from '../components/SuggestInput';

const EMPTY_VIDEO = {
  id: null,
  title: '',
  videoUrl: '',
  thumbnail: '',
  description: '',
  duration: '',
  durationH: '',
  durationM: '',
  durationS: '',
  creatorName: '',
  categoryId: '',
  cast: '',
  tags: '',
};

function parseDuration(str) {
  if (!str) return { h: '', m: '', s: '' };
  const parts = str.split(':').map(Number);
  if (parts.length === 3) return { h: String(parts[0]), m: String(parts[1]).padStart(2,'0'), s: String(parts[2]).padStart(2,'0') };
  if (parts.length === 2) return { h: '', m: String(parts[0]), s: String(parts[1]).padStart(2,'0') };
  return { h: '', m: str, s: '' };
}
function buildDuration(h, m, s) {
  const mm = m || '0';
  const ss = (s || '0').padStart(2, '0');
  if (h) return `${h}:${mm.padStart(2,'0')}:${ss}`;
  if (mm !== '0' || ss !== '00') return `${mm}:${ss}`;
  return '';
}

const EMPTY_CREATOR = { id: null, name: '', avatar: '', verified: false };
const EMPTY_ACTOR = { id: null, name: '', photo: '', bio: '', gender: '' };
const EMPTY_CATEGORY = { id: null, name: '' };

const TABS = [
  { key: 'videos', label: 'Videos' },
  { key: 'creators', label: 'Channels' },
  { key: 'actors', label: 'Cast' },
  { key: 'categories', label: 'Categories' },
];

export default function Admin() {
  const [tab, setTab] = useState('videos');
  return (
    <div className="admin-page">
      <div className="topbar">
        <div className="brand">⚙ Manage Library</div>
      </div>
      <div className="admin-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`admin-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'videos' && <VideosManager />}
      {tab === 'creators' && <CreatorsManager />}
      {tab === 'actors' && <ActorsManager />}
      {tab === 'categories' && <CategoriesManager />}
    </div>
  );
}

function VideosManager() {
  const [videos, setVideos] = useState([]);
  const [creators, setCreators] = useState([]);
  const [actors, setActors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_VIDEO);
  const [message, setMessage] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  function reload() {
    api.getVideos().then(setVideos).catch((e) => setMessage({ type: 'error', text: e.message }));
  }
  function reloadCategories() {
    api.getCategories().then(setCategories).catch(() => {});
  }

  useEffect(() => {
    reload();
    reloadCategories();
    api.getCreators().then(setCreators).catch(() => {});
    api.getActors().then(setActors).catch(() => {});
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEdit(video) {
    const { h, m, s } = parseDuration(video.duration || '');
    setForm({
      id: video.id,
      title: video.title,
      videoUrl: video.videoUrl,
      thumbnail: video.thumbnail || '',
      description: video.description || '',
      duration: video.duration || '',
      durationH: h,
      durationM: m,
      durationS: s,
      creatorName: video.creator ? video.creator.name : '',
      categoryId: video.category ? String(video.category.id) : '',
      cast: video.cast.map((p) => p.name).join(', '),
      tags: video.tags.join(', '),
    });
    setMessage(null);
  }

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      const cat = await api.createCategory({ name });
      setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((prev) => ({ ...prev, categoryId: String(cat.id) }));
      setNewCategoryName('');
      setAddingCategory(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    const payload = {
      title: form.title.trim(),
      videoUrl: form.videoUrl.trim(),
      thumbnail: form.thumbnail.trim(),
      description: form.description.trim(),
      duration: buildDuration(form.durationH, form.durationM, form.durationS),
      creatorName: form.creatorName.trim(),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      cast: form.cast.split(',').map((t) => t.trim()).filter(Boolean),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean).join(','),
    };
    if (!payload.title || !payload.videoUrl) {
      setMessage({ type: 'error', text: 'Title and video link are required.' });
      return;
    }
    try {
      if (form.id) {
        await api.updateVideo(form.id, payload);
        setMessage({ type: 'success', text: 'Video updated.' });
      } else {
        await api.createVideo(payload);
        setMessage({ type: 'success', text: 'Video uploaded.' });
      }
      setForm(EMPTY_VIDEO);
      reload();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this video?')) return;
    try {
      await api.deleteVideo(id);
      reload();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  return (
    <div>
      {message && <div className={`banner ${message.type}`}>{message.text}</div>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="field span-2">
          <label>Title</label>
          <input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Video title" />
        </div>

        <div className="field span-2">
          <label>Video link (URL the player will stream from)</label>
          <input value={form.videoUrl} onChange={(e) => update('videoUrl', e.target.value)} placeholder="https://example.com/video.mp4" />
        </div>

        <div className="field">
          <label>Thumbnail URL</label>
          <input value={form.thumbnail} onChange={(e) => update('thumbnail', e.target.value)} placeholder="https://example.com/poster.jpg" />
        </div>

        <div className="field">
          <label>Duration</label>
          <div className="duration-inputs">
            <div className="dur-box">
              <input
                type="number" min="0" max="23"
                value={form.durationH}
                onChange={(e) => update('durationH', e.target.value)}
                placeholder="0"
              />
              <span className="dur-label">h</span>
            </div>
            <span className="dur-sep">:</span>
            <div className="dur-box">
              <input
                type="number" min="0" max="59"
                value={form.durationM}
                onChange={(e) => update('durationM', e.target.value)}
                placeholder="00"
              />
              <span className="dur-label">m</span>
            </div>
            <span className="dur-sep">:</span>
            <div className="dur-box">
              <input
                type="number" min="0" max="59"
                value={form.durationS}
                onChange={(e) => update('durationS', e.target.value)}
                placeholder="00"
              />
              <span className="dur-label">s</span>
            </div>
          </div>
        </div>

        <div className="field">
          <label>Channel</label>
          <SuggestInput
            value={form.creatorName}
            onChange={(v) => update('creatorName', v)}
            options={creators.map((c) => c.name)}
            placeholder="Type or pick a channel — new ones are added automatically"
          />
        </div>

        <div className="field">
          <label>Category</label>
          {addingCategory ? (
            <div className="inline-add">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                autoFocus
              />
              <button type="button" className="btn btn-secondary" onClick={handleAddCategory}>Add</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setAddingCategory(false); setNewCategoryName(''); }}>✕</button>
            </div>
          ) : (
            <div className="inline-add">
              <select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)}>
                <option value="">— none —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" className="btn btn-secondary" onClick={() => setAddingCategory(true)}>+ New</button>
            </div>
          )}
        </div>

        <div className="field span-2">
          <label>Cast (comma separated names — new names are added automatically)</label>
          <SuggestInput
            value={form.cast}
            onChange={(v) => update('cast', v)}
            options={actors.map((a) => a.name)}
            multi
            placeholder="Alex Morgan, Jordan Blake"
          />
        </div>

        <div className="field span-2">
          <label>Tags (comma separated)</label>
          <input value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="Travel, Nature, Timelapse" />
        </div>

        <div className="field span-2">
          <label>Description</label>
          <textarea rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="What's this video about?" />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">{form.id ? 'Save changes' : 'Upload video'}</button>
          {form.id && (
            <button type="button" className="btn btn-secondary" onClick={() => setForm(EMPTY_VIDEO)}>Cancel edit</button>
          )}
        </div>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Thumbnail</th>
            <th>Title</th>
            <th>Channel</th>
            <th>Category</th>
            <th>Cast</th>
            <th>Views</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {videos.map((v) => (
            <tr key={v.id}>
              <td>{v.thumbnail && <img className="row-thumb" src={v.thumbnail} alt="" />}</td>
              <td>{v.title}</td>
              <td>{v.creator ? <Link className="table-link" to={`/?creator=${v.creator.id}`} target="_blank">{v.creator.name}</Link> : '—'}</td>
              <td>{v.category?.name || '—'}</td>
              <td>
                {v.cast.length > 0
                  ? v.cast.map((p, i) => (
                      <span key={p.id}>
                        <Link className="table-link" to={`/actor/${p.id}`} target="_blank">{p.name}</Link>
                        {i < v.cast.length - 1 ? ', ' : ''}
                      </span>
                    ))
                  : '—'}
              </td>
              <td>{v.views.toLocaleString()}</td>
              <td>
                <div className="row-actions">
                  <button className="btn btn-secondary" onClick={() => startEdit(v)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(v.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {videos.length === 0 && (
            <tr><td colSpan={7} className="empty-state">No videos uploaded yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CreatorsManager() {
  const [creators, setCreators] = useState([]);
  const [form, setForm] = useState(EMPTY_CREATOR);
  const [message, setMessage] = useState(null);

  function reload() {
    api.getCreators().then(setCreators).catch((e) => setMessage({ type: 'error', text: e.message }));
  }

  useEffect(reload, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEdit(creator) {
    setForm({ id: creator.id, name: creator.name, avatar: creator.avatar || '', verified: creator.verified });
    setMessage(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    const payload = { name: form.name.trim(), avatar: form.avatar.trim(), verified: form.verified };
    if (!payload.name) {
      setMessage({ type: 'error', text: 'Name is required.' });
      return;
    }
    try {
      if (form.id) {
        await api.updateCreator(form.id, payload);
        setMessage({ type: 'success', text: 'Channel updated.' });
      } else {
        await api.createCreator(payload);
        setMessage({ type: 'success', text: 'Channel added.' });
      }
      setForm(EMPTY_CREATOR);
      reload();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this channel? Their videos will remain but show no channel.')) return;
    try {
      await api.deleteCreator(id);
      reload();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  return (
    <div>
      {message && <div className={`banner ${message.type}`}>{message.text}</div>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Channel name" />
        </div>
        <div className="field">
          <label>Avatar URL</label>
          <input value={form.avatar} onChange={(e) => update('avatar', e.target.value)} placeholder="https://example.com/avatar.jpg" />
        </div>
        <div className="field">
          <label>
            <input
              type="checkbox"
              checked={form.verified}
              onChange={(e) => update('verified', e.target.checked)}
              style={{ width: 'auto', marginRight: 8 }}
            />
            Verified badge
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">{form.id ? 'Save changes' : 'Add channel'}</button>
          {form.id && (
            <button type="button" className="btn btn-secondary" onClick={() => setForm(EMPTY_CREATOR)}>Cancel edit</button>
          )}
        </div>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Avatar</th>
            <th>Name</th>
            <th>Verified</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {creators.map((c) => (
            <tr key={c.id}>
              <td>{c.avatar && <img className="row-thumb" style={{ width: 50, borderRadius: '50%' }} src={c.avatar} alt="" />}</td>
              <td>{c.name}</td>
              <td>{c.verified ? '✓' : '—'}</td>
              <td>
                <div className="row-actions">
                  <button className="btn btn-secondary" onClick={() => startEdit(c)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(c.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {creators.length === 0 && (
            <tr><td colSpan={4} className="empty-state">No channels yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ActorsManager() {
  const [actors, setActors] = useState([]);
  const [form, setForm] = useState(EMPTY_ACTOR);
  const [message, setMessage] = useState(null);

  function reload() {
    api.getActors().then(setActors).catch((e) => setMessage({ type: 'error', text: e.message }));
  }

  useEffect(reload, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEdit(actor) {
    setForm({ id: actor.id, name: actor.name, photo: actor.photo || '', bio: actor.bio || '', gender: actor.gender || '' });
    setMessage(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    const payload = { name: form.name.trim(), photo: form.photo.trim(), bio: form.bio.trim(), gender: form.gender || null };
    if (!payload.name) {
      setMessage({ type: 'error', text: 'Name is required.' });
      return;
    }
    try {
      if (form.id) {
        await api.updateActor(form.id, payload);
        setMessage({ type: 'success', text: 'Cast member updated.' });
      } else {
        await api.createActor(payload);
        setMessage({ type: 'success', text: 'Cast member added.' });
      }
      setForm(EMPTY_ACTOR);
      reload();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this cast member? They will be unlinked from any videos.')) return;
    try {
      await api.deleteActor(id);
      reload();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  return (
    <div>
      {message && <div className={`banner ${message.type}`}>{message.text}</div>}
      <p className="text-dim" style={{ marginTop: -8 }}>
        Tip: typing a new name in a video's "Cast" field also creates an entry here automatically —
        use this tab to add a profile photo or bio afterwards.
      </p>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Full name" />
        </div>
        <div className="field">
          <label>Gender</label>
          <select value={form.gender} onChange={(e) => update('gender', e.target.value)}>
            <option value="">— unspecified —</option>
            <option value="male">Male (Actor)</option>
            <option value="female">Female (Actress)</option>
          </select>
        </div>
        <div className="field">
          <label>Photo URL</label>
          <input value={form.photo} onChange={(e) => update('photo', e.target.value)} placeholder="https://example.com/photo.jpg" />
        </div>
        <div className="field span-2">
          <label>Bio</label>
          <textarea rows={4} value={form.bio} onChange={(e) => update('bio', e.target.value)} placeholder="Short bio shown on their profile page" />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">{form.id ? 'Save changes' : 'Add cast member'}</button>
          {form.id && (
            <button type="button" className="btn btn-secondary" onClick={() => setForm(EMPTY_ACTOR)}>Cancel edit</button>
          )}
        </div>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Name</th>
            <th>Gender</th>
            <th>Bio</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {actors.map((a) => (
            <tr key={a.id}>
              <td>{a.photo && <img className="row-thumb" style={{ width: 50, borderRadius: '50%' }} src={a.photo} alt="" />}</td>
              <td>{a.name}</td>
              <td>{a.gender === 'male' ? 'Male (Actor)' : a.gender === 'female' ? 'Female (Actress)' : '—'}</td>
              <td style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.bio || '—'}</td>
              <td>
                <div className="row-actions">
                  <button className="btn btn-secondary" onClick={() => startEdit(a)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(a.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {actors.length === 0 && (
            <tr><td colSpan={5} className="empty-state">No cast members yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_CATEGORY);
  const [message, setMessage] = useState(null);

  function reload() {
    api.getCategories().then(setCategories).catch((e) => setMessage({ type: 'error', text: e.message }));
  }

  useEffect(reload, []);

  function startEdit(cat) {
    setForm({ id: cat.id, name: cat.name });
    setMessage(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    const name = form.name.trim();
    if (!name) {
      setMessage({ type: 'error', text: 'Name is required.' });
      return;
    }
    try {
      if (form.id) {
        await api.updateCategory(form.id, { name });
        setMessage({ type: 'success', text: 'Category updated.' });
      } else {
        await api.createCategory({ name });
        setMessage({ type: 'success', text: 'Category added.' });
      }
      setForm(EMPTY_CATEGORY);
      reload();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this category? Videos in it will show no category.')) return;
    try {
      await api.deleteCategory(id);
      reload();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  return (
    <div>
      {message && <div className={`banner ${message.type}`}>{message.text}</div>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="field span-2">
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Documentary" />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">{form.id ? 'Save changes' : 'Add category'}</button>
          {form.id && (
            <button type="button" className="btn btn-secondary" onClick={() => setForm(EMPTY_CATEGORY)}>Cancel edit</button>
          )}
        </div>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>
                <div className="row-actions">
                  <button className="btn btn-secondary" onClick={() => startEdit(c)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(c.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {categories.length === 0 && (
            <tr><td colSpan={2} className="empty-state">No categories yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
