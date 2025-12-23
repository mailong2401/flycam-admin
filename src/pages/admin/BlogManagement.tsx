import { useState, useEffect } from 'react'
import { BlogForm } from '@/components/admin/BlogForm'
import { BlogPost } from '@/types'
import { supabase } from '@/services/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useNavigate } from 'react-router-dom'

// Import các components đã tách
import { BlogHeader } from '@/components/admin/blogmanagement/Header'
import { FilterBar } from '@/components/admin/blogmanagement/FilterBar'
import { BlogTable } from '@/components/admin/blogmanagement/BlogTable'
import { DeleteDialog } from '@/components/admin/blogmanagement/DeleteDialog'
import { ImagePreviewDialog } from '@/components/admin/blogmanagement/ImagePreviewDialog'
import { LoadingState } from '@/components/admin/blogmanagement/LoadingState'
import { PreviewModal } from './PreviewModal'

export default function BlogManagement() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'author'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [imagePreview, setImagePreview] = useState<{ url: string; name: string } | null>(null)
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewMode, setPreviewMode] = useState<'all' | 'single'>('all')

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    filterAndSortPosts()
  }, [posts, searchQuery, categoryFilter, statusFilter, sortBy, sortOrder])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortPosts = () => {
    let filtered = [...posts]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(post => post.category === categoryFilter)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date || '').getTime()
          bValue = new Date(b.date || '').getTime()
          break
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'author':
          aValue = a.author.toLowerCase()
          bValue = b.author.toLowerCase()
          break
      }
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (bValue > aValue ? 1 : -1)
    })

    setFilteredPosts(filtered)
  }

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setPosts(posts.filter(post => post.id !== id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const toggleStatus = async (post: BlogPost) => {
    try {
      const newStatus = post.status === 'published' ? 'draft' : 'published'
      const { error } = await supabase
        .from('blog_posts')
        .update({ status: newStatus })
        .eq('id', post.id)

      if (error) throw error
      
      fetchPosts()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      'Tin tức': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'Hướng dẫn': 'bg-green-100 text-green-800 hover:bg-green-200',
      'Review': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      'Công nghệ': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      'Sản phẩm': 'bg-pink-100 text-pink-800 hover:bg-pink-200',
      'Pháp lý': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      'Nhiếp ảnh': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      'Bảo trì': 'bg-teal-100 text-teal-800 hover:bg-teal-200',
    }
    return colors[category] || 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }

  const handleDownloadImage = (url: string, filename: string) => {
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'blog-image';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(error => console.error('Error downloading image:', error));
  }

  const handleImagePreview = (url: string, name: string) => {
    setImagePreview({ url, name });
  }

  // Hàm mở preview bài viết cụ thể
  const handlePreviewPost = (post: BlogPost) => {
    setPreviewMode('single')
    setPreviewPost(post)
    setShowPreviewModal(true)
  }

  // Hàm đóng preview modal
  const handleClosePreviewModal = () => {
    setShowPreviewModal(false)
    setPreviewPost(null)
  }

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6">
      <BlogHeader />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      <BlogTable
        posts={filteredPosts}
        onImagePreview={handleImagePreview}
        onToggleStatus={toggleStatus}
        onEdit={handleEdit}
        onPreview={handlePreviewPost}
        onToggleVisibility={toggleStatus}
        onDownloadImage={handleDownloadImage}
        onDelete={setDeleteConfirm}
        getCategoryBadgeColor={getCategoryBadgeColor}
      />

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPost ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
            </DialogTitle>
          </DialogHeader>

          {/* Form */}
          <BlogForm
            post={selectedPost}
            onSuccess={() => {
              setShowForm(false)
              fetchPosts()
            }}
          />
        </DialogContent>
      </Dialog>

      <DeleteDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
      />

      <ImagePreviewDialog
        isOpen={!!imagePreview}
        onClose={() => setImagePreview(null)}
        imagePreview={imagePreview}
        onDownload={handleDownloadImage}
      />

      {/* Preview Modal - Hiển thị tất cả bài viết */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={handleClosePreviewModal}
        post={previewMode === 'single' ? previewPost : null}
        allPosts={posts}
        mode={previewMode}
      />
    </div>
  )
}