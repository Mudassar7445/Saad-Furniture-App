import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { mediaFolders, mediaFiles } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  await initializeDatabase();
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const folders = await db.select().from(mediaFolders).orderBy(mediaFolders.name);
  const allFiles = await db.select({ id: mediaFiles.id, folderId: mediaFiles.folderId, category: mediaFiles.category }).from(mediaFiles);

  const foldersWithCount = folders.map((f) => {
    const count = allFiles.filter((file) => file.folderId === f.id || file.category === f.category).length;
    return {
      ...f,
      fileCount: count,
    };
  });

  return NextResponse.json({ folders: foldersWithCount });
}

export async function POST(request: Request) {
  await initializeDatabase();
  const sessionUser = await getSessionUser();
  if (!sessionUser || (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('media'))) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, category = 'general', parentId = null, icon = 'Folder', color = '#B99A68' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required.' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const folderId = `fld_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    await db.insert(mediaFolders).values({
      id: folderId,
      name: name.trim(),
      slug,
      category,
      parentId,
      icon,
      color,
      isSystem: 0,
      createdAt: now,
      createdBy: sessionUser.name,
    });

    return NextResponse.json({
      success: true,
      folder: {
        id: folderId,
        name: name.trim(),
        slug,
        category,
        parentId,
        icon,
        color,
        isSystem: 0,
        createdAt: now,
        createdBy: sessionUser.name,
        fileCount: 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create folder' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  await initializeDatabase();
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: Super Admin only.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get('id');

  if (!folderId) {
    return NextResponse.json({ error: 'Folder ID is required.' }, { status: 400 });
  }

  const [folder] = await db.select().from(mediaFolders).where(eq(mediaFolders.id, folderId)).limit(1);
  if (!folder) {
    return NextResponse.json({ error: 'Folder not found.' }, { status: 404 });
  }

  if (folder.isSystem === 1) {
    return NextResponse.json({ error: 'Default system category folders cannot be deleted.' }, { status: 400 });
  }

  await db.delete(mediaFolders).where(eq(mediaFolders.id, folderId));
  return NextResponse.json({ success: true, message: 'Folder deleted.' });
}
