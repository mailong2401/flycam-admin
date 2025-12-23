// src/pages/admin/BlogNew.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Sidebar from '@/components/admin/Sidebar'
import { BlogForm } from '@/components/admin/BlogForm'
import { useToast } from '@/hooks/use-toast'

export default function BlogNew() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSuccess = () => {
    toast({
      title: "Thành công",
      description: "Bài viết đã được tạo thành công",
    })
    navigate('/admin/blog')
  }

  const handleCancel = () => {
    navigate('/admin/blog')
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
                className="gap-2 hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Tạo bài viết mới</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Tạo bài viết mới cho website
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSubmitting}
                className='hover:bg-gray-800'
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                form="blog-form"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu bài viết'}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin bài viết</CardTitle>
            </CardHeader>
            <CardContent>
              <BlogForm
                post={null}
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