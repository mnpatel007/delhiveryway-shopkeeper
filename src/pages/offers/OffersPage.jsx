import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { money } from '../../utils/format';
import './offers.css';

const blankDraft = () => ({
  title: '',
  minSubtotal: '',
  mode: 'auto',
  rewardProductIds: [],
  rewardQuantity: 1,
});

const draftFromOffer = (offer) => ({
  title: offer.title,
  minSubtotal: String(offer.minSubtotal),
  mode: offer.mode,
  rewardProductIds: offer.rewards.map((r) => String(r._id)),
  rewardQuantity: offer.rewardQuantity || 1,
});

/**
 * Free-gift offers a shop runs on its own items: spend this much, get that
 * free. Either the shop names the gift outright, or it names a few and the
 * customer picks one at checkout.
 */
const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [items, setItems] = useState([]);
  const [maxOffers, setMaxOffers] = useState(10);

  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(null); // { kind, text }
  const [busyId, setBusyId] = useState(null);

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(blankDraft);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [itemSearch, setItemSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const [offerRes, itemRes] = await Promise.all([
        api.get('/shop-owner/offers'),
        api.get('/shop-owner/products'),
      ]);
      setOffers(offerRes.data?.data?.offers || []);
      setMaxOffers(offerRes.data?.data?.maxOffers || 10);
      setItems(itemRes.data?.data?.items || []);
    } catch (err) {
      setNote({ kind: 'error', text: err.response?.data?.message || 'Could not load your offers.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetching on mount: state lands after the requests settle, which the
    // set-state-in-effect rule cannot tell apart from a sync cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const pickable = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    const live = items.filter((item) => item.isActive);
    if (!q) return live;
    return live.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, itemSearch]);

  const openNew = () => {
    setDraft(blankDraft());
    setEditingId(null);
    setAdding(true);
    setItemSearch('');
  };

  const openEdit = (offer) => {
    setDraft(draftFromOffer(offer));
    setEditingId(offer._id);
    setAdding(false);
    setItemSearch('');
  };

  const close = () => {
    setAdding(false);
    setEditingId(null);
    setDraft(blankDraft());
  };

  const toggleReward = (id) => {
    setDraft((d) => {
      const has = d.rewardProductIds.includes(id);
      if (has) return { ...d, rewardProductIds: d.rewardProductIds.filter((x) => x !== id) };
      // An automatic offer gives away exactly one item, so picking a second
      // replaces the first rather than failing on save.
      if (d.mode === 'auto') return { ...d, rewardProductIds: [id] };
      return { ...d, rewardProductIds: [...d.rewardProductIds, id] };
    });
  };

  const setMode = (mode) => {
    setDraft((d) => ({
      ...d,
      mode,
      rewardProductIds:
        mode === 'auto' ? d.rewardProductIds.slice(0, 1) : d.rewardProductIds,
    }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNote(null);
    const payload = {
      title: draft.title,
      minSubtotal: draft.minSubtotal,
      mode: draft.mode,
      rewardProductIds: draft.rewardProductIds,
      rewardQuantity: Number(draft.rewardQuantity) || 1,
    };
    try {
      const res = editingId
        ? await api.patch(`/shop-owner/offers/${editingId}`, payload)
        : await api.post('/shop-owner/offers', payload);
      setNote({ kind: 'ok', text: res.data?.message || 'Saved.' });
      close();
      await load();
    } catch (err) {
      setNote({ kind: 'error', text: err.response?.data?.message || 'Could not save that offer.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (offer) => {
    setBusyId(offer._id);
    setNote(null);
    try {
      const res = await api.patch(`/shop-owner/offers/${offer._id}`, {
        isActive: !offer.isActive,
      });
      if (res.data?.data) {
        setOffers((list) => list.map((o) => (o._id === offer._id ? res.data.data : o)));
      }
    } catch (err) {
      setNote({ kind: 'error', text: err.response?.data?.message || 'Could not update that offer.' });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (offer) => {
    if (!window.confirm(`Delete "${offer.title}"? Customers will stop seeing it.`)) return;
    setBusyId(offer._id);
    setNote(null);
    try {
      const res = await api.delete(`/shop-owner/offers/${offer._id}`);
      setOffers((list) => list.filter((o) => o._id !== offer._id));
      setNote({ kind: 'ok', text: res.data?.message || 'Offer deleted.' });
    } catch (err) {
      setNote({ kind: 'error', text: err.response?.data?.message || 'Could not delete that offer.' });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" />
        <p>Loading your offers...</p>
      </div>
    );
  }

  const editing = adding || editingId;
  const needed = draft.mode === 'auto' ? 1 : 2;
  const enough = draft.rewardProductIds.length >= needed;

  const form = (
    <motion.form
      className="glass offer-form"
      onSubmit={save}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <h3 className="offer-form-title">{editingId ? 'Edit offer' : 'New offer'}</h3>

      <div className="offer-form-top">
        <label className="field">
          <span>What customers see</span>
          <input
            className="input"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="e.g. Free 2L Coke on orders over 500"
            maxLength={120}
            required
          />
        </label>

        <label className="field">
          <span>Spend at least (&#8377;)</span>
          <input
            className="input"
            type="number"
            min="1"
            step="1"
            value={draft.minSubtotal}
            onChange={(e) => setDraft({ ...draft, minSubtotal: e.target.value })}
            placeholder="500"
            required
          />
        </label>

        <label className="field">
          <span>How many free</span>
          <input
            className="input"
            type="number"
            min="1"
            max="10"
            value={draft.rewardQuantity}
            onChange={(e) => setDraft({ ...draft, rewardQuantity: e.target.value })}
          />
        </label>
      </div>

      <div className="offer-modes">
        <button
          type="button"
          className={`offer-mode ${draft.mode === 'auto' ? 'on' : ''}`}
          onClick={() => setMode('auto')}
        >
          <strong>Give one set item</strong>
          <span>
            The item goes into the order by itself once the customer spends enough.
          </span>
        </button>
        <button
          type="button"
          className={`offer-mode ${draft.mode === 'choice' ? 'on' : ''}`}
          onClick={() => setMode('choice')}
        >
          <strong>Let the customer choose</strong>
          <span>List a few items and the customer picks one free at checkout.</span>
        </button>
      </div>

      <div className="offer-picker">
        <div className="spread offer-picker-head">
          <strong>
            {draft.mode === 'auto' ? 'The free item' : 'Items the customer can choose from'}
          </strong>
          <span className={`muted ${enough ? '' : 'offer-need'}`}>
            {draft.rewardProductIds.length} selected
            {enough ? '' : ` — pick at least ${needed}`}
          </span>
        </div>

        <input
          className="input"
          value={itemSearch}
          onChange={(e) => setItemSearch(e.target.value)}
          placeholder="Search your menu..."
          aria-label="Search your menu"
        />

        <div className="offer-item-list">
          {pickable.length === 0 ? (
            <p className="muted" style={{ margin: '10px 2px', fontSize: 13 }}>
              {items.length === 0
                ? 'Add something to your menu first — a free gift has to be one of your own items.'
                : 'No item matches that search.'}
            </p>
          ) : (
            pickable.map((item) => {
              const on = draft.rewardProductIds.includes(String(item._id));
              return (
                <button
                  type="button"
                  key={item._id}
                  className={`offer-chip ${on ? 'on' : ''}`}
                  onClick={() => toggleReward(String(item._id))}
                >
                  <span className="offer-chip-name">{item.name}</span>
                  <span className="offer-chip-price">{money(item.price)}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="offer-form-actions">
        <button className="btn btn-primary" type="submit" disabled={saving || !enough}>
          {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create offer'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={close}>
          Cancel
        </button>
      </div>
    </motion.form>
  );

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <p className="eyebrow">Your shop</p>
        <h1 className="display" style={{ fontSize: 'clamp(26px,4vw,38px)' }}>
          Offers
        </h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 600, lineHeight: 1.6 }}>
          Give something away once a customer spends enough. The free item is added to the order
          at &#8377;0 and shows on your order ticket, so you know to pack it. It does not change
          what you are paid for the rest of the order.
        </p>
      </div>

      {note && (
        <div className={`alert alert-${note.kind === 'ok' ? 'ok' : 'error'}`}>{note.text}</div>
      )}

      <div className="spread offer-bar">
        <span className="muted">
          {offers.length} of {maxOffers} offers used
        </span>
        <button
          className="btn btn-primary"
          onClick={editing ? close : openNew}
          disabled={!editing && offers.length >= maxOffers}
        >
          {editing ? 'Cancel' : '+ New offer'}
        </button>
      </div>

      <AnimatePresence initial={false}>{editing && form}</AnimatePresence>

      {offers.length === 0 ? (
        <div className="glass offer-empty">
          <strong>No offers yet</strong>
          <p className="muted">
            A common one: spend &#8377;500, get a 2&nbsp;litre soft drink free. Use &ldquo;New
            offer&rdquo; to set one up.
          </p>
        </div>
      ) : (
        <div className="offer-list">
          {offers.map((offer, index) => {
            const busy = busyId === offer._id;
            return (
              <motion.div
                key={offer._id}
                className={`glass offer-row ${offer.isActive ? '' : 'off'} ${
                  offer.usable ? '' : 'broken'
                }`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.35 }}
              >
                <div className="offer-row-main">
                  <div className="offer-row-head">
                    <strong>{offer.title}</strong>
                    {!offer.isActive && <span className="badge badge-bad">Paused</span>}
                    {!offer.usable && <span className="badge badge-warn">No item left</span>}
                    <span className="badge">
                      {offer.mode === 'auto' ? 'Set item' : 'Customer chooses'}
                    </span>
                  </div>

                  <p className="offer-rule">
                    Spend <strong>{money(offer.minSubtotal)}</strong> or more &rarr; get{' '}
                    <strong>
                      {offer.rewardQuantity > 1 ? `${offer.rewardQuantity} × ` : ''}
                      {offer.rewards.map((r) => r.name).join(offer.mode === 'auto' ? ', ' : ' / ')}
                    </strong>{' '}
                    free
                  </p>

                  <p className="muted offer-meta">
                    {offer.timesApplied > 0
                      ? `Given away on ${offer.timesApplied} ${
                          offer.timesApplied === 1 ? 'order' : 'orders'
                        }`
                      : 'Not used yet'}
                    {offer.rewards.some((r) => !r.inStock) && ' · a reward item is marked unavailable'}
                  </p>
                </div>

                <div className="offer-row-actions">
                  <button
                    className={`toggle small ${offer.isActive ? 'on' : ''}`}
                    onClick={() => toggleActive(offer)}
                    disabled={busy}
                    aria-pressed={offer.isActive}
                    aria-label={`${offer.title} running`}
                    title={offer.isActive ? 'Running — tap to pause' : 'Paused — tap to run it'}
                  >
                    <span />
                  </button>
                  <button className="btn btn-ghost" onClick={() => openEdit(offer)} disabled={busy}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => remove(offer)} disabled={busy}>
                    Delete
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OffersPage;
