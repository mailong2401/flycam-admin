import { BlogPost } from '@/types'
import { TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { User, Calendar, Eye } from 'lucide-react'
import { ActionMenu } from '@/components/admin/blogmanagement/ActionMenu'

interface BlogTableRowProps {
  post: BlogPost
  onImagePreview: (url: string, name: string) => void
  onToggleStatus: (post: BlogPost) => void
  onEdit: (post: BlogPost) => void
  onPreview: (post: BlogPost) => void
  onToggleVisibility: (post: BlogPost) => void
  onDownloadImage: (url: string, filename: string) => void
  onDelete: (id: string) => void
  getCategoryBadgeColor: (category: string) => string
}

export function BlogTableRow({
  post,
  onImagePreview,
  onToggleStatus,
  onEdit,
  onPreview,
  onToggleVisibility,
  onDownloadImage,
  onDelete,
  getCategoryBadgeColor
}: BlogTableRowProps) {
  return (
    <TableRow key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
      <TableCell>
        <div className="flex items-center gap-3">
          <div 
            className="h-12 w-12 flex-shrink-0 rounded-md overflow-hidden cursor-pointer relative group"
            onClick={() => onImagePreview(post.image || 'https://unsplash.com/photos/a-collection-of-objects-bsSxXkBQTB4', post.title)}
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
            onCheckedChange={() => onToggleStatus(post)}
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
        <ActionMenu
          post={post}
          onEdit={onEdit}
          onPreview={onPreview}
          onToggleVisibility={onToggleVisibility}
          onDownloadImage={onDownloadImage}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  )
}