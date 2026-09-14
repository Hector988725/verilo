'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../../lib/supabaseClient';
import { CATEGORIES } from '../../../../../lib/categories';
import { getMyToken } from '../../../../../lib/ownership';

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

const SPECIALIZATION_LABELS = {
  tuition: { label: 'Subject(s) You Teach', placeholder: 'e.g. Maths & Science, Class 9-12' },
  plumber: { label: 'Specialization', placeholder: 'e.g. Pipe fitting, bathroom fitting' },
  electrician: { label: 'Specialization', placeholder: 'e.g. Wiring, AC repair, appliance repair' },
  mistri: { label: 'Specialization', placeholder: 'e.g. Furniture, doors, woodwork' },
  mechanic: { label: 'Specialization', placeholder: 'e.g. Bike repair, car servicing' },
  'ac-repair': { label: 'Specialization', placeholder: 'e.g. AC servicing, fridge, washing machine repair' },
  beautician: { label: 'Services Offered', placeholder: 'e.g. Haircut, facial, bridal makeup' },
  tailor: { label: 'Specialization', placeholder: 'e.g. Blouse stitching, alterations, uniforms' },
  'milk-veg': { label: 'What You Deliver', placeholder: 'e.g. Fresh milk, seasonal vegetables' },
  other: { label: 'Specialization', placeholder: 'What do you specialize in?' },
};

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    setAllowed(!!getMyToken(id));

    supabase.from('listings').select('id, name, service, qualification, experience, about, phone, area, note, maps_link, pincode, photo_url, banner_url').eq('id', id).single().then(({ data }) => {
      if (data) {
        setForm({
          name: data.name || '', service: data.service || 'plumber',
          qualification: data.qualification || '', ...parseExperience(data.experience),
          about: data.about || '', phone: data.phone || '', area: data.area || '', note: data.note || '', mapsLink: data.maps_link || '', pincode: data.pincode || '',
        });
        setPhotoPreview(data.photo_url || '');
        setBannerPreview(data.banner_url || '');
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

      const updatePayload = {
        name: form.name, service: form.service,
        qualification: form.qualification || null, experience: form.experienceValue ? `${form.experienceValue} ${form.experienceUnit}` : null,
        about: form.about || null, phone: form.phone, area: form.area || null, note: form.note || null, maps_link: form.mapsLink || null, pincode: form.pincode || null,
      };
      if (photo_url) updatePayload.photo_url = photo_url;
      if (banner_url) updatePayload.banner_url = banner_url;

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

        <label>Cover Banner (optional)</label>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: '-8px 0 8px' }}>
          A wide photo of your shop, work, or products — shown at the top of your profile.
        </p>
        <div style={{
          width: '100%', height: 90, borderRadius: 12, background: '#F3EEDD', display: 'flex',
          alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed #ddd6c4', marginBottom: 8,
        }}>
          {bannerPreview ? <img src={bannerPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'var(--muted)', fontSize: 13 }}>🖼️ No banner selected</span>}
        </div>
        <input type="file" accept="image/*" onChange={handleBanner} />

        <label>Name *</label>
        <input required value={form.name} onChange={(e) => update('name', e.target.value)} />

        <label>Service Type *</label>
        <select value={form.service} onChange={(e) => update('service', e.target.value)}>
          {CATEGORIES.filter((c) => c.key !== 'all').map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>

        <label>{SPECIALIZATION_LABELS[form.service]?.label || 'Specialization'}</label>
        <input value={form.qualification} onChange={(e) => update('qualification', e.target.value)} placeholder={SPECIALIZATION_LABELS[form.service]?.placeholder || ''} />

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

        {error && <p style={{ color: '#9C2E20', fontSize: 13.5, marginTop: 10 }}>{error}</p>}

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
