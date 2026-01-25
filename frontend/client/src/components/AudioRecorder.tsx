import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
  onAudioRecorded: (audioBlob: Blob) => void;
  onClear: () => void;
}

export default function AudioRecorder({ onAudioRecorded, onClear }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, [audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        onAudioRecorded(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
      
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const clearRecording = () => {
    setAudioURL(null);
    onClear();
    if (audioURL) URL.revokeObjectURL(audioURL);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {!audioURL ? (
        <div className="flex flex-col items-center gap-4 p-6 neu-flat transition-all">
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
            isRecording ? "bg-red-100 text-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)] scale-110" : "bg-muted text-muted-foreground"
          )}>
            <Mic size={40} className={cn(isRecording && "animate-pulse")} />
          </div>
          
          <div className="text-2xl font-mono font-bold text-foreground">
            {formatTime(recordingTime)}
          </div>

          <div className="flex gap-4">
            {!isRecording ? (
              <Button 
                onClick={startRecording} 
                className="neu-btn-primary rounded-full w-16 h-16 p-0 flex items-center justify-center"
                aria-label="Iniciar gravação"
              >
                <Mic size={24} />
              </Button>
            ) : (
              <Button 
                onClick={stopRecording} 
                variant="destructive"
                className="rounded-full w-16 h-16 p-0 flex items-center justify-center shadow-lg hover:shadow-xl"
                aria-label="Parar gravação"
              >
                <Square size={24} fill="currentColor" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isRecording ? "Gravando... Fale claramente." : "Toque para gravar seu relato"}
          </p>
        </div>
      ) : (
        <div className="neu-flat p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-10 w-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
            onClick={() => {
              const audio = new Audio(audioURL);
              audio.play();
            }}
            aria-label="Ouvir gravação"
          >
            <Play size={20} fill="currentColor" />
          </Button>
          
          <div className="flex-1 h-10 bg-muted/50 rounded-full flex items-center px-4">
            <div className="w-full h-1 bg-primary/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-full" />
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="icon"
            className="h-10 w-10 rounded-full text-destructive hover:bg-destructive/10"
            onClick={clearRecording}
            aria-label="Excluir gravação"
          >
            <Trash2 size={20} />
          </Button>
        </div>
      )}
    </div>
  );
}
