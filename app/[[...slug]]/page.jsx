import { notFound } from 'next/navigation';
import { getPage, pages } from '../../lib/content';
import ReplicaContent from '../../components/ReplicaContent';
import { pageSeo } from '../../lib/seo.mjs';
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(pages).map(path => ({ slug: path === '/' ? [] : path.split('/').filter(Boolean) })); }
export async function generateMetadata({ params }) {
 const { slug } = await params; const page = getPage(slug);
 return page ? pageSeo(page) : { title: 'Page not found', robots: { index: false, follow: true } };
}
export default async function Page({ params }) {
 const { slug } = await params; const page = getPage(slug); if (!page) notFound();
 return <ReplicaContent page={page}/>;
}
