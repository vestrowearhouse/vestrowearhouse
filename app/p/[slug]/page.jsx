import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Calendar, ChevronRight, FileText, Globe, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getPage(slug) {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data;
}

export async function generateMetadata({ params }) {
  const page = await getPage(params.slug);
  if (!page) {
    return {
      title: 'Page Not Found | StellarMartBD',
      description: 'The requested page could not be found on StellarMartBD.'
    };
  }

  return {
    title: page.meta_title || `${page.title_en} | StellarMartBD`,
    description: page.meta_description || `Read ${page.title_en} on StellarMartBD.`,
    openGraph: {
      title: page.meta_title || page.title_en,
      description: page.meta_description,
      type: 'article',
    }
  };
}

export default async function DynamicCMSPage({ params }) {
  const page = await getPage(params.slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Top Breadcrumb & Hero */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white py-12 px-4 shadow-inner">
        <div className="max-w-4xl mx-auto space-y-4">
          <nav className="flex items-center gap-2 text-xs text-blue-200">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Pages</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white font-medium truncate max-w-xs">{page.title_en}</span>
          </nav>
          
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {page.title_en}
            </h1>
            {page.title_bn && (
              <p className="text-blue-200 text-lg font-medium">{page.title_bn}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-blue-200/90 pt-2 border-t border-blue-600/50">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Last updated: {new Date(page.updated_at || page.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>StellarMartBD Verified Policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <main className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-10">
          <article 
            className="prose prose-blue max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-table:border prose-th:bg-gray-50 prose-th:p-3 prose-td:p-3 prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800"
            dangerouslySetInnerHTML={{ __html: page.content_en }}
          />

          {page.content_bn && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>বাংলা সংস্করণ (Bengali Version)</span>
              </h3>
              <article 
                className="prose prose-blue max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: page.content_bn }}
              />
            </div>
          )}

          {/* Bottom Back Button */}
          <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Home
            </Link>
            <span className="text-xs text-gray-400 font-mono">/p/{page.slug}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
