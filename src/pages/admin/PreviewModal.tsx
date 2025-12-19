import { useState, useEffect } from 'react'
import { X, Calendar, User, Clock, Eye, ArrowRight, Search, Tag, Filter, EyeOff } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BlogPost } from '@/types'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  post: BlogPost | null // null = preview tất cả
  allPosts: BlogPost[]
  mode: 'all' | 'single' // Thêm prop mode
}

export function PreviewModal({ isOpen, onClose, post, allPosts, mode }: PreviewModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([])

  // Fallback images
  const fallbackImages = [
    "https://images.unsplash.com/photo-1473968512647-3e447244af8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1508614589041-895b88991e3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  ]

  // Tính read time
  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    const minutes = Math.ceil(words / wordsPerMinute)
    return `${minutes} phút`
  }

  // Lấy categories
  const categories = ['all', ...Array.from(new Set(allPosts.map(p => p.category)))]

  useEffect(() => {
    if (mode === 'single' && post) {
      // Nếu có post cụ thể, hiển thị post đó ở đầu, sau đó là tất cả posts khác
      const otherPosts = allPosts.filter(p => p.id !== post.id)
      const sortedPosts = [post, ...otherPosts]
      setFilteredPosts(sortedPosts)
    } else {
      // Nếu mode = 'all', hiển thị tất cả posts với filter
      let filtered = [...allPosts]

      // Filter by search
      if (searchTerm) {
        filtered = filtered.filter(p =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Filter by category
      if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => p.category === categoryFilter)
      }

      // Sort posts
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.date || b.created_at || '').getTime() -
                   new Date(a.date || a.created_at || '').getTime()
          case 'popular':
            return (b.views || 0) - (a.views || 0)
          default:
            return 0
        }
      })

      setFilteredPosts(filtered)
    }
  }, [post, allPosts, searchTerm, sortBy, categoryFilter, mode])

  // Chỉ hiển thị bài viết đã published
  const publishedPosts = allPosts.filter(p => p.status === 'published')
  const totalPosts = publishedPosts.length
  const totalViews = publishedPosts.reduce((sum, p) => sum + (p.views || 0), 0)
  const totalCategories = categories.length - 1

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              {mode === 'single' && post ? `Xem trước: ${post.title}` : 'Xem trước Blog'}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Hero Section giống Blog.tsx */}
        {mode === 'single' && post ? (
          <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="md:w-1/3">
                <img
                  src={post.image || fallbackImages[0]}
                  alt={post.title}
                  className="w-full h-48 md:h-64 object-cover rounded-lg"
                />
              </div>
              <div className="md:w-2/3">
                <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="mb-3">
                  {post.status === 'published' ? 'Công khai' : 'Bản nháp'}
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {post.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {post.excerpt || post.content?.substring(0, 200) + "..."}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {post.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {post.date || new Date(post.created_at || '').toLocaleDateString('vi-VN')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {calculateReadTime(post.content || '')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.views || 0} lượt xem
                  </span>
                </div>
                <div className="mt-4">
                  <Badge variant="outline" className="mr-2 mb-2">
                    {post.category}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Stats section cho mode 'all' */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {[
              { number: totalPosts.toString(), label: "Bài viết công khai" },
              { number: totalViews.toLocaleString(), label: "Lượt xem" },
              { number: totalCategories.toString(), label: "Danh mục" }
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border"
              >
                <div className="text-xl md:text-2xl font-bold text-primary mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chỉ hiển thị filters khi xem tất cả bài viết */}
        {mode === 'all' && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search Box */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Tìm kiếm bài viết..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 py-6 text-base rounded-2xl"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  {/* Category Filter */}
                  <div className="w-full md:w-48">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="py-6">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          <SelectValue placeholder="Danh mục" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả danh mục</SelectItem>
                        {categories
                          .filter(cat => cat !== 'all')
                          .map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Filter */}
                  <div className="w-full md:w-48">
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="py-6">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4" />
                          <SelectValue placeholder="Sắp xếp" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Mới nhất</SelectItem>
                        <SelectItem value="popular">Phổ biến nhất</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {(searchTerm || categoryFilter !== 'all') && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600">Đang lọc:</span>
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-2">
                      Tìm: "{searchTerm}"
                    </Badge>
                  )}
                  {categoryFilter !== 'all' && (
                    <Badge variant="secondary" className="gap-2">
                      Danh mục: {categoryFilter}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Content */}
        <div className="space-y-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              {mode === 'single' ? 'Tất cả bài viết' : `Bài viết (${filteredPosts.length})`}
            </h2>
            {mode === 'all' && (
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm ? `Kết quả tìm kiếm cho "${searchTerm}"` : "Tất cả bài viết"}
                {categoryFilter !== 'all' && ` trong danh mục "${categoryFilter}"`}
              </p>
            )}
          </div>

          {filteredPosts.length === 0 ? (
            <Card className="py-16">
              <CardContent className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Không tìm thấy bài viết
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || categoryFilter !== 'all'
                    ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                    : 'Không có bài viết nào'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((p, index) => {
                const postImage = p.image || fallbackImages[index % fallbackImages.length]
                const readTime = calculateReadTime(p.content || '')
                const views = p.views || 0
                const isSelectedPost = mode === 'single' && post && p.id === post.id

                return (
                  <Card 
                    key={p.id} 
                    className={`group overflow-hidden border hover:shadow-xl transition-all duration-300 h-full flex flex-col ${
                      isSelectedPost ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                  >
                    {isSelectedPost && (
                      <div className="absolute top-1 left-2 z-10">
                        <Badge variant="default" className="bg-primary text-white">
                          Đang xem trước
                        </Badge>
                      </div>
                    )}
                    
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={postImage}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <Badge
                        variant="secondary"
                        className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm"
                      >
                        {p.category}
                      </Badge>
                      {/* Hiển thị status badge */}
                      <Badge
                        variant={p.status === 'published' ? 'default' : 'secondary'}
                        className="absolute top-3 right-3"
                      >
                        {p.status === 'published' ? 'Công khai' : 'Bản nháp'}
                      </Badge>
                    </div>

                    <CardContent className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {p.title}
                      </h3>

                      <p className="text-muted-foreground mb-4 line-clamp-3 flex-grow">
                        {p.excerpt || p.content?.substring(0, 150) + "..."}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {p.date || new Date(p.created_at || '').toLocaleDateString('vi-VN')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {readTime}
                          </span>
                        </div>
                        
                        <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                          <Eye className="w-3 h-3" />
                          <span className="font-medium">{views.toLocaleString()}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                        <div className="flex items-center text-sm">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-gray-600">{p.author}</span>
                        </div>
                        <div className="flex gap-2">
                          {p.status === 'published' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary/80 hover:bg-primary/5"
                              onClick={() => window.open(`/blog/${p.id}`, '_blank')}
                            >
                              <span className="flex items-center">
                                Xem bài viết
                                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </span>
                            </Button>
                          ) : (
                            <span className="text-sm text-gray-400 flex items-center">
                              <EyeOff className="w-4 h-4 mr-1" />
                              Bản nháp
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <div className="flex justify-center mt-8">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}