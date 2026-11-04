import CityPageClient from './CityPageClient';

export async function generateMetadata(props) {
  const params = await props.params;
  const city = decodeURIComponent(params.city);
  const title = `Plumbers, Electricians, Tutors & More in ${city} | Verilo`;
  const description = `Find trusted, rated plumbers, electricians, tutors and other local professionals in ${city}. Call directly — no middleman.`;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default function CityPage() {
  return <CityPageClient />;
}
