// types/index.ts
export interface BlogPost {
  id: string
  // Vietnamese fields
  title_vi: string
  excerpt_vi: string
  content_vi: string
  slug_vi: string
  meta_title_vi: string
  meta_description_vi: string
  // English fields
  title_en: string
  excerpt_en: string
  content_en: string
  slug_en: string
  meta_title_en: string
  meta_description_en: string
  // Common fields
  image: string
  date: string
  author: string
  category: string
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
  user_id: string
  views: number
}
