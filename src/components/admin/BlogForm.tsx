// src/components/admin/BlogForm.tsx
import { useState, useRef, useEffect } from 'react'
import { BlogPost } from '@/types'
import { supabase } from '@/services/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, AlertCircle, Eye } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import RichTextEditor from "@/components/RichTextEditorQuill"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface BlogFormProps {
  post?: BlogPost | null
  onSuccess: () => void
  onCancel?: () => void // THÊM PROP NÀY
  isSubmitting?: boolean // THÊM PROP NÀY
  setIsSubmitting?: (value: boolean) => void // THÊM PROP NÀY
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
  const [seoChecks, setSeoChecks] = useState({
    hasTitle: false,
    hasContent: false,
    hasImage: false,
    hasMetaDescription: false,
    hasHeadings: false,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: post?.title || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    image: post?.image || '',
    date: post?.date || new Date().toISOString().split('T')[0],
    author: post?.author || '',
    category: post?.category || categories[0],
    status: post?.status || 'draft',
  })

  // Kiểm tra SEO khi formData thay đổi
  useEffect(() => {
    checkSEO()
  }, [formData])

  const checkSEO = () => {
    const checks = {
      hasTitle: formData.title.length > 10 && formData.title.length < 70,
      hasContent: formData.content.length > 300,
      hasImage: formData.image.length > 0,
      hasMetaDescription:  (formData.excerpt.length >= 120 && formData.excerpt.length <= 160),
      hasHeadings: /<h[1-3][^>]*>.*?<\/h[1-3]>/i.test(formData.content),
    }
    setSeoChecks(checks)
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

  const handleImageUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, image: url }))
    setPreviewImage(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (setIsSubmitting) {
      setIsSubmitting(true)
    }

    try {
      if (!formData.title.trim()) {
        setError('Vui lòng nhập tiêu đề')
        return
      }
      if (!formData.excerpt.trim()) {
        setError('Vui lòng nhập tóm tắt')
        return
      }
      if (!formData.image.trim()) {
        setError('Vui lòng thêm hình ảnh cho bài viết')
        return
      }
      if (!formData.content.trim() || formData.content.trim().length < 50) {
        setError('Vui lòng nhập nội dung chi tiết (ít nhất 50 ký tự)')
        return
      }

      // Tạo slug từ tiêu đề cho SEO friendly URL
      const createSlug = (text: string) => {
        return text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim()
      }

      const blogData: any = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        image: formData.image,
        date: formData.date,
        author: formData.author.trim() || 'Admin',
        category: formData.category,
        status: formData.status,
        slug: post?.slug || createSlug(formData.title),
        meta_title: formData.title.substring(0, 60),
        meta_description: formData.excerpt.substring(0, 160),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6" id="blog-form">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tiêu đề */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Badge variant={seoChecks.hasTitle ? "default" : "outline"} className="text-xs">
              {formData.title.length}/70
            </Badge>
          </div>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            disabled={isSubmitting || uploading}
            placeholder="Tiêu đề hấp dẫn, chứa từ khóa chính..."
            maxLength={70}
            className="placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-500">
            Tiêu đề sẽ hiển thị trên Google. Tối ưu: 10-70 ký tự.
          </p>
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
            <Badge variant={seoChecks.hasImage ? "default" : "outline"} className="text-xs">
              {seoChecks.hasImage ? "✓ Có ảnh" : "Chưa có ảnh"}
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
                value={formData.image.startsWith('http') && !formData.image.includes('supabase.co/storage')
                  ? formData.image
                  : ''}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                placeholder="Nhập URL ảnh từ internet (https://...)"
                disabled={isSubmitting || uploading}
                className='placeholder:text-gray-400'
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

        {/* Tóm tắt (Meta Description) */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="excerpt">Tóm tắt (Meta Description) *</Label>
            <Badge 
              variant={
                formData.excerpt.length === 0 ? "outline" : 
                (formData.excerpt.length >= 120 && formData.excerpt.length <= 160) ? "default" : "destructive"
              } 
              className={`
                text-xs
                ${formData.excerpt.length >= 120 && formData.excerpt.length <= 160 ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
              `}
            >
              {formData.excerpt.length === 0 ? "Chưa nhập" : 
              formData.excerpt.length < 120 ? `Thiếu ${120 - formData.excerpt.length} ký tự` :
              formData.excerpt.length > 160 ? `Dư ${formData.excerpt.length - 160} ký tự` :
              "✅ Tối ưu"}
            </Badge>
          </div>
          <Textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            rows={3}
            required
            disabled={isSubmitting || uploading}
            placeholder="Mô tả ngắn gọn về bài viết. Đoạn này sẽ hiển thị trên kết quả tìm kiếm Google..."
            maxLength={160}
            className="placeholder:text-gray-400"
          />
          <div className="text-xs text-gray-500 space-y-1">
            <p>Đây là <strong>meta description</strong> hiển thị trên Google.</p>
            <p>Tối ưu: 120-160 ký tự, chứa từ khóa chính, kêu gọi hành động.</p>
          </div>
        </div>

        <Separator className="md:col-span-2" />

        {/* Nội dung chính với RichTextEditor */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content" className="text-gray-900 dark:text-white">
              Nội dung chi tiết *
            </Label>
            <div className="flex gap-2">
              <Badge 
                variant={seoChecks.hasHeadings ? "default" : "outline"} 
                className={`
                  text-xs
                  ${seoChecks.hasHeadings ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                `}
              >
                {seoChecks.hasHeadings ? "✓ Có heading" : "Chưa có heading"}
              </Badge>
            </div>
          </div>

          {/* Hidden input cho form validation */}
          <input
            type="hidden"
            id="content"
            name="content"
            value={formData.content}
            required
          />

          {/* RichTextEditor */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <RichTextEditor
              value={formData.content}
              onChange={(html) => setFormData({ ...formData, content: html })}
            />
          </div>
        </div>

      </div>

      {/* Tóm tắt SEO Score */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          📊 Điểm SEO ước tính
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(seoChecks).map(([key, value]) => (
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
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-500">
          <p>💡 <strong>Lưu ý:</strong> Nội dung HTML từ editor đã đầy đủ SEO.</p>
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