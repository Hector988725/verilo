'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { supabase } from '../../../../lib/supabaseClient';
import { CATEGORIES } from '../../../../lib/categories';

const SPECIALIZATION_LABELS = {
  doctor: { label: 'Qualification / Specialization', placeholder: 'e.g. MBBS, General Physician' },
  tuition: { label: 'Subject(s) You Teach', placeholder: 'e.g. Maths & Science, Class 9-12' },
  plumber: { label: 'Specialization', placeholder: 'e.g. Pipe fitting, bathroom fitting' },
  electrician: { label: 'Specialization', placeholder: 'e.g. Wiring, AC repair, appliance repair' },
  mistri: { label: 'Specialization', placeholder: 'e.g. Furniture, doors, woodwork' },
  'milk-veg': { label: 'What You Deliver', placeholder: 'e.g. Fresh milk, seasonal vegetables' },
  other: { label: 'Specialization', placeholder: 'What do you specialize in?' },
};

export default function AddListingPage() {
  const params = useParams();
  const router = useRouter();
  const city = decodeURIComponent(params.city);

  const [form, setForm] = useState({
    name: '', service: 'plumber', qualification: '', experience: '',
    about: '', phone: '', area: '', note: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      // 1. Ensure city exists, get id
      let { data: cityRow } = await supabase.from('cities').select('id').eq('name', city).maybeSingle();
      if (!cityRow) {
        const { data: newCity } = await supabase.from('cities').insert({ name: city }).select().single();
        cityRow = newCity;
      }

      // 2. Upload photo if provided
      let photo_url = null;
      if (photoFile) {
        const fileName = `${Date.now()}-${photoFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase
          .storage.from('listing-photos').upload(fileName, photoFile);
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from('listing-photos').getPublicUrl(fileName);
        photo_url = publicUrl.publicUrl;
      }

      // 3. Insert listing
      const { data: listing, error: insertError } = await supabase.from('listings').insert({
        city_id: cityRow.id,
        name: form.name,
        service: form.service,
        qualification: form.qualification || null,
        experience: form.experience || null,
        about: form.about || null,
        phone: form.phone,
        area: form.area || null,
        note: form.note || null,
        photo_url,
      }).select().single();
      if (insertError) throw insertError;

      // 4. Redirect to their profile — payment happens after trial via the profile page's "Pay Now" button
      // Remember this listing as "mine" on this device, so only the owner
      // sees payment/trial controls on the profile page (not customers browsing).
      try {
        const mine = JSON.parse(localStorage.getItem('verilo_my_listings') || '[]');
        if (!mine.includes(listing.id)) mine.push(listing.id);
        localStorage.setItem('verilo_my_listings', JSON.stringify(mine));
      } catch (e) {}

      router.push(`/city/${encodeURIComponent(city)}/${listing.id}/manage?welcome=1`);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wrap">
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <Link href={`/city/${encodeURIComponent(city)}`} className="back-link">← Back to {city} listings</Link>
      </header>

      <form className="form-card" onSubmit={handleSubmit}>
        <h2 style={{ fontFamily: "'Rozha One', serif", color: '#C97F1E', marginTop: 0 }}>Add a New Listing</h2>

        <label>Photo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F3EEDD', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed #ddd6c4' }}>
            {photoPreview ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
          </div>
          <input type="file" accept="image/*" onChange={handlePhoto} />
        </div>

        <label>Name *</label>
        <input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Ramesh Kumar" />

        <label>Service Type *</label>
        <select value={form.service} onChange={(e) => update('service', e.target.value)}>
          {CATEGORIES.filter((c) => c.key !== 'all').map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>

        <label>{SPECIALIZATION_LABELS[form.service]?.label || 'Specialization'}</label>
        <input value={form.qualification} onChange={(e) => update('qualification', e.target.value)} placeholder={SPECIALIZATION_LABELS[form.service]?.placeholder || ''} />

        <label>Experience</label>
        <input value={form.experience} onChange={(e) => update('experience', e.target.value)} placeholder="e.g. 8 years" />

        <label>About You</label>
        <textarea value={form.about} onChange={(e) => update('about', e.target.value)} placeholder="Tell people what you do and why they should trust you" />

        <label>Phone Number *</label>
        <input required type="tel" pattern="[0-9]{10}" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="10-digit number" />

        <label>Area / Locality</label>
        <input value={form.area} onChange={(e) => update('area', e.target.value)} placeholder="e.g. Gandhi Nagar" />

        <label>Note (optional)</label>
        <textarea value={form.note} onChange={(e) => update('note', e.target.value)} placeholder="e.g. Available 9 AM - 1 PM" />

        {error && <p style={{ color: '#C1442E', fontSize: 13.5, marginTop: 10 }}>{error}</p>}

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Listing'}
        </button>
        <p className="status-note">First 15 days completely free — small monthly fee after that</p>
      </form>
    </div>
  );
}
