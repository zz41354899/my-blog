import { supabase } from './supabaseClient';
import { Post } from '@/types/index';

// 獲取所有文章
export async function getAllPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('獲取文章時出錯:', error);
    return [];
  }
  
  return data || [];
}

// 通過 slug 獲取單篇文章
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) {
    console.error(`獲取文章 ${slug} 時出錯:`, error);
    return null;
  }
  
  return data;
}

// 獲取當前用戶的所有文章
export async function getCurrentUserPosts(userId?: string | null): Promise<Post[]> {
  if (!userId) {
    console.error('❌ 獲取用戶文章失敗：用戶ID未提供或為空');
    return [];
  }

  try {
    console.log(`📊 嘗試為用戶 ${userId} 獲取文章...`);
    
    // 直接嘗試獲取文章，假設資料表已存在
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      // 檢查是否為表不存在錯誤，僅用於調試
      if (error.code === '42P01') {
        console.error(`❌ 'posts' 資料表不存在，請在 Supabase 中建立此資料表`);
        return [];
      }
      
      console.error(`❌ 獲取用戶文章時出錯:`, JSON.stringify(error));
      return [];
    }
    
    console.log(`✅ 成功獲取 ${data?.length || 0} 篇文章`);
    return data || [];
  } catch (error) {
    console.error(`❌ 獲取用戶文章時發生異常:`, error);
    if (error instanceof Error) {
      console.error(`錯誤消息: ${error.message}`);
    }
    return [];
  }
}

// 創建新文章
export async function createPost(post: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<Post> {
  console.log('📝 開始創建文章:', { title: post.title, slug: post.slug, user_id: post.user_id });
  
  // 檢查必要欄位是否存在
  if (!post.title || !post.slug || !post.content || !post.user_id) {
    const errorMsg = '創建文章失敗：缺少必要欄位';
    console.error('❌ ' + errorMsg, {
      title: !!post.title,
      slug: !!post.slug,
      content: !!post.content,
      user_id: !!post.user_id
    });
    throw new Error(errorMsg);
  }
  
  // 確保 cover_url 不為 undefined，使用空字符串代替
  const safePost = {
    ...post,
    cover_url: post.cover_url || ''
  };
  
  // 確保中文字符可以正確存儲
  const postWithTimestamps = {
    ...safePost,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  try {
    console.log('📤 發送資料到 Supabase:', postWithTimestamps);
    
    const { data, error } = await supabase
      .from('posts')
      .insert([postWithTimestamps])
      .select()
      .single();
    
    if (error) {
      console.error('❌ 插入文章失敗:', error.message, error);
      
      // 處理特定錯誤類型
      if (error.code === '23505') {
        throw new Error(`Slug "${post.slug}" 已存在，請嘗試其他網址名稱`);
      } else if (error.code === '42P01') {
        throw new Error('資料表不存在，請確認 "posts" 表已正確建立');
      } else if (error.code === '42501' || error.message.includes('permission denied')) {
        throw new Error('權限不足，請確認 RLS 策略已設定 (user_id = auth.uid())');
      } else {
        throw new Error(`插入文章失敗: ${error.message}`);
      }
    }
    
    if (!data) {
      throw new Error('創建文章成功但未返回資料');
    }
    
    console.log('✅ 文章創建成功:', data);
    return data;
  } catch (error: unknown) {
    // 如果是我們已經處理過的錯誤就直接拋出
    if (error instanceof Error) {
      throw error;
    }
    
    // 處理其他未預期的錯誤
    console.error('❌ 創建文章時發生未預期錯誤:', error);
    throw new Error(`創建文章失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

// 更新文章
export async function updatePost(
  id: number, 
  userId: string,
  post: Partial<Omit<Post, 'id' | 'created_at' | 'updated_at'>>
): Promise<Post | null> {
  // 確保 cover_url 不為 undefined
  const safePost = {
    ...post,
    cover_url: post.cover_url !== undefined ? post.cover_url : ''
  };
  
  const postWithUpdatedTime = {
    ...safePost,
    updated_at: new Date().toISOString()
  };
  
  try {
    console.log(`🔄 更新文章 ID:${id}, 用戶:${userId}`, postWithUpdatedTime);
    
    const { data, error } = await supabase
      .from('posts')
      .update(postWithUpdatedTime)
      .eq('id', id)
      .eq('user_id', userId) // 確保只更新當前用戶的文章
      .select()
      .single();
    
    if (error) {
      console.error(`❌ 更新文章 ID:${id} 失敗:`, error);
      
      // 處理特定錯誤
      if (error.code === '23505') {
        throw new Error(`Slug "${post.slug}" 已存在，請嘗試其他網址名稱`);
      } else if (error.code === '42501' || error.message.includes('permission denied')) {
        throw new Error('權限不足，請確認您有權限更新此文章');
      }
      
      return null;
    }
    
    console.log(`✅ 文章 ID:${id} 更新成功`);
    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    
    console.error(`❌ 更新文章時發生未預期錯誤:`, error);
    throw new Error(`更新文章失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

// 刪除文章
export async function deletePost(id: number, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId); // 確保只刪除當前用戶的文章
  
  if (error) {
    console.error(`刪除文章 ID:${id} 時出錯:`, error);
    return false;
  }
  
  return true;
} 
 