import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { money } from '../../utils/format';
import MenuPdfCard from './MenuPdfCard';
import './menu.css';

const UNIT_LABELS = {
  piece: 'per piece',
  kg: 'per kg',
  gram: 'per gram',
  liter: 'per litre',
  ml: 'per ml',
  dozen: 'per dozen',
  pack: 'per pack',
  box: 'per box',
  bottle: 'per bottle',
  can: 'per can',
  strip: 'per strip',
};

const blankDraft = () => ({
  name: '',
  price: '',
  category: '',
  description: '',
  unit: 'piece',
  discount: '',
});

const MenuPage = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState(Object.keys(UNIT_LABELS));
  const [counts, setCounts] = useState({ total: 0, live: 0, outOfStock: 0 });

  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(null); // { kind, text }
  const [busyId, setBusyId] = useState(null);

  const [showRemoved, setShowRemoved] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(blankDraft);
  const [savingNew, setSavingNew] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(blankDraft);
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async (withRemoved) => {
    try {
      const res = await api.get('/shop-owner/products', {
        params: withRemoved ? { includeHidden: 'true' } : undefined,
      });
      const data = res.data?.data || {};
      setItems(data.items || []);
      setCategories(data.categories || []);
      if (data.units?.length) setUnits(data.units);
      setCounts(data.counts || { total: 0, live: 0, outOfStock: 0 });
    } catch (err) {
      setNote({
        kind: 'error',
        text: err.response?.data?.message || 'Could not load your menu.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetching on mount and whenever the removed-items filter flips: state
    // lands after the request settles, which the set-state-in-effect rule
    // cannot tell apart from a synchronous cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(showRemoved);
  }, [load, showRemoved]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q)
      );
    });
  }, [items, search, categoryFilter]);

  // Rows are grouped by category so a long menu stays readable.
  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of visible) {
      const key = item.category || 'General Items';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [visible]);

  const replaceItem = (next) =>
    setItems((list) => list.map((item) => (item._id === next._id ? next : item)));

  const addItem = async (event) => {
    event.preventDefault();
    setSavingNew(true);
    setNote(null);
    try {
      const res = await api.post('/shop-owner/products', {
        name: draft.name,
        price: draft.price,
        category: draft.category,
        description: draft.description,
        unit: draft.unit,
        discount: draft.discount === '' ? 0 : draft.discount,
      });
      setNote({ kind: 'ok', text: res.data?.message || 'Item added.' });
      setDraft(blankDraft());
      setAdding(false);
      await load(showRemoved);
    } catch (err) {
      setNote({ kind: 'error', text: err.response?.data?.message || 'Could not add that item.' });
    } finally {
      setSavingNew(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditDraft({
      name: item.name,
      price: String(item.price ?? ''),
      category: item.category || '',
      description: item.description || '',
      unit: item.unit || 'piece',
      discount: item.discount ? String(item.discount) : '',
    });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setSavingEdit(true);
    setNote(null);
    try {
      const res = await api.patch(`/shop-owner/products/${editingId}`, {
        name: editDraft.name,
        price: editDraft.price,
        category: editDraft.category,
        description: editDraft.description,
        unit: editDraft.unit,
        discount: editDraft.discount === '' ? 0 : editDraft.discount,
      });
      if (res.data?.data) replaceItem(res.data.data);
      setNote({ kind: 'ok', text: res.data?.message || 'Item updated.' });
      setEditingId(null);
      setCategories((list) => {
        const next = editDraft.category.trim();
        return next && !list.includes(next) ? [...list, next].sort() : list;
      });
    } catch (err) {
      setNote({ kind: 'error', text: err.response?.data?.message || 'Could not save that item.' });
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleStock = async (item) => {
    setBusyId(item._id);
    setNote(null);
    try {
      const res = await api.patch(`/shop-owner/products/${item._id}`, { inStock: !item.inStock });
      if (res.data?.data) replaceItem(res.data.data);
      setCounts((c) => ({
        ...c,
        outOfStock: Math.max(0, c.outOfStock + (item.inStock ? 1 : -1)),
      }));
    } catch (err) {
      setNote({ kind: 'error', text: err.response?.data?.message || 'Could not update that item.' });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item) => {
    const ok = window.confirm(
      `Remove "${item.name}" from your menu?\n\nCustomers will stop seeing it right away. Your past orders keep it, and you can put it back any time from "Show removed items".`
    );
    if (!ok) return;

    setBusyId(item._id);
    setNote(null);
    try {
      const res = await api.delete(`/shop-owner/products/${item._id}`);
      setNote({ kind: 'ok', text: res.data?.message || 'Item removed.' });
      if (showRemoved && res.data?.data) {
        replaceItem(res.data.data);
      } else {
        setItems((list) => list.filter((row) => row._id !== item._id));
      }
      setCounts((c) => ({
        total: showRemoved ? c.total : Math.max(0, c.total - 1),
        live: Math.max(0, c.live - 1),
        outOfStock: item.inStock ? c.outOfStock : Math.max(0, c.outOfStock - 1),
      }));
    } catch (err) {
      setNote({ kind: 'error', text: err.response?.data?.message || 'Could not remove that item.' });
    } finally {
      setBusyId(null);
    }
  };

  const restore = async (item) => {
    setBusyId(item._id);
    setNote(null);
    try {
      const res = await api.patch(`/shop-owner/products/${item._id}`, { isActive: true });
      if (res.data?.data) replaceItem(res.data.data);
      setNote({ kind: 'ok', text: `"${item.name}" is back on your menu.` });
      setCounts((c) => ({ ...c, live: c.live + 1 }));
    } catch (err) {
      setNote({ kind: 'error', text: err.response?.data?.message || 'Could not restore that item.' });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" />
        <p>Loading your menu...</p>
      </div>
    );
  }

  const fields = (value, set, idPrefix) => (
    <div className="menu-form-grid">
      <label className="field">
        <span>Item name</span>
        <input
          className="input"
          id={`${idPrefix}-name`}
          value={value.name}
          onChange={(e) => set({ ...value, name: e.target.value })}
          placeholder="e.g. Paneer Butter Masala"
          maxLength={100}
          required
        />
      </label>

      <label className="field">
        <span>Price (&#8377;)</span>
        <input
          className="input"
          id={`${idPrefix}-price`}
          type="number"
          min="0"
          step="0.01"
          value={value.price}
          onChange={(e) => set({ ...value, price: e.target.value })}
          placeholder="0.00"
          required
        />
      </label>

      <label className="field">
        <span>Sold by</span>
        <select
          className="input"
          id={`${idPrefix}-unit`}
          value={value.unit}
          onChange={(e) => set({ ...value, unit: e.target.value })}
        >
          {units.map((unit) => (
            <option key={unit} value={unit}>
              {UNIT_LABELS[unit] || unit}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Category</span>
        <input
          className="input"
          id={`${idPrefix}-category`}
          value={value.category}
          onChange={(e) => set({ ...value, category: e.target.value })}
          placeholder="General Items"
          list="menu-category-options"
          maxLength={50}
        />
      </label>

      <label className="field">
        <span>
          Discount <span className="muted">(optional, %)</span>
        </span>
        <input
          className="input"
          id={`${idPrefix}-discount`}
          type="number"
          min="0"
          max="100"
          value={value.discount}
          onChange={(e) => set({ ...value, discount: e.target.value })}
          placeholder="0"
        />
      </label>

      <label className="field menu-field-wide">
        <span>
          Description <span className="muted">(optional)</span>
        </span>
        <textarea
          className="input"
          id={`${idPrefix}-description`}
          rows={2}
          value={value.description}
          onChange={(e) => set({ ...value, description: e.target.value })}
          placeholder="What the customer gets — portion size, spice level, anything useful."
          maxLength={1000}
        />
      </label>
    </div>
  );

  return (
    <div className="page">
      <datalist id="menu-category-options">
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <div style={{ marginBottom: 20 }}>
        <p className="eyebrow">Your shop</p>
        <h1 className="display" style={{ fontSize: 'clamp(26px,4vw,38px)' }}>
          Menu
        </h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 580, lineHeight: 1.6 }}>
          Add items, change prices and mark things unavailable. Everything here applies to your
          shop only, and customers see it straight away.
        </p>
      </div>

      <div className="menu-stats">
        <div className="glass menu-stat">
          <span className="eyebrow">On the menu</span>
          <strong className="numeral">{counts.live}</strong>
        </div>
        <div className="glass menu-stat">
          <span className="eyebrow">Marked unavailable</span>
          <strong className="numeral">{counts.outOfStock}</strong>
        </div>
        <div className="glass menu-stat">
          <span className="eyebrow">Categories</span>
          <strong className="numeral">{categories.length}</strong>
        </div>
      </div>

      <MenuPdfCard />

      {note && (
        <div className={`alert alert-${note.kind === 'ok' ? 'ok' : 'error'}`}>{note.text}</div>
      )}

      <div className="menu-toolbar glass">
        <input
          className="input menu-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your items..."
          aria-label="Search your items"
        />

        <select
          className="input menu-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <label className="menu-removed">
          <input
            type="checkbox"
            checked={showRemoved}
            onChange={(e) => setShowRemoved(e.target.checked)}
          />
          <span>Show removed items</span>
        </label>

        <button
          className="btn btn-primary"
          onClick={() => {
            setAdding((v) => !v);
            setEditingId(null);
          }}
        >
          {adding ? 'Cancel' : '+ Add item'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {adding && (
          <motion.form
            className="glass menu-card menu-new"
            onSubmit={addItem}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="menu-card-title">New item</h3>
            {fields(draft, setDraft, 'new')}
            <div className="menu-card-actions">
              <button className="btn btn-primary" type="submit" disabled={savingNew}>
                {savingNew ? 'Adding...' : 'Add to menu'}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  setAdding(false);
                  setDraft(blankDraft());
                }}
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {grouped.length === 0 ? (
        <div className="glass menu-empty">
          <strong>Nothing to show</strong>
          <p className="muted">
            {items.length === 0
              ? 'Your menu is empty. Use "+ Add item" to put your first item up.'
              : 'No item matches that search or filter.'}
          </p>
        </div>
      ) : (
        grouped.map(([category, rows]) => (
          <section className="menu-group" key={category}>
            <div className="menu-group-head">
              <h3>{category}</h3>
              <span className="muted">
                {rows.length} {rows.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="menu-rows">
              {rows.map((item, index) => {
                const isEditing = editingId === item._id;
                const busy = busyId === item._id;

                return (
                  <motion.div
                    key={item._id}
                    className={`glass menu-row ${item.isActive ? '' : 'gone'} ${
                      item.isActive && !item.inStock ? 'unavailable' : ''
                    }`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.35 }}
                  >
                    {isEditing ? (
                      <form className="menu-edit" onSubmit={saveEdit}>
                        <h4 className="menu-card-title">Editing &ldquo;{item.name}&rdquo;</h4>
                        {fields(editDraft, setEditDraft, `edit-${item._id}`)}
                        <div className="menu-card-actions">
                          <button className="btn btn-primary" type="submit" disabled={savingEdit}>
                            {savingEdit ? 'Saving...' : 'Save changes'}
                          </button>
                          <button
                            className="btn btn-ghost"
                            type="button"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="menu-row-main">
                          <div className="menu-row-head">
                            <strong>{item.name}</strong>
                            {!item.isActive && <span className="badge badge-bad">Removed</span>}
                            {item.isActive && !item.inStock && (
                              <span className="badge badge-warn">Unavailable</span>
                            )}
                            {item.discount > 0 && (
                              <span className="badge badge-ok">{item.discount}% off</span>
                            )}
                          </div>
                          {item.description && <p className="menu-desc">{item.description}</p>}
                          <p className="menu-meta muted">
                            {UNIT_LABELS[item.unit] || item.unit}
                            {item.totalSold > 0 && ` · ${item.totalSold} sold`}
                          </p>
                        </div>

                        <div className="menu-row-price">
                          {item.discount > 0 ? (
                            <>
                              <strong className="numeral">{money(item.discountedPrice)}</strong>
                              <span className="menu-was">{money(item.price)}</span>
                            </>
                          ) : (
                            <strong className="numeral">{money(item.price)}</strong>
                          )}
                        </div>

                        <div className="menu-row-actions">
                          {item.isActive ? (
                            <>
                              <button
                                className={`toggle small ${item.inStock ? 'on' : ''}`}
                                onClick={() => toggleStock(item)}
                                disabled={busy}
                                aria-pressed={item.inStock}
                                aria-label={`${item.name} available`}
                                title={
                                  item.inStock
                                    ? 'Available — tap to mark unavailable'
                                    : 'Unavailable — tap to put it back'
                                }
                              >
                                <span />
                              </button>
                              <button
                                className="btn btn-ghost"
                                onClick={() => {
                                  startEdit(item);
                                  setAdding(false);
                                }}
                                disabled={busy}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => remove(item)}
                                disabled={busy}
                              >
                                Remove
                              </button>
                            </>
                          ) : (
                            <button
                              className="btn btn-primary"
                              onClick={() => restore(item)}
                              disabled={busy}
                            >
                              Put back
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
};

export default MenuPage;
