import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BlogPost } from '@/types'
import {
  Edit,
  Eye,
  EyeOff,
  Download,
  Trash2,
  MoreVertical
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ActionMenuProps {
  post: BlogPost
  onEdit: (post: BlogPost) => void
  onPreview: (post: BlogPost) => void
  onToggleVisibility: (post: BlogPost) => void
  onDownloadImage: (url: string, filename: string) => void
  onDelete: (id: string) => void
}

export function ActionMenu({
  post,
  onEdit,
  onPreview,
  onToggleVisibility,
  onDownloadImage,
  onDelete
}: ActionMenuProps) {

  // 🔥 CHỈ THÊM CÁI NÀY
  const [open, setOpen] = useState(false)

  return (
    <div className="flex justify-end gap-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-vibrant-red"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="data-[highlighted]:bg-red-600"
            onClick={() => {
              setOpen(false)
              onEdit(post)
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </DropdownMenuItem>

          {post.status === 'draft' && (
            <DropdownMenuItem
              className="data-[highlighted]:bg-red-600"
              onClick={() => {
                setOpen(false)
                window.open(`/blog/${post.id}`, '_blank')
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Xem bài viết
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            className="data-[highlighted]:bg-red-600"
            onClick={() => {
              setOpen(false)
              onToggleVisibility(post)
            }}
          >
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
            <DropdownMenuItem
              className="data-[highlighted]:bg-red-600"
              onClick={() => {
                setOpen(false)
                onDownloadImage(post.image!, post.title)
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Tải ảnh về
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="font-semibold data-[highlighted]:bg-red-600"
            onClick={() => {
              setOpen(false)
              onDelete(post.id!)
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
