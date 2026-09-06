import { createClient } from '@supabase/supabase-js';
import ProfileClient from './ProfileClient';

const CATEGORY_LABELS = {
  doctor: 'Doctor', plumber: 'Plumber', electrician: 'Electrician', mistri: 'Carpenter/Mistri',
  mechanic: 'Mechanic', 'ac-repair': 'AC/Appliance Repair', beautician: 'Beauty Parlour/Salon',
  tailor: 'Tailor', tuition: 'Tuition Teacher', 'milk-veg': 'Milk/Veg Delivery', other: 'Service Provider',
};

export async function generateMetadata({ params }) {
  const city = decodeURIComponent(params.city);
  const id = params.id;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data: listing } = await supabase
      .from('listings')
      .select('name, service, qualification, about, photo_url, area')
      .eq('id', id)
      .single();

    if (!listing) {
      return { title: `Listing | Verilo`, description: 'Find trusted local professionals on Verilo.' };
    }

    const serviceLabel = CATEGORY_LABELS[listing.service] || 'Service Provider';
    const title = `${listing.name} — ${serviceLabel} in ${city} | Verilo`;
    const descriptionParts = [
      `${listing.name} is a ${serviceLabel.toLowerCase()}`,
      listing.area ? `in ${listing.area}, ${city}` : `in ${city}`,
      listing.qualification ? `— ${listing.qualification}` : '',
    ];
    const description = (listing.about || descriptionParts.join(' ')).slice(0, 155);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: listing.photo_url ? [listing.photo_url] : undefined,
      },
    };
  } catch (e) {
    return { title: 'Verilo', description: 'Find trusted local professionals on Verilo.' };
  }
}

export default function ProfilePage() {
  return <ProfileClient />;
}
