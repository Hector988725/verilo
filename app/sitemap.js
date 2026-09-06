import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://verilo-seven.vercel.app';

export default async function sitemap() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const staticEntries = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  ];

  try {
    const { data: cities } = await supabase.from('cities').select('name');
    const cityEntries = (cities || []).map((c) => ({
      url: `${BASE_URL}/city/${encodeURIComponent(c.name)}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    const { data: listings } = await supabase
      .from('listings')
      .select('id, city_id, cities(name)')
      .eq('is_active', true);
    const listingEntries = (listings || [])
      .filter((l) => l.cities?.name)
      .map((l) => ({
        url: `${BASE_URL}/city/${encodeURIComponent(l.cities.name)}/${l.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));

    return [...staticEntries, ...cityEntries, ...listingEntries];
  } catch (e) {
    return staticEntries;
  }
}
