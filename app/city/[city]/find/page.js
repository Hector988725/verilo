'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';
import { catLabel, initials } from '../../../../lib/categories';
import { getAllMyListings } from '../../../../lib/ownership';

// This used to let anyone "recover" a listing by typing in its phone number —
// but phone numbers are public (shown on the Call button), so that let a
// stranger claim someone else's listing. Instead: first check this browser's
// own saved links (the normal case — same phone/browser used to add it), and
// only fall back to human WhatsApp verification if nothing is found locally.
export default function FindListingPage() {
  const params = useParams();
  const city = decodeURIComponent(params.city);

  const [myListings, setMyListings] = useState(null); // null = loading, [] = none found

  useEffect(() => {
    async function load() {
      const map = getAllMyListings();
      const ids = Object.keys(map);
      if (ids.length === 0) { setMyListings([]); return; }

      const { data } = await supabase
        .from('listings')
        .select('id, name, service, photo_url, city_id, cities(name)')
        .in('id', ids);

      setMyListings(data || []);
    }
    load();
  }, []);

  const supportPhone = '918959992195';
  const message = encodeURIComponent(
    `Hi, I added my listing on Verilo (${city}) but lost my management link. My registered phone number is: `
  );

  return (
    <div className="wrap">
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <Link href={`/city/${encodeURIComponent(city)}`} className="back-link">← Back to {city} listings</Link>
      </header>

      {myListings === null && (
        <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Checking this device for your listings...</p>
      )}

      {myListings && myListings.length > 0 && (
        <>
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13.5, marginBottom: 14 }}>
            Found {myListings.length} listing{myListings.length > 1 ? 's' : ''} linked to this device:
          </p>
          {myListings.map((l) => (
            <Link
              key={l.id}
              href={`/city/${encodeURIComponent(l.cities?.name || city)}/${l.id}/manage`}
              className="card"
            >
              <div className="card-left">
                <div className="avatar">{l.photo_url ? <img src={l.photo_url} alt="" /> : initials(l.name)}</div>
                <div>
                  <div className="card-service">{catLabel(l.service)}</div>
                  <p className="card-name">{l.name}</p>
                </div>
              </div>
            </Link>
          ))}
        </>
      )}

      {myListings && myListings.length === 0 && (
        <div className="form-card">
          <h2 style={{ fontFamily: "'Rozha One', serif", color: '#C97F1E', marginTop: 0 }}>
            Lost Access to Your Listing?
          </h2>
          <p style={{ color: '#6B7280', fontSize: 14 }}>
            We couldn't find any listing linked to this device/browser. If you added your listing
            from a different phone or browser, try opening this page there instead.
          </p>
          <p style={{ color: '#6B7280', fontSize: 14 }}>
            Otherwise, message us on WhatsApp with your registered phone number and we'll verify
            and send your management link back to you.
          </p>
          <a
            href={`https://wa.me/${supportPhone}?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
          >
            💬 Message Support on WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
