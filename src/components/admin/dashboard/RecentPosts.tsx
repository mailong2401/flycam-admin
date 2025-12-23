import { BlogPost } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar, Eye, ChevronRight, Plus } from "lucide-react"

interface RecentPostsProps {
  posts: BlogPost[]
  onCreateNew: () => void
  onViewAll: () => void
}

export function RecentPosts({ posts, onCreateNew, onViewAll }: RecentPostsProps) {
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

  return (
    <Card className="lg:col-span-2 border shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5 text-primary" />
              Bài viết gần đây
            </CardTitle>
            <CardDescription>
              {posts.length} bài viết mới nhất được cập nhật
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-primary hover:text-primary hover:bg-gray-800"
            onClick={onViewAll}
          >
            Xem tất cả
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Chưa có bài viết nào</h3>
            <p className="text-muted-foreground mb-6">Hãy tạo bài viết đầu tiên của bạn</p>
            <Button 
              onClick={onCreateNew}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Tạo bài viết mới
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((post) => (
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
  )
}