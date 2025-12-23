import { BlogPost } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { User, Calendar, Eye } from 'lucide-react'
import { BlogTableRow } from '@/components/admin/blogmanagement/BlogTableRow'

interface BlogTableProps {
  posts: BlogPost[]
  onImagePreview: (url: string, name: string) => void
  onToggleStatus: (post: BlogPost) => void
  onEdit: (post: BlogPost) => void
  onPreview: (post: BlogPost) => void
  onToggleVisibility: (post: BlogPost) => void
  onDownloadImage: (url: string, filename: string) => void
  onDelete: (id: string) => void
  getCategoryBadgeColor: (category: string) => string
}

export function BlogTable({
  posts,
  onImagePreview,
  onToggleStatus,
  onEdit,
  onPreview,
  onToggleVisibility,
  onDownloadImage,
  onDelete,
  getCategoryBadgeColor
}: BlogTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách bài viết</CardTitle>
        <CardDescription>
          {posts.length} bài viết
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
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Không tìm thấy bài viết nào
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <BlogTableRow
                    key={post.id}
                    post={post}
                    onImagePreview={onImagePreview}
                    onToggleStatus={onToggleStatus}
                    onEdit={onEdit}
                    onPreview={onPreview}
                    onToggleVisibility={onToggleVisibility}
                    onDownloadImage={onDownloadImage}
                    onDelete={onDelete}
                    getCategoryBadgeColor={getCategoryBadgeColor}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}