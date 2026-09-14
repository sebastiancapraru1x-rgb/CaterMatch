import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'Ice Cream', 'Tacos', 'BBQ', 'Desserts', 'Coffee/Beverage',
  'Pizza', 'Vegan', 'Halal', 'Other',
];

const DEFAULT_CITY_COORDS = { lat: 43.6532, lng: -79.3832 }; // Toronto (dev default)

export default function CreateListingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [type, setType] = useState('vendor_service');
  const [form, setForm] = useState({
    title: '', description: '', category: 'Tacos',
    city: '', state_province: '', postal_code: '',
    service_radius_km: 50, price_amount: '',
    event_date: '', expected_guests: '', budget_estimate: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [processingImgs, setProcessingImgs] = useState(false);
  const fileInputRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const MAX_PHOTOS = 6;

  // Compresses + converts a device image to a compact data URL.
  function fileToDataUrl(file, maxDim = 1200, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(files) {
    const list = Array.from(files || []).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    const room = Math.max(0, MAX_PHOTOS - photos.length);
    if (photos.length + list.length > MAX_PHOTOS) {
      alert(`You can add up to ${MAX_PHOTOS} photos.`);
    }
    if (!room) return;
    setProcessingImgs(true);
    try {
      const next = await Promise.all(list.slice(0, room).map(fileToDataUrl));
      setPhotos((p) => [...p, ...next]);
    } catch {
      alert('Could not read one of those images.');
    } finally {
      setProcessingImgs(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removePhoto(index) {
    setPhotos((p) => p.filter((_, i) => i !== index));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = {
        listing_type: type,
        latitude: DEFAULT_CITY_COORDS.lat,
        longitude: DEFAULT_CITY_COORDS.lng,
        ...form,
        photos,
        expected_guests: form.expected_guests ? Number(form.expected_guests) : null,
        budget_estimate: form.budget_estimate ? Number(form.budget_estimate) : null,
        service_radius_km: type === 'vendor_service' ? Number(form.service_radius_km) : null,
        price_amount: type === 'vendor_service' && form.price_amount ? Number(form.price_amount) : null,
      };
      await api.post('/listings', payload);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not create listing.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-extrabold text-slate-900">Post a listing</h1>
      <p className="mb-6 text-sm text-slate-500">
        Caterers, food trucks, and home cooks — connect directly with hosts near you.
      </p>

      {/* Type selector */}
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
        <button
          onClick={() => setType('vendor_service')}
          className={`rounded-lg px-3 py-3 text-sm font-semibold ${type === 'vendor_service' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-orange-50'}`}
        >
          🚚 I'm a vendor (offer food service)
        </button>
        <button
          onClick={() => setType('host_gig')}
          className={`rounded-lg px-3 py-3 text-sm font-semibold ${type === 'host_gig' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-orange-50'}`}
        >
          🎪 I'm a host (need catering)
        </button>
      </div>

      {!user && (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          You'll need to log in before posting.
        </p>
      )}

      <form onSubmit={submit} className="card space-y-4 p-6">
        {/* Common fields */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {type === 'vendor_service' ? 'Business / service name' : 'Event title'}
          </label>
          <input value={form.title} onChange={set('title')} required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
          <select value={form.category} onChange={set('category')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea value={form.description} onChange={set('description')} required rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
            <input value={form.city} onChange={set('city')} required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">State / Province</label>
            <input value={form.state_province} onChange={set('state_province')} required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Postal code (opt.)</label>
            <input value={form.postal_code} onChange={set('postal_code')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
        </div>

        {/* Vendor-only fields */}
        {type === 'vendor_service' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Service radius (km)</label>
                <select value={form.service_radius_km} onChange={set('service_radius_km')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                  {[10, 25, 50, 100].map((r) => <option key={r}>{r} km</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Starting price ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.price_amount}
                  onChange={set('price_amount')}
                  placeholder="e.g. 75"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
          </>
        )}

        {/* Host-only fields */}
        {type === 'host_gig' && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Event date</label>
                <input type="date" value={form.event_date} onChange={set('event_date')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Expected guests</label>
                <input type="number" value={form.expected_guests} onChange={set('expected_guests')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Budget ($)</label>
                <input type="number" value={form.budget_estimate} onChange={set('budget_estimate')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
            </div>
          </>
        )}

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

        {/* Photos — upload from device (camera roll, folders, storage) */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Photos</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photos.length >= MAX_PHOTOS}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-sm font-semibold text-slate-500 hover:border-brand-400 hover:text-brand-600 disabled:opacity-50 dark:border-slate-600 dark:text-slate-400"
          >
            {processingImgs ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Processing images…</>
            ) : (
              <><ImagePlus className="h-5 w-5" /> Choose photos from your device</>
            )}
          </button>
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
            From your camera roll, folders, or storage — up to {MAX_PHOTOS} photos.
          </p>
          {photos.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {photos.map((src, i) => (
                <div key={i} className="group relative">
                  <img src={src} alt="" className="h-24 w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={busy || !user}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? 'Posting…' : 'Post listing'}
        </button>

        {/* NEXT_PART */}
      </form>
    </div>
  );
}