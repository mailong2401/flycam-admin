import { useAuth } from "@/contexts/AuthContext"
import { BookOpen, TrendingUp, Calendar, Eye, BarChart, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/services/supabase"
import { BlogPost } from "@/types"
import { BlogForm } from "@/components/admin/BlogForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Sidebar from "@/components/admin/Sidebar"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from 'react-router-dom'

// Import các components đã tách
import { Header } from "@/components/admin/dashboard/Header"
import { LoadingState } from "@/components/admin/dashboard/LoadingState"
import { StatCardWithProgress, StatCard } from "@/components/admin/dashboard/StatCard"
import { RecentPosts } from "@/components/admin/dashboard/RecentPosts"
import { PopularPosts } from "@/components/admin/dashboard/PopularPosts"
import { Categories } from "@/components/admin/dashboard/Categories"

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-64">
          <div className="p-6">
            <LoadingState />
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
          <Header 
            onCreateNewPost={handleCreateNewPost}
            onLogout={handleLogout}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCardWithProgress
              title="Tổng bài viết"
              value={stats.totalPosts}
              description=""
              icon={<BookOpen className="h-6 w-6 text-primary" />}
              progressValue={(stats.totalPublished / stats.totalPosts) * 100 || 0}
              leftLabel={`Đã công khai: ${stats.totalPublished}`}
              rightLabel={`Bản nháp: ${stats.totalDrafts}`}
              badge={{
                text: `${((stats.totalPublished / stats.totalPosts) * 100 || 0).toFixed(0)}% hoàn thành`
                // Badge này sẽ KHÔNG có hover
              }}
            />

            <StatCard
              title="Tổng lượt xem"
              value={formatNumber(stats.totalViews)}
              description=""
              icon={<Eye className="h-6 w-6 text-primary" />}
              badge={{ text: "Trending", variant: "outline" }}
              additionalContent={
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Trung bình: {stats.avgViews} lượt/bài</span>
                </div>
              }
            />

            <StatCard
              title="Danh mục phổ biến"
              value={stats.topCategory}
              description=""
              icon={<BarChart className="h-6 w-6 text-primary" />}
              badge={{
                text: `${categories.length} danh mục`,
                variant: "outline"
              }}
              additionalContent={
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    {categories.length > 0 ? (
                      `${categories[0].count} bài viết`
                    ) : (
                      "Chưa có bài viết"
                    )}
                  </p>
                </div>
              }
            />

            <StatCard
              title="Hoạt động 7 ngày"
              value={stats.recentActivity}
              description=""
              icon={<Clock className="h-6 w-6 text-primary " />}
              badge={{
                text: stats.recentActivity > 0 ? 'Đang hoạt động' : 'Không có hoạt động',
                variant: stats.recentActivity > 0 ? "default" : "secondary"
              }}
              additionalContent={
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    {stats.recentActivity > 0 
                      ? `Có ${stats.recentActivity} bài viết mới` 
                      : 'Chưa có bài viết mới'}
                  </p>
                </div>
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <RecentPosts
              posts={recentPosts}
              onCreateNew={handleCreateNewPost}
              onViewAll={handleGoToBlogManagement}
            />

            <div className="space-y-6">
              <PopularPosts posts={popularPosts} />
              <Categories categories={categories} totalPosts={stats.totalPosts} />
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