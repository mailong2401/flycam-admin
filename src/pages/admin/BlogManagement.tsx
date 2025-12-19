import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Filter, Calendar, User, MoreVertical, ArrowUpDown, Download, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BlogForm } from '@/components/admin/BlogForm'
import { BlogPost } from '@/types'
import { supabase } from '@/services/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useNavigate } from 'react-router-dom'

// Import PreviewModal từ component mới
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
  const [showPreviewModal, setShowPreviewModal] = useState(false) // State mới cho modal
  const [previewMode, setPreviewMode] = useState<'all' | 'single'>('all') // 'all' hoặc 'single'

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải bài viết...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header với các nút điều hướng */}
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

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm bài viết..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  <SelectItem value="Tin tức">Tin tức</SelectItem>
                  <SelectItem value="Hướng dẫn">Hướng dẫn</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Công nghệ">Công nghệ</SelectItem>
                  <SelectItem value="Sản phẩm">Sản phẩm</SelectItem>
                  <SelectItem value="Pháp lý">Pháp lý</SelectItem>
                  <SelectItem value="Nhiếp ảnh">Nhiếp ảnh</SelectItem>
                  <SelectItem value="Bảo trì">Bảo trì</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="published">Đã xuất bản</SelectItem>
                  <SelectItem value="draft">Bản nháp</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: 'date' | 'title' | 'author') => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Ngày đăng</SelectItem>
                  <SelectItem value="title">Tiêu đề</SelectItem>
                  <SelectItem value="author">Tác giả</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blog Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách bài viết</CardTitle>
          <CardDescription>
            {filteredPosts.length} bài viết
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Bài viết</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Tác giả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày đăng</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Không tìm thấy bài viết nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPosts.map((post) => (
                    <TableRow key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-12 w-12 flex-shrink-0 rounded-md overflow-hidden cursor-pointer relative group"
                            onClick={() => handleImagePreview(post.image || 'https://unsplash.com/photos/a-collection-of-objects-bsSxXkBQTB4', post.title)}
                          >
                            <img
                              src={post.image || 'https://unsplash.com/photos/a-collection-of-objects-bsSxXkBQTB4'}
                              alt={post.title}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://unsplash.com/photos/a-collection-of-objects-bsSxXkBQTB4';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                              <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {post.title}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {post.excerpt ? (
                                post.excerpt.length > 15 
                                  ? post.excerpt.substring(0, 15) + "..." 
                                  : post.excerpt
                              ) : (
                                <span className="text-gray-400 italic">Không có mô tả</span>
                              )}
                            </div>
                            {post.image && (
                              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <span>Ảnh: {post.image.split('/').pop()?.substring(0, 20)}...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getCategoryBadgeColor(post.category)}>
                          {post.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-gray-400" />
                          {post.author}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={post.status === 'published'}
                            onCheckedChange={() => toggleStatus(post)}
                          />
                          <span className={`text-sm ${post.status === 'published' ? 'text-black-600' : 'text-gray-500'}`}>
                            {post.status === 'published' ? 'Công khai' : 'Nháp'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {post.date}
                        </div>
                      </TableCell>
                    <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-vibrant-red">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/admin/blog/edit/${post.id}`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          
                          {/* CHỈ HIỆN KHI LÀ BẢN NHÁP (draft) */}
                          {post.status === 'draft' && (
                            <DropdownMenuItem onClick={() => window.open(`/blog/${post.id}`, '_blank')}>
                              <Eye className="h-4 w-4 mr-2" />
                              Xem bài viết
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem onClick={() => toggleStatus(post)}>
                            {post.status === 'published' ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Chuyển sang nháp
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Công khai
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          {post.image && (
                            <DropdownMenuItem onClick={() => handleDownloadImage(post.image!, post.title)}>
                              <Download className="h-4 w-4 mr-2" />
                              Tải ảnh về
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm(post.id!)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Bài viết sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(deleteConfirm!)}
            >
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Xem trước ảnh</span>
            </DialogTitle>
            <DialogDescription>
              {imagePreview?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center">
            <img
              src={imagePreview?.url || 'https://unsplash.com/photos/a-collection-of-objects-bsSxXkBQTB4'}
              alt="Preview"
              className="max-w-full max-h-[60vh] object-contain rounded-md"
            />
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => imagePreview && handleDownloadImage(imagePreview.url, imagePreview.name)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Tải ảnh về
              </Button>
              <Button
                variant="outline"
                onClick={() => setImagePreview(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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