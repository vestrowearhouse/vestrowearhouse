import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { getAdminSupabase } from '@/lib/dbExplorer';

export const dynamic = 'force-dynamic';

const getSupabase = () => getAdminSupabase();

export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getSupabase();

    const { data: dbLogs } = await supabase
      .from('build_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    const vercelToken = process.env.VERCEL_API_TOKEN || process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;

    let vercelDeployments = [];
    if (vercelToken && vercelProjectId) {
      try {
        const vRes = await fetch(`https://api.vercel.com/v6/deployments?projectId=${vercelProjectId}&limit=20`, {
          headers: { Authorization: `Bearer ${vercelToken}` },
        });
        if (vRes.ok) {
          const vData = await vRes.json();
          vercelDeployments = (vData.deployments || []).map(d => ({
            id: d.uid,
            deployment_id: d.uid,
            status: d.readyState === 'READY' ? 'success' : d.readyState === 'ERROR' ? 'failed' : 'building',
            target: d.target || 'production',
            domain: d.url ? `https://${d.url}` : 'https://www.stellarmartbd.com',
            commit_message: d.meta?.githubCommitMessage || 'Production deployment',
            duration_sec: d.buildingAt && d.ready ? Math.round((d.ready - d.buildingAt) / 1000) : null,
            created_at: new Date(d.createdAt).toISOString(),
            terminal_lines: [
              `▲ Vercel Deployment: ${d.name || 'stellarmart'} (${d.uid})`,
              `State: ${d.readyState}`,
              `Commit: ${d.meta?.githubCommitMessage || 'N/A'}`
            ]
          }));
        }
      } catch (vErr) {
        console.error('Vercel API fetch error:', vErr);
      }
    }

    let merged = [];
    if (vercelDeployments.length > 0) {
      merged = vercelDeployments;
    } else if (dbLogs && dbLogs.length > 0) {
      merged = dbLogs.map(item => ({
        id: item.id,
        deployment_id: item.deployment_id || `dpl_${String(item.id).slice(0, 10)}`,
        status: item.status || 'success',
        target: 'production',
        domain: 'https://www.stellarmartbd.com',
        commit_message: item.commit_message || 'Deployment update',
        duration_sec: item.duration_sec || null,
        created_at: item.created_at,
        terminal_lines: [
          `▲ Deployment event registered (${item.status})`,
          `Message: ${item.commit_message || 'System build'}`,
          `Time: ${item.created_at}`
        ]
      }));
    }

    const successCount = merged.filter(m => m.status === 'success').length;
    const successRate = merged.length > 0 ? `${Math.round((successCount / merged.length) * 100)}%` : 'N/A';

    return NextResponse.json({
      success: true,
      deployments: merged,
      latest: merged[0] || null,
      stats: {
        totalBuilds: merged.length,
        successRate,
        avgBuildTime: merged.length > 0 ? 'N/A' : 'N/A',
        environment: vercelToken ? 'Vercel API (Live)' : 'Database Audit (build_logs)'
      }
    });
  } catch (error) {
    console.error('Build logs error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch build logs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const supabase = getSupabase();

    await supabase.from('build_logs').insert([{
      status: body.status || 'success',
      commit_message: body.commit_message || 'Admin triggered build telemetry refresh'
    }]);

    return NextResponse.json({
      success: true,
      message: 'Build event logged successfully.'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to record build event' }, { status: 500 });
  }
}
