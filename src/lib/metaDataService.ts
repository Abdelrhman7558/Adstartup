import { supabase } from './supabase';

export interface MetaPage {
  id: string;
  page_id: string;
  page_name: string;
  page_picture_url?: string;
  is_selected: boolean;
}

export interface CatalogData {
  id: string;
  catalog_id: string;
  catalog_name?: string;
}

export async function fetchUserPages(userId: string): Promise<MetaPage[]> {
  if (!userId) return [];

  try {
    console.log('[MetaDataService] Fetching pages for user:', userId);

    const pages: MetaPage[] = [];

    const { data: metaPagesData, error: metaPagesError } = await supabase
      .from('meta_pages')
      .select('id, page_id, page_name, page_picture_url, is_selected')
      .eq('user_id', userId)
      .eq('is_selected', true)
      .order('created_at', { ascending: false });

    if (!metaPagesError && metaPagesData && metaPagesData.length > 0) {
      console.log('[MetaDataService] Pages from meta_pages table:', metaPagesData.length);
      pages.push(...metaPagesData);
    }

    if (pages.length === 0) {
      console.log('[MetaDataService] No pages in meta_pages, trying meta_connections...');
      const { data: connectionPages, error: connectionError } = await supabase
        .from('meta_connections')
        .select('id, page_id, page_name')
        .eq('user_id', userId)
        .not('page_id', 'is', null)
        .order('updated_at', { ascending: false });

      if (!connectionError && connectionPages && connectionPages.length > 0) {
        console.log('[MetaDataService] Pages from meta_connections table:', connectionPages.length);
        pages.push(
          ...connectionPages.map(conn => ({
            id: conn.id,
            page_id: conn.page_id,
            page_name: conn.page_name || `Page ${conn.page_id.slice(0, 8)}...`,
            is_selected: true,
          }))
        );
      }
    }

    console.log('[MetaDataService] Total pages fetched:', pages.length);
    return pages;
  } catch (error) {
    console.error('[MetaDataService] Exception fetching pages:', error);
    return [];
  }
}

export async function fetchUserCatalogs(userId: string): Promise<CatalogData[]> {
  if (!userId) return [];

  try {
    console.log('[MetaDataService] Fetching catalogs for user:', userId);

    const { data: connections, error } = await supabase
      .from('meta_connections')
      .select('id, catalog_id, catalog_name')
      .eq('user_id', userId)
      .not('catalog_id', 'is', null);

    if (error) {
      console.error('[MetaDataService] Error fetching catalogs:', error);
      return [];
    }

    const catalogs: CatalogData[] = [];

    if (connections && connections.length > 0) {
      for (const conn of connections) {
        if (conn.catalog_id) {
          catalogs.push({
            id: conn.id,
            catalog_id: conn.catalog_id,
            catalog_name: conn.catalog_name || `Catalog: ${conn.catalog_id.slice(0, 8)}...`,
          });
        }
      }
    }

    console.log('[MetaDataService] Catalogs fetched:', catalogs.length);
    return catalogs;
  } catch (error) {
    console.error('[MetaDataService] Exception fetching catalogs:', error);
    return [];
  }
}

export async function saveMetaPages(userId: string, pages: Array<{ page_id: string; page_name: string }>) {
  if (!userId) return false;

  try {
    console.log('[MetaDataService] Saving pages for user:', userId);

    const { error } = await supabase
      .from('meta_pages')
      .upsert(
        pages.map(page => ({
          user_id: userId,
          page_id: page.page_id,
          page_name: page.page_name,
          is_selected: true,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'user_id,page_id' }
      );

    if (error) {
      console.error('[MetaDataService] Error saving pages:', error);
      return false;
    }

    console.log('[MetaDataService] Pages saved successfully');
    return true;
  } catch (error) {
    console.error('[MetaDataService] Exception saving pages:', error);
    return false;
  }
}
