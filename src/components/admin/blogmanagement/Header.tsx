import { Button } from '@/components/ui/button'
import { Plus, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function BlogHeader() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col sm:flex-row justify-between ml-3 mt-3 sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Quản lý Blog
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Quản lý và xuất bản bài viết cho trang blog của bạn
        </p>
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={() => navigate('/admin/dashboard')}
          variant="outline"
          className="gap-2 border-gray-300 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <Home className="w-4 h-4" />
          Trở về Dashboard
        </Button>
        <Button 
          onClick={() => navigate('/admin/blog/new')}
          className="mr-2 gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Tạo bài viết mới
        </Button>
      </div>
    </div>
  )
}