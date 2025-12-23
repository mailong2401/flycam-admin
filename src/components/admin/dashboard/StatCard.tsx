import { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: ReactNode
  additionalContent?: ReactNode
  badge?: {
    text: string
    variant?: "default" | "secondary" | "outline" | "destructive"
  }
  hoverEffect?: boolean
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon, 
  additionalContent,
  badge,
  hoverEffect = true
}: StatCardProps) {
  return (
    <Card className={`border shadow-sm ${hoverEffect ? 'hover:shadow-md transition-shadow duration-300' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gray-800 rounded-xl">
            {icon}
          </div>
          {badge && (
            <Badge 
              variant={badge.variant || "default"} 
              // SỬA: Thêm pointer-events-none để tắt hoàn toàn hover
              className="text-primary bg-primary/10 pointer-events-none"
            >
              {badge.text}
            </Badge>
          )}
        </div>
        <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
        <p className="text-foreground font-medium">{title}</p>
        {additionalContent}
      </CardContent>
    </Card>
  )
}

interface StatCardWithProgressProps extends Omit<StatCardProps, 'additionalContent'> {
  progressValue: number
  leftLabel: string
  rightLabel: string
}

export function StatCardWithProgress({ 
  title, 
  value, 
  description, 
  icon, 
  progressValue,
  leftLabel,
  rightLabel,
  badge,
  hoverEffect = true
}: StatCardWithProgressProps) {
  return (
    <StatCard
      title={title}
      value={value}
      description={description}
      icon={icon}
      badge={badge}
      hoverEffect={hoverEffect}
      additionalContent={
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>
      }
    />
  )
}