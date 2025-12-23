import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteDialog({ isOpen, onClose, onConfirm }: DeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogDescription>
            Hành động này không thể hoàn tác. Bài viết sẽ bị xóa vĩnh viễn.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-3 mt-4">
          <Button className='hover:bg-gray-800 bg-transparent' onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
          >
            Xóa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}