import { supabase } from './supabaseClient';

/**
 * 创建一个新文章
 */
export async function createPost(postData: {
  title: string;
  slug: string;
  content: string;
  coverUrl: string | null;
}) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          title: postData.title,
          slug: postData.slug,
          content: postData.content,
          cover_url: postData.coverUrl,
          published_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

/**
 * 更新现有文章
 */
export async function updatePost(
  postId: string,
  postData: {
    title: string;
    slug: string;
    content: string;
    coverUrl: string | null;
  }
) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .update({
        title: postData.title,
        slug: postData.slug,
        content: postData.content,
        cover_url: postData.coverUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

/**
 * 获取文章列表
 */
export async function getPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}

/**
 * 获取单个文章
 */
export async function getPost(id: string) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
}

/**
 * 删除文章
 */
export async function deletePost(id: string) {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
} 