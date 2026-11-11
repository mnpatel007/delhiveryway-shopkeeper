import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

const readableSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const readableDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Upload the shop's printed menu as a PDF. Customers get a link to it on the
 * shop page, which is useful for shops whose full menu is far longer than what
 * they keep as orderable items.
 */
const MenuPdfCard = () => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null); // { kind, text }
  const fileInput = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/shop-owner/menu-pdf');
      setInfo(res.data?.data || null);
    } catch {
      // A vendor with no shop linked cannot reach this page at all, so the
      // only realistic failure here is the network. Leave the card empty.
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetching on mount: state lands after the request settles, which the
    // set-state-in-effect rule cannot tell apart from a sync cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const pick = (event) => {
    const file = event.target.files?.[0];
    if (file) send(file);
    // Allow picking the same file again after a failed attempt.
    event.target.value = '';
  };

  const send = async (file) => {
    setBusy(true);
    setNote(null);
    try {
      const form = new FormData();
      form.append('menu', file);
      const res = await api.post('/shop-owner/menu-pdf', form, {
        // Let the browser set the multipart boundary; the shared client
        // defaults every request to application/json.
        headers: { 'Content-Type': undefined },
      });
      setInfo(res.data?.data || null);
      setNote({ kind: 'ok', text: res.data?.message || 'Menu uploaded.' });
    } catch (err) {
      setNote({
        kind: 'error',
        text: err.response?.data?.message || 'Could not upload that file.',
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Remove your menu PDF? Customers will stop seeing the link.')) return;
    setBusy(true);
    setNote(null);
    try {
      await api.delete('/shop-owner/menu-pdf');
      setInfo(null);
      setNote({ kind: 'ok', text: 'Menu removed.' });
    } catch (err) {
      setNote({ kind: 'error', text: err.response?.data?.message || 'Could not remove it.' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  return (
    <div className={`glass menu-pdf ${info ? 'has-file' : ''}`}>
      <div className="menu-pdf-text">
        <strong>Menu PDF</strong>
        {info ? (
          <p className="muted">
            {info.filename} &middot; {readableSize(info.size)} &middot; uploaded{' '}
            {readableDate(info.uploadedAt)}. Customers see an &ldquo;Open menu&rdquo; link on your
            shop page.
          </p>
        ) : (
          <p className="muted">
            Upload your printed menu as a PDF and customers can open it from your shop page. Up to
            8&nbsp;MB.
          </p>
        )}
      </div>

      <div className="menu-pdf-actions">
        {info && (
          <a
            className="btn btn-ghost"
            href={`${API_ORIGIN}${info.url}`}
            target="_blank"
            rel="noreferrer"
          >
            View
          </a>
        )}
        <button className="btn btn-primary" onClick={() => fileInput.current?.click()} disabled={busy}>
          {busy ? 'Working...' : info ? 'Replace' : 'Upload PDF'}
        </button>
        {info && (
          <button className="btn btn-danger" onClick={remove} disabled={busy}>
            Remove
          </button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,.pdf"
          onChange={pick}
          hidden
        />
      </div>

      {note && (
        <div className={`alert alert-${note.kind === 'ok' ? 'ok' : 'error'} menu-pdf-note`}>
          {note.text}
        </div>
      )}
    </div>
  );
};

export default MenuPdfCard;
