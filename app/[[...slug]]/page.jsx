import { notFound } from 'next/navigation';
import { getPage, pages } from '../../lib/content';
import ReplicaPage from '../../components/ReplicaPage';
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(pages).map(path => ({ slug: path === '/' ? [] : path.split('/').filter(Boolean) })); }
export async function generateMetadata({ params }) {
 const { slug } = await params; const page = getPage(slug);
 return { title: page?.title || 'Page not found', description: page?.description };
}
export default async function Page({ params }) {
 const { slug } = await params; const page = getPage(slug); if (!page) notFound();
 return <ReplicaPage page={page}/>;
}
