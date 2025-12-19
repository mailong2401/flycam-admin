import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { LogOut, BookOpen, TrendingUp, Calendar, Eye, FileText, BarChart, Clock, Plus, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { supabase } from "@/services/supabase"
import { BlogPost } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BlogForm } from "@/components/admin/BlogForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Sidebar from "@/components/admin/Sidebar"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from 'react-router-dom'

interface DashboardStats {
  totalPosts: number
  totalPublished: number
  totalDrafts: number
  totalViews: number
  avgViews: number
  topCategory: string
  recentActivity: number
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    totalPublished: 0,
    totalDrafts: 0,
    totalViews: 0,
    avgViews: 0,
    topCategory: 'Chưa có',
    recentActivity: 0
  })
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([])
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<{name: string, count: number}[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Đã đăng xuất",
        description: "Bạn đã đăng xuất thành công",
      })
      setTimeout(() => {
        window.location.href = '/admin/login'
      }, 1000)
    } catch (error) {
      toast({
        title: "Lỗi đăng xuất",
        description: "Đã xảy ra lỗi khi đăng xuất",
        variant: "destructive",
      })
    }
  }

  const handleCreateNewPost = () => {
    navigate('/admin/blog/new')
  }

  const handleGoToBlogManagement = () => {
    navigate('/admin/blog')
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const { data: allPosts } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

      const totalPosts = allPosts?.length || 0
      const publishedPosts = allPosts?.filter(p => p.status === 'published') || []
      const draftPosts = allPosts?.filter(p => p.status === 'draft') || []
      const totalViews = publishedPosts.reduce((sum, post) => sum + (post.views || 0), 0)
      const avgViews = publishedPosts.length > 0 ? Math.round(totalViews / publishedPosts.length) : 0

      const categoryMap = new Map<string, number>()
      allPosts?.forEach(post => {
        const count = categoryMap.get(post.category) || 0
        categoryMap.set(post.category, count + 1)
      })
      
      const categoryArray = Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

      const topCategory = categoryArray.length > 0 ? categoryArray[0].name : 'Chưa có'

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const recentActivity = allPosts?.filter(post => 
        new Date(post.created_at) > weekAgo
      ).length || 0

      const recentPostsData = allPosts?.slice(0, 5) || []

      const popularPostsData = publishedPosts
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 3)

      setStats({
        totalPosts,
        totalPublished: publishedPosts.length,
        totalDrafts: draftPosts.length,
        totalViews,
        avgViews,
        topCategory,
        recentActivity
      })

      setRecentPosts(recentPostsData)
      setPopularPosts(popularPostsData)
      setCategories(categoryArray)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    fetchDashboardData()
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours} giờ trước`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} ngày trước`
    }
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
                <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                <p className="text-sm text-gray-500 mt-2">Vui lòng đợi trong giây lát</p>
              </div>
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
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Dashboard Quản lý Blog
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-muted-foreground">
                  Xin chào, <span className="font-semibold text-foreground">{user?.email}</span>
                </p>
                <span className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-full">
                  Quản trị viên
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Cập nhật lúc: {new Date().toLocaleString('vi-VN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleCreateNewPost}
                className="mr-2 gap-2"
              >
                <Plus className="w-4 h-4" />
                Tạo bài viết mới
              </Button>
              <Button onClick={handleLogout} variant="outline" className="gap-2">
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {((stats.totalPublished / stats.totalPosts) * 100 || 0).toFixed(0)}% hoàn thành
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1">{stats.totalPosts}</h3>
                <p className="text-foreground font-medium">Tổng bài viết</p>
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Đã công khai: {stats.totalPublished}</span>
                    <span>Bản nháp: {stats.totalDrafts}</span>
                  </div>
                  <Progress value={(stats.totalPublished / stats.totalPosts) * 100 || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1">{formatNumber(stats.totalViews)}</h3>
                <p className="text-foreground font-medium">Tổng lượt xem</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Trung bình: {stats.avgViews} lượt/bài</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <BarChart className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-primary bg-primary/10">
                    {categories.length} danh mục
                  </Badge>
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1">{stats.topCategory}</h3>
                <p className="text-foreground font-medium">Danh mục phổ biến</p>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    {categories.length > 0 ? (
                      `${categories[0].count} bài viết`
                    ) : (
                      "Chưa có bài viết"
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    stats.recentActivity > 0 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {stats.recentActivity > 0 ? 'Đang hoạt động' : 'Không có hoạt động'}
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1">{stats.recentActivity}</h3>
                <p className="text-foreground font-medium">Hoạt động 7 ngày</p>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    {stats.recentActivity > 0 
                      ? `Có ${stats.recentActivity} bài viết mới` 
                      : 'Chưa có bài viết mới'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2 border shadow-sm">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Bài viết gần đây
                    </CardTitle>
                    <CardDescription>
                      {recentPosts.length} bài viết mới nhất được cập nhật
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={handleGoToBlogManagement}
                  >
                    Xem tất cả
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {recentPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Chưa có bài viết nào</h3>
                    <p className="text-muted-foreground mb-6">Hãy tạo bài viết đầu tiên của bạn</p>
                    <Button 
                      onClick={handleCreateNewPost}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Tạo bài viết mới
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentPosts.map((post, index) => (
                      <div key={post.id} className="p-4 transition-colors duration-150 hover:bg-muted/50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-foreground truncate">{post.title}</h4>
                              <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                {post.status === 'published' ? 'Công khai' : 'Nháp'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {post.date || new Date(post.created_at).toLocaleDateString('vi-VN')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {post.views || 0} lượt xem
                              </span>
                              <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                                {post.category}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getTimeAgo(post.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Bài viết phổ biến
                  </CardTitle>
                  <CardDescription>
                    Top {popularPosts.length} bài viết được xem nhiều nhất
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {popularPosts.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Chưa có lượt xem nào</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {popularPosts.map((post, index) => (
                        <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-bold text-primary text-sm">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{post.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {post.views?.toLocaleString() || 0}
                              </span>
                              <span>•</span>
                              <span>{post.category}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Phân loại danh mục
                  </CardTitle>
                  <CardDescription>
                    {categories.length} danh mục bài viết
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {categories.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Chưa có danh mục nào</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {categories.map((category, index) => {
                        const percentage = (category.count / stats.totalPosts) * 100
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-foreground">{category.name}</span>
                              <span className="text-sm font-semibold text-muted-foreground">{category.count} bài</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{percentage.toFixed(1)}%</span>
                              <span>{category.count} / {stats.totalPosts} bài viết</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPost ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
            </DialogTitle>
          </DialogHeader>
          <BlogForm
            post={selectedPost}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}