import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import supabase from '@/lib/supabase';

const execPromise = util.promisify(exec);

export async function POST(request) {
  try {
    const dbUrl = process.env.DATABASE_URL || '';
    
    if (!dbUrl) {
      return NextResponse.json(
        { success: false, error: 'DATABASE_URL is not defined in environment variables' },
        { status: 400 }
      );
    }

    // This creates a timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    
    // We use a tmp dir (make sure it exists or use os.tmpdir())
    const tmpDir = require('os').tmpdir();
    const filePath = path.join(tmpDir, filename);

    // 1. Run pg_dump (Assuming pg_dump is installed on the server/VPS)
    // NOTE: This will fail in Vercel Serverless Functions unless custom binaries are added.
    const command = `pg_dump "${dbUrl}" > "${filePath}"`;
    await execPromise(command);

    // 2. Read the file
    const fileBuffer = fs.readFileSync(filePath);

    // 3. Upload to Supabase Storage 'backups' bucket
    const { data, error } = await supabase.storage
      .from('backups')
      .upload(filename, fileBuffer, {
        contentType: 'application/sql',
        upsert: false
      });

    if (error) {
      console.error('Supabase Storage Error:', error);
      throw error;
    }

    // 4. Cleanup local file
    fs.unlinkSync(filePath);

    return NextResponse.json({
      success: true,
      message: 'Backup completed and uploaded successfully',
      file: data
    });

  } catch (error) {
    console.error('Backup API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to trigger backup. Ensure pg_dump is installed if running locally/VPS.',
        details: error.message
      },
      { status: 500 }
    );
  }
}
