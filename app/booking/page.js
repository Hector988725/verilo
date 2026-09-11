'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
import { supabase } from '../../lib/supabaseClient';
import { catLabel } from '../../lib/categories';

const STATUS_STYLE = {
  new: { label: 'Sent — waiting for reply', color: 'var(--marigold-deep)', bg: 'rgba(232,163,61,0.15)' },
  accepted: { label: 'Accepted', color: '#2E6B4E', bg: 'rgba(46,107,78,0.12)' },
  rejected: { label: 'Declined', color: 'var(--vermillion)', bg: 'rgba(193,68,46,0.12)' },
  completed: { label: 'Completed', color: 'var(--muted)', bg: 'rgba(0,0,0,0.05)' },
};

export default function BookingsPage() {
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) { setFetching(false); return; }
    async function load() {
      const { data } = await supabase
        .from('bookings')
        .select('id, message, status, created_at, listing:listings(id, name, service, city_id, cities(name))')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      setBookings(data || []);
      setFetching(false);
    }
    load();
  }, [user]);

  if (loading || fetching) return <div className="wrap"><p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading...</p></div>;

  if (!user) {
    return (
      <div className="city-screen">
        <div className="pin"></div>
        <h1>Verilo</h1>
        <p className="tagline">Sign in to see your bookings</p>
        <Link href="/profile" className="btn-primary" style={{ maxWidth: 260, textAlign: 'center', textDecoration: 'none', display: 'block', marginTop: 18 }}>
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="wrap">
      <header>
        <div className="pin"></div>
        <h1>Verilo</h1>
        <p className="tagline">📋 Your Bookings & Enquiries</p>
      </header>

      {bookings.length === 0 && (
        <div className="empty">
          <div className="empty-title">No enquiries yet</div>
          <div>Send an enquiry from any listing's page and it'll show up here</div>
        </div>
      )}

      {bookings.map((b) => {
        const s = STATUS_STYLE[b.status] || STATUS_STYLE.new;
        return (
          <Link
            key={b.id}
            href={b.listing ? `/city/${encodeURIComponent(b.listing.cities?.name || '')}/${b.listing.id}` : '#'}
            className="card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                {b.listing && <div className="card-service">{catLabel(b.listing.service)}</div>}
                <p className="card-name">{b.listing?.name || 'Listing removed'}</p>
                {b.message && <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0', fontStyle: 'italic' }}>"{b.message}"</p>}
                <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '6px 0 0' }}>
                  {new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <span style={{ flex: '0 0 auto', fontSize: 11.5, fontWeight: 700, color: s.color, background: s.bg, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
