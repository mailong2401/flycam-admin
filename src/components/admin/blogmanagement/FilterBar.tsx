import { Search, Filter, ArrowUpDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

interface FilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  sortBy: 'date' | 'title' | 'author'
  onSortByChange: (value: 'date' | 'title' | 'author') => void
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange
}: FilterBarProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm bài viết..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className='data-[highlighted]:bg-red-600 '>Tất cả danh mục</SelectItem>
                <SelectItem value="Tin tức" className='data-[highlighted]:bg-red-600 '>Tin tức</SelectItem>
                <SelectItem value="Hướng dẫn" className='data-[highlighted]:bg-red-600'>Hướng dẫn</SelectItem>
                <SelectItem value="Review" className='data-[highlighted]:bg-red-600'>Review</SelectItem>
                <SelectItem value="Công nghệ" className='data-[highlighted]:bg-red-600'>Công nghệ</SelectItem>
                <SelectItem value="Sản phẩm" className='data-[highlighted]:bg-red-600'>Sản phẩm</SelectItem>
                <SelectItem value="Pháp lý" className='data-[highlighted]:bg-red-600'>Pháp lý</SelectItem>
                <SelectItem value="Nhiếp ảnh" className='data-[highlighted]:bg-red-600'>Nhiếp ảnh</SelectItem>
                <SelectItem value="Bảo trì" className='data-[highlighted]:bg-red-600'>Bảo trì</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className='data-[highlighted]:bg-red-600'>Tất cả trạng thái</SelectItem>
                <SelectItem value="published" className='data-[highlighted]:bg-red-600'>Đã xuất bản</SelectItem>
                <SelectItem value="draft" className='data-[highlighted]:bg-red-600'>Bản nháp</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date" className='data-[highlighted]:bg-red-600'>Ngày đăng</SelectItem>
                <SelectItem value="title" className='data-[highlighted]:bg-red-600'>Tiêu đề</SelectItem>
                <SelectItem value="author" className='data-[highlighted]:bg-red-600'>Tác giả</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}