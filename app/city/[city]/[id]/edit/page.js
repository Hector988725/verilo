'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../../lib/supabaseClient';
import { CATEGORIES, SPECIALIZATION_LABELS, EVENT_TYPES } from '../../../../../lib/categories';
import { getMyToken } from '../../../../../lib/ownership';
import BannerPositionPicker from '../../../../../components/BannerPositionPicker';
import { compressImage } from '../../../../../lib/compressImage';

const MAX_PORTFOLIO = 6;

// Best-effort parse of old free-text experience values ("8 years", "8", "6 months")
// into a separate number + unit, for editing listings created before the
// structured experience field existed.
function parseExperience(raw) {
  if (!raw) return { experienceValue: '', experienceUnit: 'Years' };
  const match = String(raw).match(/(\d+)\s*(month|year)?/i);
  if (!match) return { experienceValue: '', experienceUnit: 'Years' };
  const unit = /month/i.test(match[2] || '') ? 'Months' : 'Years';
  return { experienceValue: match[1], experienceUnit: unit };
}

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const city = decodeURIComponent(params.city);
  const id = params.id;

  const [form, setForm] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [bannerPositionV, setBannerPositionV] = useState(50);
  // Portfolio: existing photos (already uploaded URLs) + new files picked in this session.
  const [portfolio, setPortfolio] = useState([]); // [{ url, file? }]
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    setAllowed(!!getMyToken(id));

    supabase.from('listings').select('id, name, service, qualification, experience, about, phone, area, note, maps_link, pincode, photo_url, banner_url, banner_position, fb_url, instagram_url, youtube_url, gmb_url, portfolio_urls, travels_to, starting_price, event_types').eq('id', id).single().then(({ data }) => {
      if (data) {
        setForm({
          name: data.name || '', service: data.service || 'plumber',
          qualification: data.qualification || '', ...parseExperience(data.experience),
          about: data.about || '', phone: data.phone || '', area: data.area || '', note: data.note || '', mapsLink: data.maps_link || '', pincode: data.pincode || '',
          fbUrl: data.fb_url || '', instagramUrl: data.instagram_url || '', youtubeUrl: data.youtube_url || '', gmbUrl: data.gmb_url || '', travelsTo: data.travels_to || '', startingPrice: data.starting_price ?? '', eventTypes: data.event_types || [],
        });
        setPortfolio((data.portfolio_urls || []).map((url) => ({ url })));
        setPhotoPreview(data.photo_url || '');
        setBannerPreview(data.banner_url || '');
        const match = /(\d+)%/.exec(data.banner_position || '');
        setBannerPositionV(match ? Number(match[1]) : 50);
      }
    });
  }, [id]);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleBanner(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setBannerPositionV(50);
  }

  function handlePortfolioAdd(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setPortfolio((cur) => {
      const room = MAX_PORTFOLIO - cur.length;
      const added = files.slice(0, Math.max(0, room)).map((file) => ({ url: URL.createObjectURL(file), file }));
      return [...cur, ...added];
    });
  }

  function removePortfolio(index) {
    setPortfolio((cur) => cur.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      let photo_url;
      if (photoFile) {
        const fileName = `${Date.now()}-${photoFile.name}`;
        const { error: uploadError } = await supabase.storage.from('listing-photos').upload(fileName, photoFile);
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from('listing-photos').getPublicUrl(fileName);
        photo_url = publicUrl.publicUrl;
      }

      let banner_url;
      if (bannerFile) {
        const bannerFileName = `banner-${Date.now()}-${bannerFile.name}`;
        const { error: bannerUploadError } = await supabase.storage.from('listing-photos').upload(bannerFileName, bannerFile);
        if (bannerUploadError) throw bannerUploadError;
        const { data: bannerPublicUrl } = supabase.storage.from('listing-photos').getPublicUrl(bannerFileName);
        banner_url = bannerPublicUrl.publicUrl;
      }

      const isEvents = CATEGORIES.find((c) => c.key === form.service)?.group === 'events';
      let portfolio_urls;
      if (isEvents) {
        portfolio_urls = [];
        for (const item of portfolio) {
          if (!item.file) { portfolio_urls.push(item.url); continue; }
          const small = await compressImage(item.file);
          const safeName = small.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const fileName = `portfolio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
          const { error: pErr } = await supabase.storage.from('listing-photos').upload(fileName, small);
          if (pErr) throw pErr;
          portfolio_urls.push(supabase.storage.from('listing-photos').getPublicUrl(fileName).data.publicUrl);
        }
      }

      const updatePayload = {
        name: form.name, service: form.service,
        qualification: form.qualification || null, experience: form.experienceValue ? `${form.experienceValue} ${form.experienceUnit}` : null,
        about: form.about || null, phone: form.phone, area: form.area || null, note: form.note || null, maps_link: form.mapsLink || null, pincode: form.pincode || null,
        fb_url: form.fbUrl || null, instagram_url: form.instagramUrl || null, youtube_url: form.youtubeUrl || null, gmb_url: form.gmbUrl || null,
      };
      if (isEvents) { updatePayload.portfolio_urls = portfolio_urls; updatePayload.travels_to = form.travelsTo || null; updatePayload.starting_price = form.startingPrice === '' ? null : String(form.startingPrice); updatePayload.event_types = form.eventTypes; }
      if (photo_url) updatePayload.photo_url = photo_url;
      if (banner_url) updatePayload.banner_url = banner_url;
      if (bannerFile || bannerPreview) updatePayload.banner_position = `center ${bannerPositionV}%`;

      const res = await fetch('/api/listing/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: id, token: getMyToken(id), updates: updatePayload }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Could not save changes');

      router.push(`/city/${encodeURIComponent(city)}/${id}/manage`);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (allowed === false) {
    return (
      <div className="wrap">
        <header><div className="pin"></div><h1>Verilo</h1></header>
        <div className="empty">
          <div className="empty-title">Access Not Verified</div>
          <div>
            You can only edit this listing from the device that added it, or using your
            private management link.{' '}
            <Link href={`/city/${encodeURIComponent(city)}/find`} style={{ color: '#A9782E' }}>Lost your link? →</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!form) return <div className="wrap"><p style={{ textAlign: 'center', color: '#8A94A6' }}>Loading...</p></div>;

  return (
    <div className="wrap">
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <Link href={`/city/${encodeURIComponent(city)}/${id}`} onClick={(e) => { e.preventDefault(); router.replace(`/city/${encodeURIComponent(city)}/${id}`); }} className="back-link">← Back to profile</Link>
      </header>

      <form className="form-card" onSubmit={handleSubmit}>
        <h2 style={{ fontFamily: "'Rozha One', serif", color: '#8C6224', marginTop: 0 }}>Edit Your Listing</h2>

        <label>Photo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F3EEDD', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed #ddd6c4' }}>
            {photoPreview ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
          </div>
          <input type="file" accept="image/*" onChange={handlePhoto} />
        </div>

        <label>Cover Banner (optional, but recommended)</label>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: '-8px 0 8px' }}>
          Use a WIDE, landscape photo (not the same as your profile photo above) — your shopfront,
          you at work, tools, or finished jobs. This is the first thing customers see, so a clear,
          well-lit photo makes a big difference.
        </p>
        {bannerPreview ? (
          <BannerPositionPicker src={bannerPreview} value={bannerPositionV} onChange={setBannerPositionV} />
        ) : (
          <div style={{
            width: '100%', height: 90, borderRadius: 12, background: '#F3EEDD', display: 'flex',
            alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed #ddd6c4', marginBottom: 8,
          }}>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>🖼️ No banner selected</span>
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleBanner} />

        <label>Name *</label>
        <input required value={form.name} onChange={(e) => update('name', e.target.value)} />

        <label>Service Type *</label>
        <select value={form.service} onChange={(e) => update('service', e.target.value)}>
          <optgroup label="Services">
            {CATEGORIES.filter((c) => c.key !== 'all' && c.group !== 'events').map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </optgroup>
          <optgroup label="Events">
            {CATEGORIES.filter((c) => c.group === 'events').map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </optgroup>
        </select>

        <label>{SPECIALIZATION_LABELS[form.service]?.label || 'Specialization'}</label>
        <input value={form.qualification} onChange={(e) => update('qualification', e.target.value)} placeholder={SPECIALIZATION_LABELS[form.service]?.placeholder || ''} />

        {CATEGORIES.find((c) => c.key === form.service)?.group === 'events' && (
          <>
            <label>Portfolio photos (up to {MAX_PORTFOLIO})</label>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '-8px 0 8px' }}>
              Show your best work: events, shoots, looks, stage setups. Customers book people whose work they can see.
              Photos are resized automatically.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
              {portfolio.map((item, i) => (
                <div key={item.url} style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 10, overflow: 'hidden', background: '#F3EEDD' }}>
                  <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removePortfolio(i)} aria-label="Remove photo"
                    style={{ position: 'absolute', top: 4, right: 4, width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 15, cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
            {portfolio.length < MAX_PORTFOLIO ? (
              <input type="file" accept="image/*" multiple onChange={handlePortfolioAdd} />
            ) : (
              <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>Maximum {MAX_PORTFOLIO} photos. Remove one to add another.</p>
            )}

            <label>Starting price in ₹ (optional)</label>
            <input type="number" min="0" max="9999999" value={form.startingPrice} onChange={(e) => update('startingPrice', e.target.value)} placeholder="e.g. 5000" />

            <label>Events you do</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
              {EVENT_TYPES.map((t) => {
                const on = form.eventTypes.includes(t);
                return (
                  <button key={t} type="button" aria-pressed={on}
                    onClick={() => update('eventTypes', on ? form.eventTypes.filter((x) => x !== t) : [...form.eventTypes, t])}
                    style={{ padding: '7px 12px', borderRadius: 999, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                      border: on ? '1.5px solid #8C6224' : '1.5px solid #ddd6c4', background: on ? '#F3E6C8' : '#fff', color: '#3a3320', fontWeight: on ? 700 : 500 }}>
                    {on ? '✓ ' : ''}{t}
                  </button>
                );
              })}
            </div>

            <label>Also works in (cities you travel to, optional)</label>
            <input value={form.travelsTo} onChange={(e) => update('travelsTo', e.target.value)} maxLength={200} placeholder="e.g. Shahdol, Rewa, Jabalpur" />
          </>
        )}

        <label>Experience</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number" min="0" style={{ flex: 1 }}
            value={form.experienceValue}
            onChange={(e) => update('experienceValue', e.target.value)}
            placeholder="e.g. 8"
          />
          <select style={{ flex: '0 0 110px' }} value={form.experienceUnit} onChange={(e) => update('experienceUnit', e.target.value)}>
            <option value="Years">Years</option>
            <option value="Months">Months</option>
          </select>
        </div>

        <label>About You</label>
        <textarea value={form.about} onChange={(e) => update('about', e.target.value)} />

        <label>Phone Number *</label>
        <input required type="tel" pattern="[0-9]{10}" value={form.phone} onChange={(e) => update('phone', e.target.value)} />

        <label>Area / Locality</label>
        <input value={form.area} onChange={(e) => update('area', e.target.value)} />

        <label>Pincode (optional)</label>
        <input value={form.pincode} onChange={(e) => update('pincode', e.target.value)} maxLength={6} />

        <label>Note (optional)</label>
        <textarea value={form.note} onChange={(e) => update('note', e.target.value)} />

        <label>Google Maps / Business Profile Link (optional)</label>
        <input value={form.mapsLink} onChange={(e) => update('mapsLink', e.target.value)} placeholder="Paste your Google Maps or Business Profile link" />

        <label>Social & Business Links (optional)</label>
        <input value={form.fbUrl} onChange={(e) => update('fbUrl', e.target.value)} placeholder="Facebook page link" style={{ marginBottom: 8 }} />
        <input value={form.instagramUrl} onChange={(e) => update('instagramUrl', e.target.value)} placeholder="Instagram profile link" style={{ marginBottom: 8 }} />
        <input value={form.youtubeUrl} onChange={(e) => update('youtubeUrl', e.target.value)} placeholder="YouTube channel link" style={{ marginBottom: 8 }} />
        <input value={form.gmbUrl} onChange={(e) => update('gmbUrl', e.target.value)} placeholder="Google Business Profile link" />

        {error && <p style={{ color: '#9C2E20', fontSize: 13.5, marginTop: 10 }}>{error}</p>}

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
