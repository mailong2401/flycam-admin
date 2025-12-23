export function LoadingState() {
  return (
    <div className="flex justify-center items-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
        <p className="text-sm text-gray-500 mt-2">Vui lòng đợi trong giây lát</p>
      </div>
    </div>
  )
}