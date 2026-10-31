import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import {
  ROOT_FOLDER_NAME,
  STANDARD_DRIVE_SECTIONS,
  PRODUCT_CATALOG_CATEGORIES,
  getStoredTokens,
} from '@/lib/storage/google-drive';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'super_admin' && user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const tokens = await getStoredTokens();

    const structure = {
      root: {
        name: ROOT_FOLDER_NAME,
        id: tokens?.rootFolderId || 'root',
        subfolders: STANDARD_DRIVE_SECTIONS.map((section) => ({
          name: section,
          subfolders:
            section === 'Product Catalog'
              ? PRODUCT_CATALOG_CATEGORIES.map((cat) => ({ name: cat }))
              : [],
        })),
      },
    };

    return NextResponse.json({
      success: true,
      structure,
      isConnected: Boolean(tokens?.isConnected),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to list folders' },
      { status: 500 }
    );
  }
}
