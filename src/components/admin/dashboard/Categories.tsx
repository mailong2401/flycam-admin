import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { FileText } from "lucide-react"

interface Category {
  name: string
  count: number
}

interface CategoriesProps {
  categories: Category[]
  totalPosts: number
}

export function Categories({ categories, totalPosts }: CategoriesProps) {
  return (
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
              const percentage = (category.count / totalPosts) * 100
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{category.name}</span>
                    <span className="text-sm font-semibold text-muted-foreground">{category.count} bài</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{percentage.toFixed(1)}%</span>
                    <span>{category.count} / {totalPosts} bài viết</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}