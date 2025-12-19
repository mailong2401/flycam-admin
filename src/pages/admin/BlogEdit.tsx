// src/pages/admin/BlogEdit.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/services/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Sidebar from '@/components/admin/Sidebar'
import { BlogForm } from '@/components/admin/BlogForm'
import { useToast } from '@/hooks/use-toast'
import { BlogPost } from '@/types'

export default function BlogEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchPost()
  }, [id])

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      setPost(data)
    } catch (error) {
      console.error('Error fetching post:', error)
      toast({
        title: "Lỗi",
        description: "Không thể tải bài viết",
        variant: "destructive",
      })
      navigate('/admin/blog')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    toast({
      title: "Thành công",
      description: "Bài viết đã được cập nhật",
    })
    navigate('/admin/blog')
  }

  const handleCancel = () => {
    navigate('/admin/blog')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-64">
          <div className="p-6">
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Đang tải bài viết...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-64">
          <div className="p-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-foreground mb-2">Bài viết không tồn tại</h3>
              <Button 
                onClick={() => navigate('/admin/blog')}
                className="mt-4"
              >
                Quay lại danh sách
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="lg:pl-64">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Chỉnh sửa bài viết</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Chỉnh sửa bài viết: {post.title}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                form="blog-form"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang lưu...' : 'Cập nhật'}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin bài viết</CardTitle>
            </CardHeader>
            <CardContent>
              <BlogForm
                post={post}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
                setIsSubmitting={setIsSubmitting}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}