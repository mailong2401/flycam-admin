import { useRef, useState, useMemo, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Upload } from "lucide-react";
import { supabase } from "@/services/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

declare global {
  interface Window {
    __quillSelection?: {
      index: number;
      length: number;
      selectedText: string;
    };
  }
}

export default function RichTextEditorQuill({ value, onChange }: Props) {
  const quillRef = useRef<ReactQuill | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [openVideoDialog, setOpenVideoDialog] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [openLinkDialog, setOpenLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "code-block"],
        ["link", "image", "video"],
        ["clean"],
      ],
      handlers: {
        image: () => fileRef.current?.click(),
        video: () => setOpenVideoDialog(true),
        // Không override link → Quill sẽ gọi handler mặc định, nhưng ta sẽ bắt event riêng
      },
    },
  }), []);

  const formats = useMemo(() => [
    "header", "bold", "italic", "underline", "strike",
    "list", "bullet", "blockquote", "code-block",
    "link", "image", "video",
  ], []);

  function extractYouTubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  const insertYouTubeVideo = async () => {
    if (!youtubeUrl.trim()) return;

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      alert("URL YouTube không hợp lệ!");
      return;
    }

    setLoadingVideo(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Bạn cần đăng nhập để thêm video!");
        setLoadingVideo(false);
        return;
      }

      const functionUrl = "https://gdinjingcaxasxcenmbq.supabase.co/functions/v1/youtube-metadata";

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ videoId }),
      });

      let title = "Video YouTube";

      if (response.ok) {
        const data = await response.json();
        title = data.title || title;
      }

      const embedUrl = `https://www.youtube.com/embed/${videoId}`;

      const html = `
        <figure class="youtube-video my-8">
          <div class="relative w-full pb-[56.25%] rounded-2xl overflow-hidden border border-border shadow-lg">
            <iframe 
              src="${embedUrl}" 
              frameborder="0" 
              allowfullscreen 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              class="absolute inset-0 w-full h-full">
            </iframe>
          </div>
          <figcaption class="text-center text-sm text-muted-foreground mt-3 italic">
            ${title}
          </figcaption>
        </figure>
      `;

      const editor = quillRef.current?.getEditor();
      const range = editor?.getSelection(true);
      if (editor && range) {
        editor.clipboard.dangerouslyPasteHTML(range.index, html);
        editor.setSelection(range.index + 1, 0);
      }

      setYoutubeUrl("");
      setOpenVideoDialog(false);
    } catch (err) {
      console.error(err);
      alert("Thêm video thất bại. Vui lòng thử lại.");
    } finally {
      setLoadingVideo(false);
    }
  };

  const insertLink = () => {
    if (!linkUrl.trim()) {
      alert("Vui lòng nhập URL hợp lệ!");
      return;
    }

    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const selection = window.__quillSelection;

    if (selection) {
      let textToInsert = linkText.trim();

      if (selection.length > 0 && !textToInsert) {
        textToInsert = selection.selectedText;
      } else if (!textToInsert) {
        textToInsert = url;
      }

      if (selection.length > 0) {
        editor.deleteText(selection.index, selection.length);
        editor.insertText(selection.index, textToInsert, "link", url, "user");
      } else {
        editor.insertText(selection.index, textToInsert, "link", url, "user");
        editor.setSelection(selection.index, textToInsert.length);
      }

      delete window.__quillSelection;
    } else {
      const range = editor.getSelection();
      if (range) {
        let textToInsert = linkText.trim() || url;

        if (range.length > 0) {
          editor.deleteText(range.index, range.length);
          editor.insertText(range.index, textToInsert, "link", url, "user");
        } else {
          editor.insertText(range.index, textToInsert, "link", url, "user");
          editor.setSelection(range.index, textToInsert.length);
        }
      }
    }

    setLinkUrl("");
    setLinkText("");
    setOpenLinkDialog(false);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `editor/${filename}`;

      const { error } = await supabase.storage.from("blog-images").upload(filePath, file);
      if (error) throw error;

      const { data } = supabase.storage.from("blog-images").getPublicUrl(filePath);

      const editor = quillRef.current?.getEditor();
      const range = editor?.getSelection(true);
      if (editor && range) {
        editor.insertEmbed(range.index, "image", data.publicUrl);
      }
    } catch (err) {
      console.error(err);
      alert("Upload ảnh thất bại");
    } finally {
      setUploading(false);
    }
  };

  // Bắt click nút link để mở dialog + lưu selection
  useEffect(() => {
    const toolbar = document.querySelector('.ql-toolbar');
    if (!toolbar) return;

    const linkButton = toolbar.querySelector('.ql-link');
    if (linkButton) {
      const newLinkButton = linkButton.cloneNode(true);
      linkButton.parentNode?.replaceChild(newLinkButton, linkButton);

      newLinkButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const editor = quillRef.current?.getEditor();
        if (!editor) return;

        const range = editor.getSelection();

        if (range && range.length > 0) {
          const selectedText = editor.getText(range.index, range.length);
          window.__quillSelection = {
            index: range.index,
            length: range.length,
            selectedText
          };
          setLinkText(selectedText);
        } else if (range) {
          window.__quillSelection = {
            index: range.index,
            length: 0,
            selectedText: ""
          };
          setLinkText("");
        }

        setLinkUrl("");
        setOpenLinkDialog(true);
      });
    }
  }, []);

  // Tooltip toolbar (giữ nguyên như cũ)
  useEffect(() => {
    const toolbar = document.querySelector('.ql-toolbar');
    if (!toolbar) return;

    const buttonTitles: Record<string, string> = {
      '.ql-bold': 'In đậm (Ctrl+B)',
      '.ql-italic': 'In nghiêng (Ctrl+I)',
      '.ql-underline': 'Gạch chân (Ctrl+U)',
      '.ql-strike': 'Gạch ngang',
      '.ql-header[value="1"]': 'Tiêu đề 1',
      '.ql-header[value="2"]': 'Tiêu đề 2',
      '.ql-header[value="3"]': 'Tiêu đề 3',
      '.ql-header .ql-picker-label': 'Kiểu tiêu đề',
      '.ql-list[value="ordered"]': 'Danh sách có số',
      '.ql-list[value="bullet"]': 'Danh sách gạch đầu dòng',
      '.ql-blockquote': 'Trích dẫn',
      '.ql-code-block': 'Khối mã code',
      '.ql-link': 'Chèn liên kết (Ctrl+K)',
      '.ql-image': 'Chèn ảnh',
      '.ql-video': 'Chèn video YouTube',
      '.ql-clean': 'Xóa định dạng',
    };

    Object.entries(buttonTitles).forEach(([selector, title]) => {
      toolbar.querySelectorAll(selector).forEach((el) => {
        const element = el as HTMLElement;
        element.title = title;
        if (!selector.includes('header')) {
          element.classList.add('group');
        }
      });
    });

    const picker = toolbar.querySelector('.ql-header .ql-picker-label');
    if (picker) {
      picker.classList.remove('group');
      picker.classList.add('no-hover-tooltip');
    }
  }, []);

  return (
    <div className="mt-4">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder="Nhập nội dung blog của bạn..."
        className="
          bg-white
          [&_.ql-toolbar]:rounded-t-lg
          [&_.ql-toolbar]:border-b
          [&_.ql-toolbar]:border-border
          [&_.ql-container]:min-h-[250px]
          [&_.ql-container]:rounded-b-lg
          [&_.ql-container]:border
          [&_.ql-container]:border-border
          [&_.ql-editor]:min-h-[200px]
          [&_.ql-editor]:text-black !important
          [&_.ql-editor_*]:text-black
          [&_.ql-tooltip]:hidden !important

          /* Tooltip khi hover nút toolbar (giữ nguyên) */
          [&_.ql-toolbar_.group:hover]:relative
          [&_.ql-toolbar_.group:hover]:z-10
          [&_.ql-toolbar_.group:hover::after]:content-[attr(title)]
          [&_.ql-toolbar_.group:hover::after]:absolute
          [&_.ql-toolbar_.group:hover::after]:-bottom-8
          [&_.ql-toolbar_.group:hover::after]:left-1/2
          [&_.ql-toolbar_.group:hover::after]:-translate-x-1/2
          [&_.ql-toolbar_.group:hover::after]:bg-gray-900
          [&_.ql-toolbar_.group:hover::after]:text-white
          [&_.ql-toolbar_.group:hover::after]:text-xs
          [&_.ql-toolbar_.group:hover::after]:px-3
          [&_.ql-toolbar_.group:hover::after]:py-1.5
          [&_.ql-toolbar_.group:hover::after]:rounded-lg
          [&_.ql-toolbar_.group:hover::after]:whitespace-nowrap
          [&_.ql-toolbar_.group:hover::after]:shadow-xl
          [&_.ql-toolbar_.group:hover::after]:pointer-events-none
          [&_.ql-toolbar_.group:hover::before]:content-['']
          [&_.ql-toolbar_.group:hover::before]:absolute
          [&_.ql-toolbar_.group:hover::before]:-bottom-2
          [&_.ql-toolbar_.group:hover::before]:left-1/2
          [&_.ql-toolbar_.group:hover::before]:-translate-x-1/2
          [&_.ql-toolbar_.group:hover::before]:border-4
          [&_.ql-toolbar_.group:hover::before]:border-transparent
          [&_.ql-toolbar_.group:hover::before]:border-b-gray-900

          /* FIX DROPDOWN HEADING - CHÍNH XÁC Ý BẠN */
          /* Mặc định tất cả item: chữ đen */
          [&_.ql-header_.ql-picker-item]:text-black

          /* Hover vào bất kỳ item nào: chữ xanh dương */
          [&_.ql-header_.ql-picker-item:hover]:text-blue-700

          /* Item đang được chọn (active): chữ xanh dương */
          [&_.ql-header_.ql-picker-item.ql-selected]:text-blue-700
          [&_.ql-header_.ql-picker-label.ql-active]:text-blue-700

          /* Dropdown nền trắng sạch */
          [&_.ql-header_.ql-picker-options]:bg-white

          /* Tắt hoàn toàn hover background (nếu Quill có) */
          [&_.ql-header_.ql-picker-item:hover]:bg-transparent
        "
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            uploadImage(file);
            e.target.value = "";
          }
        }}
      />

      {uploading && (
        <div className="flex items-center gap-2 border-t px-3 py-2 text-sm text-gray-500">
          <Upload className="w-4 h-4" />
          Đang upload ảnh...
        </div>
      )}

      {/* Dialog thêm video YouTube */}
      <Dialog open={openVideoDialog} onOpenChange={setOpenVideoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm video YouTube</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="youtube-url">URL YouTube</Label>
              <Input
                id="youtube-url"
                placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && insertYouTubeVideo()}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpenVideoDialog(false)}>
              Hủy
            </Button>
            <Button onClick={insertYouTubeVideo} disabled={loadingVideo}>
              {loadingVideo ? "Đang thêm..." : "Thêm video"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog chèn liên kết - từ file thứ 2 */}
      <Dialog open={openLinkDialog} onOpenChange={setOpenLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chèn liên kết</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="link-text">Tên hiển thị</Label>
              <Input
                id="link-text"
                placeholder="Nhập tên hiển thị cho liên kết"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && insertLink()}
              />
              <p className="text-xs text-muted-foreground">
                Để trống sẽ dùng URL làm tên hiển thị
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link-url">URL liên kết</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && insertLink()}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setOpenLinkDialog(false);
              setLinkUrl("");
              setLinkText("");
              delete window.__quillSelection;
            }}>
              Hủy
            </Button>
            <Button onClick={insertLink}>
              Chèn liên kết
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}