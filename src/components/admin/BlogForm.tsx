// src/components/admin/BlogForm.tsx
import { useState, useRef, useEffect } from 'react'
import { BlogPost } from '@/types'
import { supabase } from '@/services/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, AlertCircle, Eye, Globe, Languages } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import RichTextEditor from "@/components/RichTextEditorQuill"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { translateBulk } from "@/services/openai.service"
import { toast } from "sonner"

interface BlogFormProps {
  post?: BlogPost | null
  onSuccess: () => void
  onCancel?: () => void
  isSubmitting?: boolean
  setIsSubmitting?: (value: boolean) => void
}

const categories = [
  'Tin tức',
  'Hướng dẫn',
  'Review',
  'Công nghệ',
  'Sản phẩm',
  'Pháp lý',
  'Nhiếp ảnh',
  'Bảo trì',
]

type Language = 'vi' | 'en'

export const BlogForm: React.FC<BlogFormProps> = ({ 
  post, 
  onSuccess, 
  onCancel,
  isSubmitting = false,
  setIsSubmitting
}) => {
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string>(post?.image || '')
  const [error, setError] = useState<string>('')
  const [activeLanguage, setActiveLanguage] = useState<Language>('vi')
  const [isTranslating, setIsTranslating] = useState(false)
  const [seoChecks, setSeoChecks] = useState({
    vi: {
      hasTitle: false,
      hasContent: false,
      hasMetaDescription: false,
      hasHeadings: false,
    },
    en: {
      hasTitle: false,
      hasContent: false,
      hasMetaDescription: false,
      hasHeadings: false,
    }
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    // Common fields
    image: post?.image || '',
    date: post?.date || new Date().toISOString().split('T')[0],
    author: post?.author || '',
    category: post?.category || categories[0],
    status: post?.status || 'draft',
    
    // Vietnamese fields
    title_vi: post?.title_vi || '',
    excerpt_vi: post?.excerpt_vi || '',
    content_vi: post?.content_vi || '',
    slug_vi: post?.slug_vi || '',
    meta_title_vi: post?.meta_title_vi || '',
    meta_description_vi: post?.meta_description_vi || '',
    
    // English fields
    title_en: post?.title_en || '',
    excerpt_en: post?.excerpt_en || '',
    content_en: post?.content_en || '',
    slug_en: post?.slug_en || '',
    meta_title_en: post?.meta_title_en || '',
    meta_description_en: post?.meta_description_en || '',
  })

  // Auto-generate slugs from titles
  useEffect(() => {
    const createSlug = (text: string) => {
      if (!text.trim()) return ''
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
    }

    if (activeLanguage === 'vi' && !formData.slug_vi && formData.title_vi) {
      setFormData(prev => ({ ...prev, slug_vi: createSlug(formData.title_vi) }))
    }
    if (activeLanguage === 'en' && !formData.slug_en && formData.title_en) {
      setFormData(prev => ({ ...prev, slug_en: createSlug(formData.title_en) }))
    }
  }, [formData.title_vi, formData.title_en, activeLanguage, formData.slug_vi, formData.slug_en])

  // Kiểm tra SEO khi formData thay đổi
  useEffect(() => {
    checkSEO()
  }, [formData, activeLanguage])

  const checkSEO = () => {
    const checksVi = {
      hasTitle: formData.title_vi.length > 10 && formData.title_vi.length < 70,
      hasContent: formData.content_vi.length > 300,
      hasMetaDescription: formData.excerpt_vi.length >= 120 && formData.excerpt_vi.length <= 160,
      hasHeadings: /<h[1-3][^>]*>.*?<\/h[1-3]>/i.test(formData.content_vi),
    }

    const checksEn = {
      hasTitle: formData.title_en.length > 10 && formData.title_en.length < 70,
      hasContent: formData.content_en.length > 300,
      hasMetaDescription: formData.excerpt_en.length >= 120 && formData.excerpt_en.length <= 160,
      hasHeadings: /<h[1-3][^>]*>.*?<\/h[1-3]>/i.test(formData.content_en),
    }

    setSeoChecks({
      vi: checksVi,
      en: checksEn
    })
  }

  const handleAutoTranslate = async () => {
    // Kiểm tra xem có nội dung tiếng Việt không
    if (!formData.title_vi.trim() && !formData.content_vi.trim() && !formData.excerpt_vi.trim()) {
      toast.error('Vui lòng nhập nội dung tiếng Việt trước khi dịch')
      return
    }

    setIsTranslating(true)
    setError('')

    try {
      toast.info('Đang dịch toàn bộ nội dung sang tiếng Anh...', { duration: 2000 })

      // Chuẩn bị dữ liệu cần dịch
      const textsToTranslate: Record<string, string> = {}

      if (formData.title_vi.trim()) {
        textsToTranslate.title_en = formData.title_vi
      }

      if (formData.excerpt_vi.trim()) {
        textsToTranslate.excerpt_en = formData.excerpt_vi
      }

      if (formData.content_vi.trim()) {
        textsToTranslate.content_en = formData.content_vi
      }

      // Gọi API 1 lần duy nhất để dịch toàn bộ
      const translatedData = await translateBulk(textsToTranslate, 'Vietnamese', 'English')

      // Tự động tạo slug từ title đã dịch
      if (translatedData.title_en) {
        const createSlug = (text: string) => {
          return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim()
        }
        translatedData.slug_en = createSlug(translatedData.title_en)
      }

      // Tự động tạo meta_title_en từ title_en
      if (translatedData.title_en) {
        translatedData.meta_title_en = translatedData.title_en.substring(0, 60)
      }

      // Tự động tạo meta_description_en từ excerpt_en
      if (translatedData.excerpt_en) {
        translatedData.meta_description_en = translatedData.excerpt_en.substring(0, 160)
      }

      // Cập nhật formData
      setFormData(prev => ({
        ...prev,
        ...translatedData
      }))

      toast.success('✅ Dịch thành công! Đã tự động tạo SEO meta tags.')
      setActiveLanguage('en') // Chuyển sang tab tiếng Anh để xem kết quả
    } catch (error: any) {
      console.error('Translation error:', error)
      setError(error.message || 'Có lỗi khi dịch nội dung. Vui lòng thử lại.')
      toast.error('Có lỗi khi dịch nội dung')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)

    try {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setError('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `blog-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath)

      setPreviewImage(publicUrl)
      setFormData(prev => ({ ...prev, image: publicUrl }))

    } catch (error: any) {
      console.error('Error uploading image:', error)
      if (error.message?.includes('bucket') || error.message?.includes('not found')) {
        setError('Bucket "blog-images" chưa được tạo trong Supabase.')
      } else {
        setError(`Có lỗi khi upload ảnh: ${error.message}`)
      }
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setPreviewImage('')
    setFormData(prev => ({ ...prev, image: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (setIsSubmitting) {
      setIsSubmitting(true)
    }

    try {
      // Validate required fields
      if (!formData.title_vi.trim()) {
        setError('Vui lòng nhập tiêu đề tiếng Việt')
        return
      }
      if (!formData.slug_vi.trim()) {
        setError('Vui lòng nhập slug tiếng Việt')
        return
      }
      if (!formData.image.trim()) {
        setError('Vui lòng thêm hình ảnh cho bài viết')
        return
      }

      const blogData: any = {
        // Common fields
        image: formData.image,
        date: formData.date,
        author: formData.author.trim() || 'Admin',
        category: formData.category,
        status: formData.status,
        
        // Vietnamese fields
        title_vi: formData.title_vi.trim(),
        excerpt_vi: formData.excerpt_vi.trim(),
        content_vi: formData.content_vi.trim(),
        slug_vi: formData.slug_vi.trim(),
        meta_title_vi: formData.meta_title_vi.trim() || formData.title_vi.substring(0, 60),
        meta_description_vi: formData.meta_description_vi.trim() || formData.excerpt_vi.substring(0, 160),
        
        // English fields (optional)
        title_en: formData.title_en.trim() || null,
        excerpt_en: formData.excerpt_en.trim() || null,
        content_en: formData.content_en.trim() || null,
        slug_en: formData.slug_en.trim() || null,
        meta_title_en: formData.meta_title_en.trim() || (formData.title_en ? formData.title_en.substring(0, 60) : null),
        meta_description_en: formData.meta_description_en.trim() || (formData.excerpt_en ? formData.excerpt_en.substring(0, 160) : null),
      }

      if (post?.id) {
        const { error } = await supabase
          .from('blog_posts')
          .update({
            ...blogData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([blogData])

        if (error) throw error
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error saving post:', error)
      setError(`Lỗi: ${error.message}`)
    } finally {
      if (setIsSubmitting) {
        setIsSubmitting(false)
      }
    }
  }

  const renderLanguageFields = (lang: Language) => {
    const titleField = lang === 'vi' ? 'title_vi' : 'title_en'
    const excerptField = lang === 'vi' ? 'excerpt_vi' : 'excerpt_en'
    const contentField = lang === 'vi' ? 'content_vi' : 'content_en'

    const currentSeoChecks = seoChecks[lang]
    const langLabel = lang === 'vi' ? 'Tiếng Việt' : 'English'

    return (
      <div className="space-y-6">
        {/* Tiêu đề */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={titleField}>Tiêu đề {langLabel} *</Label>
            <Badge variant={currentSeoChecks.hasTitle ? "default" : "outline"} className="text-xs">
              {formData[titleField].length}/70
            </Badge>
          </div>
          <Input
            id={titleField}
            value={formData[titleField]}
            onChange={(e) => setFormData({ ...formData, [titleField]: e.target.value })}
            required={lang === 'vi'}
            disabled={isSubmitting || uploading}
            placeholder={lang === 'vi' ? "Tiêu đề hấp dẫn, chứa từ khóa chính..." : "Attractive title, contains main keywords..."}
            maxLength={70}
            className="placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-500">
            Tiêu đề sẽ hiển thị trên Google. Tối ưu: 10-70 ký tự.
          </p>
        </div>

        {/* Tóm tắt (Meta Description) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={excerptField}>Tóm tắt (Meta Description) {langLabel} {lang === 'vi' && '*'}</Label>
            <Badge
              variant={
                formData[excerptField].length === 0 ? "outline" :
                (formData[excerptField].length >= 120 && formData[excerptField].length <= 160) ? "default" : "destructive"
              }
              className="text-xs"
            >
              {formData[excerptField].length === 0 ? "Chưa nhập" :
              formData[excerptField].length < 120 ? `Thiếu ${120 - formData[excerptField].length} ký tự` :
              formData[excerptField].length > 160 ? `Dư ${formData[excerptField].length - 160} ký tự` :
              "✅ Tối ưu"}
            </Badge>
          </div>
          <Textarea
            id={excerptField}
            value={formData[excerptField]}
            onChange={(e) => setFormData({ ...formData, [excerptField]: e.target.value })}
            rows={3}
            required={lang === 'vi'}
            disabled={isSubmitting || uploading}
            placeholder={lang === 'vi'
              ? "Mô tả ngắn gọn về bài viết. Đoạn này sẽ hiển thị trên kết quả tìm kiếm Google..."
              : "Brief description of the article. This will appear in Google search results..."
            }
            maxLength={160}
            className="placeholder:text-gray-400"
          />
          <div className="text-xs text-gray-500 space-y-1">
            <p>Đây là <strong>meta description</strong> hiển thị trên Google.</p>
            <p>Tối ưu: 120-160 ký tự, chứa từ khóa chính, kêu gọi hành động.</p>
          </div>
        </div>

        {/* Nội dung chính với RichTextEditor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={contentField}>Nội dung chi tiết {langLabel} {lang === 'vi' && '*'}</Label>
            <div className="flex gap-2">
              <Badge
                variant={currentSeoChecks.hasHeadings ? "default" : "outline"}
                className="text-xs"
              >
                {currentSeoChecks.hasHeadings ? "✓ Có heading" : "Chưa có heading"}
              </Badge>
            </div>
          </div>

          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <RichTextEditor
              value={formData[contentField]}
              onChange={(html) => setFormData({ ...formData, [contentField]: html })}
            />
          </div>
        </div>

        {/* Thông tin tự động tạo */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            ℹ️ <strong>Tự động tạo:</strong> URL Slug, Meta Title, Meta Description sẽ được tạo tự động từ tiêu đề và tóm tắt.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" id="blog-form">
      {/* Phần chung */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tác giả */}
        <div className="space-y-2">
          <Label htmlFor="author">Tác giả *</Label>
          <Input
            id="author"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            required
            disabled={isSubmitting || uploading}
            placeholder="Nhập tên tác giả"
          />
        </div>

        {/* Ngày đăng */}
        <div className="space-y-2">
          <Label htmlFor="date">Ngày đăng *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            disabled={isSubmitting || uploading}
          />
        </div>

        {/* Danh mục */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-gray-900 dark:text-white">
            Danh mục *
          </Label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting || uploading}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="text-gray-900">{cat}</option>
            ))}
          </select>
        </div>

        {/* Trạng thái */}
        <div className="space-y-2">
          <Label htmlFor="status" className="text-gray-900 dark:text-white">
            Trạng thái
          </Label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting || uploading}
          >
            <option value="draft" className="text-gray-900">Bản nháp</option>
            <option value="published" className="text-gray-900">Xuất bản</option>
          </select>
        </div>

        {/* Image Preview */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label>Hình ảnh chính *</Label>
            <Badge variant={formData.image ? "default" : "outline"} className="text-xs">
              {formData.image ? "✓ Có ảnh" : "Chưa có ảnh"}
            </Badge>
          </div>
          
          {previewImage ? (
            <div className="space-y-3">
              <div className="relative w-full max-w-md">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                  disabled={isSubmitting || uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                <p className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Ảnh sẽ hiển thị đầu bài viết và khi chia sẻ link
                </p>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">Chưa có hình ảnh</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="Nhập URL ảnh từ internet (https://...)"
                disabled={isSubmitting || uploading}
                className='placeholder:text-gray-400 flex-1'
              />
              <span className="text-sm text-gray-500 self-center">hoặc</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
                disabled={isSubmitting || uploading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || uploading}
                className="whitespace-nowrap"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {uploading ? 'Đang upload...' : 'Upload ảnh'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Phần ngôn ngữ với tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Nội dung đa ngôn ngữ
          </h3>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleAutoTranslate}
              disabled={isTranslating || isSubmitting || uploading}
              className="flex items-center gap-2"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang dịch...
                </>
              ) : (
                <>
                  <Languages className="w-4 h-4" />
                  Dịch sang tiếng Anh (AI)
                </>
              )}
            </Button>
            <div className="text-sm text-gray-500">
              <span className="font-medium">Lưu ý:</span> Tiếng Việt là bắt buộc
            </div>
          </div>
        </div>

        <Tabs value={activeLanguage} onValueChange={(value) => setActiveLanguage(value as Language)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vi" className="flex items-center gap-2">
              🇻🇳 Tiếng Việt
              {!formData.title_vi && (
                <span className="text-xs text-red-500">(Bắt buộc)</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="en" className="flex items-center gap-2">
              🇺🇸 English
              {!formData.title_en && (
                <span className="text-xs text-gray-500">(Tùy chọn)</span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="vi" className="space-y-6 mt-6">
            {renderLanguageFields('vi')}
          </TabsContent>
          
          <TabsContent value="en" className="space-y-6 mt-6">
            {renderLanguageFields('en')}
          </TabsContent>
        </Tabs>
      </div>

      {/* Tóm tắt SEO Score cho ngôn ngữ đang chọn */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          📊 Điểm SEO ước tính ({activeLanguage === 'vi' ? 'Tiếng Việt' : 'English'})
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(seoChecks[activeLanguage]).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm text-blue-700 capitalize">
                {key.replace('has', '').replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-blue-600 mt-3">
          Điểm SEO cao giúp bài viết dễ được tìm thấy trên Google.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-500">
          <p>💡 <strong>Lưu ý:</strong> Tiếng Việt là bắt buộc để bài viết hiển thị trên website.</p>
        </div>
        
        <div className="flex space-x-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || uploading}
              className='hover:bg-gray-800'
            >
              Hủy
            </Button>
          )}

          <Button 
            type="submit" 
            disabled={isSubmitting || uploading}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : post?.id ? (
              'Cập nhật bài viết'
            ) : (
              'Tạo bài viết'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
