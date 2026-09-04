'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../../lib/supabaseClient';
import { CATEGORIES } from '../../../../../lib/categories';

const SPECIALIZATION_LABELS = {
  doctor: { label: 'Qualification / Specialization', placeholder: 'e.g. MBBS, General Physician' },
  tuition: { label: 'Subject(s) You Teach', placeholder: 'e.g. Maths & Science, Class 9-12' },
  plumber: { label: 'Specialization', placeholder: 'e.g. Pipe fitting, bathroom fitting' },
  electrician: { label: 'Specialization', placeholder: 'e.g. Wiring, AC repair, appliance repair' },
  mistri: { label: 'Specialization', placeholder: 'e.g. Furniture, doors, woodwork' },
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    try {
      const mine = JSON.parse(localStorage.getItem('verilo_my_listings') || '[]');
      setAllowed(mine.includes(id));
    } catch (e) { setAllowed(false); }

    supabase.from('listings').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setForm({
          name: data.name || '', service: data.service || 'plumber',
          qualification: data.qualification || '', experience: data.experience || '',
          about: data.about || '', phone: data.phone || '', area: data.area || '', note: data.note || '',
        });
        setPhotoPreview(data.photo_url || '');
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

      const updatePayload = {
        name: form.name, service: form.service,
        qualification: form.qualification || null, experience: form.experience || null,
        about: form.about || null, phone: form.phone, area: form.area || null, note: form.note || null,
      };
      if (photo_url) updatePayload.photo_url = photo_url;

      const { error: updateError } = await supabase.from('listings').update(updatePayload).eq('id', id);
      if (updateError) throw updateError;

      router.push(`/city/${encodeURIComponent(city)}/${id}`);
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
          <div className="empty-title">Not your listing</div>
          <div>
            You can only edit listings added from this device. Use{' '}
            <Link href={`/city/${encodeURIComponent(city)}/find`} style={{ color: '#E8A33D' }}>Manage my listing</Link>{' '}
            with your phone number to unlock editing.
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
        <Link href={`/city/${encodeURIComponent(city)}/${id}`} className="back-link">← Back to profile</Link>
      </header>

      <form className="form-card" onSubmit={handleSubmit}>
        <h2 style={{ fontFamily: "'Rozha One', serif", color: '#C97F1E', marginTop: 0 }}>Edit Your Listing</h2>

        <label>Photo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F3EEDD', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed #ddd6c4' }}>
            {photoPreview ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
          </div>
          <input type="file" accept="image/*" onChange={handlePhoto} />
        </div>

        <label>Name *</label>
        <input required value={form.name} onChange={(e) => update('name', e.target.value)} />

        <label>Service Type *</label>
        <select value={form.service} onChange={(e) => update('service', e.target.value)}>
          {CATEGORIES.filter((c) => c.key !== 'all').map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>

        <label>{SPECIALIZATION_LABELS[form.service]?.label || 'Specialization'}</label>
        <input value={form.qualification} onChange={(e) => update('qualification', e.target.value)} placeholder={SPECIALIZATION_LABELS[form.service]?.placeholder || ''} />

        <label>Experience</label>
        <input value={form.experience} onChange={(e) => update('experience', e.target.value)} placeholder="e.g. 8 years" />

        <label>About You</label>
        <textarea value={form.about} onChange={(e) => update('about', e.target.value)} />

        <label>Phone Number *</label>
        <input required type="tel" pattern="[0-9]{10}" value={form.phone} onChange={(e) => update('phone', e.target.value)} />

        <label>Area / Locality</label>
        <input value={form.area} onChange={(e) => update('area', e.target.value)} />

        <label>Note (optional)</label>
        <textarea value={form.note} onChange={(e) => update('note', e.target.value)} />

        {error && <p style={{ color: '#C1442E', fontSize: 13.5, marginTop: 10 }}>{error}</p>}

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
