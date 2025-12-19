export interface BlogPost {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  category: string;
  author: string;
  status: 'published' | 'draft';
  date: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
  readTime?: string;           // Thời gian đọc
  views?: number;              // Số lượt xem
  likes?: number;              // Số lượt thích
  slug?: string;               // URL slug
  tags?: string[];            // Tags
  featured?: boolean;         // Bài nổi bật
  metaDescription?: string;   // Meta description cho SEO
  comments?: number;          // Số lượng bình luận
}

export interface EnhancedBlogPost extends BlogPost {
  readTime: string;
  views: number;
  likes: number;
  slug: string;
  tags: string[];
  excerpt: string;
  updated_at: string;
  comments: number;
}

export interface BlogFilters {
  searchTerm: string;
  category: string;
  sortBy: 'newest' | 'popular';
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface BlogComment {
  id: string;
  postId: string;
  author: string;
  content: string;
  date: string;
  likes: number;
  replies?: BlogComment[];
}