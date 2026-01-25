import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Video, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MediaUploaderProps {
  type: "image" | "video" | "any";
  onFileSelect: (file: File) => void;
  onClear: () => void;
  accept?: string;
}

export default function MediaUploader({ type, onFileSelect, onClear, accept }: MediaUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
      
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        setPreview(null); // No preview for video yet, just icon
      }
    }
  };

  const clearFile = () => {
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
    onClear();
  };

  const getIcon = () => {
    if (type === "image") return <ImageIcon size={32} />;
    if (type === "video") return <Video size={32} />;
    return <File size={32} />;
  };

  const getLabel = () => {
    if (type === "image") return "Adicionar Imagem";
    if (type === "video") return "Adicionar Vídeo";
    return "Adicionar Arquivo";
  };

  const getAccept = () => {
    if (accept) return accept;
    if (type === "image") return "image/*";
    if (type === "video") return "video/*";
    return "*/*";
  };

  return (
    <div className="w-full">
      {!fileName ? (
        <div 
          className="neu-flat border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors cursor-pointer p-8 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary"
          onClick={() => inputRef.current?.click()}
        >
          <div className="p-4 rounded-full bg-muted/50">
            {getIcon()}
          </div>
          <span className="font-medium">{getLabel()}</span>
          <span className="text-xs opacity-70">Toque para selecionar</span>
          <input 
            ref={inputRef}
            type="file" 
            className="hidden" 
            accept={getAccept()}
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="neu-flat p-4 relative group animate-in fade-in zoom-in-95">
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-md z-10"
            onClick={clearFile}
          >
            <X size={16} />
          </Button>
          
          {preview ? (
            <div className="rounded-lg overflow-hidden bg-black/5 aspect-video flex items-center justify-center">
              <img src={preview} alt="Preview" className="max-h-64 w-full object-contain" />
            </div>
          ) : (
            <div className="flex items-center gap-4 p-2">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {getIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground uppercase">{type}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
