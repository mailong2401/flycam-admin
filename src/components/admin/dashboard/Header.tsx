import { Button } from "@/components/ui/button"
import { LogOut, Plus } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface HeaderProps {
  onCreateNewPost: () => void
  onLogout: () => void
}

export function Header({ onCreateNewPost, onLogout }: HeaderProps) {
  const { user } = useAuth()

  return (
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
          onClick={onCreateNewPost}
          className="mr-2 gap-2"
        >
          <Plus className="w-4 h-4" />
          Tạo bài viết mới
        </Button>
        <Button onClick={onLogout} variant="outline" className="gap-2 hover:bg-gray-800">
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </div>
  )
}