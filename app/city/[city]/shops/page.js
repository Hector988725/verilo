import ShopsClient from './ShopsClient';

export async function generateMetadata({ params }) {
  const city = decodeURIComponent(params.city);
  const title = `Shops in ${city} | Verilo`;
  const description = `Local shops in ${city} you can order from online or visit.`;
  return { title, description, openGraph: { title, description } };
}

export default function ShopsPage() {
  return <ShopsClient />;
}
