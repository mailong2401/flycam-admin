import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface ImagePreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  imagePreview: { url: string; name: string } | null
  onDownload: (url: string, filename: string) => void
}

export function ImagePreviewDialog({
  isOpen,
  onClose,
  imagePreview,
  onDownload
}: ImagePreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Xem trước ảnh</span>
          </DialogTitle>
          <DialogDescription>
            {imagePreview?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center">
          <img
            src={imagePreview?.url || 'https://unsplash.com/photos/a-collection-of-objects-bsSxXkBQTB4'}
            alt="Preview"
            className="max-w-full max-h-[60vh] object-contain rounded-md"
          />
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => imagePreview && onDownload(imagePreview.url, imagePreview.name)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Tải ảnh về
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}