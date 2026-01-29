import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress"; 
import { toast } from "sonner";
import { manifestacaoService } from "@/services/manifestacaoService";
import { useAuth } from "@/contexts/AuthContext"; 
import { 
  FileImage, FileVideo, FileAudio, FileText, File as FileGeneric, 
  UploadCloud, XCircle, AlertTriangle, VenetianMask, Save, Mic, MicOff, Loader2 
} from "lucide-react";
import ChatbotAssistente from "@/components/ChatbotAssistente";
import { useChat } from "@/contexts/ChatContext"; 
import { api } from "@/lib/api"; // Importação direta da API

const MAX_SIZE_MB = 100;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const STORAGE_KEY = "manifestacao_draft_v2"; 

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-500" />;
  if (fileType.startsWith('video/')) return <FileVideo className="w-5 h-5 text-purple-500" />;
  if (fileType.startsWith('audio/')) return <FileAudio className="w-5 h-5 text-green-500" />;
  if (fileType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
  return <FileGeneric className="w-5 h-5 text-muted-foreground" />;
};

const tiposManifestacao = [
  { valor: "reclamacao", label: "Reclamação" },
  { valor: "denuncia", label: "Denúncia" },
  { valor: "elogio", label: "Elogio" },
  { valor: "sugestao", label: "Sugestão" },
  { valor: "informacao", label: "Informação" },
  { valor: "solicitacao", label: "Solicitação" },
];

export default function NovaManifestacao() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth(); 
  const { setMode, setCurrentField } = useChat();
  const searchParams = new URLSearchParams(window.location.search);

  // Estados do Formulário
  const [step, setStep] = useState(1);
  const [assuntos, setAssuntos] = useState<any[]>([]); 
  const [assuntosLoading, setAssuntosLoading] = useState(true); // NOVO ESTADO DE LOADING
  const [selectedAssunto, setSelectedAssunto] = useState<any>(null); 
  const [dynamicData, setDynamicData] = useState<Record<string, any>>({}); 
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);

  // --- ESTADOS PARA O RECONHECIMENTO DE VOZ ---
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const progressPercentage = Math.min((totalSize / MAX_SIZE_BYTES) * 100, 100);

  const [formData, setFormData] = useState({
    anonimo: searchParams.get("anonimo") === "true",
    assunto: searchParams.get("assunto_id") || "",
    classificacao: "reclamacao", 
    descricao: ""
  });

  const tiposDisponiveis = formData.anonimo 
    ? tiposManifestacao.filter(t => ['reclamacao', 'denuncia'].includes(t.valor))
    : tiposManifestacao;

  // --- Efeitos ---
  useEffect(() => {
    if (formData.anonimo) {
      const tipoValido = ['reclamacao', 'denuncia'].includes(formData.classificacao);
      if (!tipoValido) {
        setFormData(prev => ({ ...prev, classificacao: 'reclamacao' }));
        toast.info("Tipo alterado para 'Reclamação' conforme regras de anonimato.");
      }
    }
  }, [formData.anonimo]);

  useEffect(() => {
    setMode("guide");
    return () => {
        setMode("global");
        setCurrentField(null);
    };
  }, [setMode, setCurrentField]);

  // CARREGAMENTO DE ASSUNTOS CORRIGIDO
  useEffect(() => {
    const init = async () => {
        try {
            setAssuntosLoading(true);
            // Chama direto a API para garantir o formato correto
            const res = await api.get("/assuntos/?apenas_ativos=true"); 
            const data = res.data;
            // Garante que é array, mesmo se vier dentro de { assuntos: [...] }
            const lista = data.assuntos || (Array.isArray(data) ? data : []);
            
            setAssuntos(lista);

            // Recupera Rascunho
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.formData.descricao || parsed.step > 1 || parsed.formData.assunto) {
                    setFormData(parsed.formData);
                    setStep(parsed.step || 1);
                    if (parsed.formData.assunto) {
                        const found = lista.find((a: any) => String(a.id) === String(parsed.formData.assunto));
                        if (found) {
                            setSelectedAssunto(found);
                            if (parsed.dynamicData) setDynamicData(parsed.dynamicData);
                        }
                    }
                    toast.info("Rascunho recuperado.");
                }
            } else if (formData.assunto) {
                const found = lista.find((a: any) => String(a.id) === formData.assunto);
                if (found) setSelectedAssunto(found);
            }
        } catch (err) {
            console.error(err);
            toast.error("Erro ao carregar lista de assuntos.");
        } finally {
            setAssuntosLoading(false);
        }
    };
    init();
  }, []);

  useEffect(() => {
    if (formData.descricao || formData.assunto || step > 1) {
        const draft = { formData, dynamicData, step };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
  }, [formData, dynamicData, step]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (step > 1 || formData.descricao.length > 5) {
            e.preventDefault();
            e.returnValue = ''; 
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step, formData]);

  const handleFocus = (fieldName: string) => {
    setActiveField(fieldName);
    setCurrentField(fieldName);
  };

  // --- LÓGICA DE VOZ/TRANSCRIÇÃO ---
  const toggleRecording = async () => {
    if (isRecording) {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                await sendAudioToBackend(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            toast.info("Gravando... Fale pausadamente.");
        } catch (error: any) {
            console.error("Erro mic:", error);
            if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                toast.error("Nenhum microfone encontrado neste dispositivo.");
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                toast.error("Permissão de microfone negada.");
            } else {
                toast.error("Erro ao acessar microfone.");
            }
        }
    }
  };

  const sendAudioToBackend = async (audioBlob: Blob) => {
      setIsTranscribing(true);
      const formDataAudio = new FormData();
      formDataAudio.append("arquivo", audioBlob, "gravacao.webm");

      try {
          // Tenta enviar para o backend Python (Whisper)
          const res = await api.post("/transcricao/", formDataAudio, {
              headers: { "Content-Type": "multipart/form-data" }
          });
          
          const textoTranscrito = res.data.texto;
          if (textoTranscrito) {
              const spacer = (formData.descricao && !formData.descricao.endsWith(' ')) ? ' ' : '';
              setFormData(prev => ({ ...prev, descricao: prev.descricao + spacer + textoTranscrito }));
              toast.success("Áudio transcrito!");
          } else {
              toast.warning("Não foi possível entender o áudio.");
          }
      } catch (error) {
          console.error("Erro transcrição:", error);
          toast.error("Erro ao transcrever. Verifique se o backend está rodando.");
      } finally {
          setIsTranscribing(false);
      }
  };

  const handleAssuntoChange = (id: string) => {
    const found = assuntos.find(a => String(a.id) === id);
    setSelectedAssunto(found);
    setFormData({ ...formData, assunto: id });
    setDynamicData({}); 
    handleFocus("assunto"); 
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFocus("arquivos"); 
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newFilesSize = newFiles.reduce((acc, file) => acc + file.size, 0);
      if (totalSize + newFilesSize > MAX_SIZE_BYTES) {
        toast.error(`Limite de ${MAX_SIZE_MB}MB excedido.`);
        e.target.value = "";
        return;
      }
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.classificacao) return toast.error("Selecione o tipo.");
      if (!formData.assunto) return toast.error("Selecione um assunto.");
    }
    if (step === 2) {
      if (isRecording) return toast.warning("Pare a gravação antes de continuar.");
      if (!formData.descricao) return toast.error("Descreva o ocorrido.");
      if (formData.descricao.trim().length < 10) return toast.error("Descrição muito curta (mínimo 10 caracteres).");
    }
    if (step === 3 && selectedAssunto?.campos_adicionais) {
      const camposPendentes = Object.entries(selectedAssunto.campos_adicionais)
        .filter(([key, config]: [string, any]) => {
          if (config.obrigatorio) {
            const valor = dynamicData[key];
            return !valor || (typeof valor === 'string' && valor.trim() === '');
          }
          return false;
        });
      if (camposPendentes.length > 0) return toast.error("Preencha os campos obrigatórios (*).");
    }
    setStep(step + 1);
  };

  const handleExit = () => {
      if (step > 1 || formData.descricao.length > 0) {
          if (window.confirm("Deseja sair? Seu rascunho de texto será salvo.")) setLocation("/");
      } else {
          setLocation("/");
      }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else handleExit();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const data = new FormData();
    data.append("classificacao", formData.classificacao);
    data.append("relato", formData.descricao);
    data.append("assunto_id", formData.assunto);
    data.append("anonimo", String(formData.anonimo));
    data.append("dados_complementares", JSON.stringify(dynamicData));
    files.forEach((file) => data.append("arquivos", file));

    try {
      const result = await manifestacaoService.criarManifestacao(data);
      localStorage.removeItem(STORAGE_KEY); 
      if (formData.anonimo) toast.success("Manifestação anônima recebida!");
      else toast.success(`Protocolo gerado: ${result.protocolo}`);
      setLocation("/manifestacoes"); 
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao enviar manifestação.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col animate-in slide-in-from-bottom-4 duration-500 relative">
      <ChatbotAssistente mode="guide" currentField={activeField} />

      {/* Wizard */}
      <div className="flex items-center justify-center mb-8 px-4 relative">
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`h-2.5 w-12 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary shadow-sm' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 bg-card rounded-3xl shadow-sm border border-border p-8 md:p-12 min-h-[600px] flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
          
          <div className="flex justify-end mb-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 opacity-60">
                <Save className="w-3 h-3" /> Rascunho automático
            </span>
          </div>

          {/* Passo 1: Tipo e Assunto */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 flex-1">
              <div className="text-center space-y-3 mb-6">
                <h2 className="text-3xl font-bold text-foreground">O que você deseja fazer?</h2>
                <p className="text-lg text-muted-foreground">Escolha o tipo e o assunto da sua manifestação.</p>
              </div>

              <div className={`grid gap-8 w-full transition-all duration-500 ${formData.anonimo ? "bg-muted/30 p-8 rounded-3xl border-2 border-border shadow-inner" : "bg-card"}`}>
                
                <div className={`flex items-center justify-between p-6 rounded-2xl w-full border transition-all duration-300 ${formData.anonimo ? "bg-card border-border shadow-sm" : "bg-muted/30 border-border"}`} onClick={() => handleFocus("anonimo")}>
                  <div className="space-y-1">
                    <Label className="text-lg font-semibold text-foreground flex items-center gap-2">
                      {formData.anonimo && <VenetianMask className="w-5 h-5 text-muted-foreground" />} Deseja anonimato?
                    </Label>
                    <p className="text-muted-foreground">Seus dados pessoais não serão revelados</p>
                  </div>
                  <Switch checked={formData.anonimo} onCheckedChange={c => { setFormData({...formData, anonimo: c}); handleFocus("anonimo"); }} className="data-[state=checked]:bg-primary scale-125 mr-2" />
                </div>

                {formData.anonimo && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400">Modo Anônimo Ativado</h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300">Aviso: Você não poderá acompanhar o andamento.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 w-full" onClick={() => handleFocus("classificacao")}>
                  <Label className="text-base font-semibold text-foreground">Tipo de Manifestação</Label>
                  <Select value={formData.classificacao} onValueChange={(val) => { setFormData({...formData, classificacao: val}); handleFocus("classificacao"); }} onOpenChange={(open) => open && handleFocus("classificacao")}>
                    <SelectTrigger className="!w-full !h-14 !px-4 !py-2 !text-lg !bg-background !border-border !rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{tiposDisponiveis.map((tipo) => (<SelectItem key={tipo.valor} value={tipo.valor}>{tipo.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 w-full" onClick={() => handleFocus("assunto")}>
                  <Label className="text-base font-semibold text-foreground">Assunto</Label>
                  <Select value={formData.assunto} onValueChange={handleAssuntoChange} onOpenChange={(open) => open && handleFocus("assunto")}>
                    <SelectTrigger className="!w-full !h-14 !px-4 !py-2 !text-lg !bg-background !border-border !rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {/* LÓGICA DE CARREGAMENTO CORRIGIDA */}
                      {assuntosLoading ? (
                          <SelectItem value="loading" disabled>Carregando assuntos...</SelectItem>
                      ) : assuntos.length > 0 ? (
                          assuntos.map(a => (<SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>))
                      ) : (
                          <SelectItem value="disabled" disabled>Nenhum assunto disponível</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Passo 2: Descrição + VOZ */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 flex-1">
              <div className="text-center space-y-3 mb-6">
                <h2 className="text-3xl font-bold text-foreground">Relate o ocorrido</h2>
                <p className="text-lg text-muted-foreground">Conte-nos os detalhes com clareza.</p>
              </div>
              <div className="w-full space-y-3 relative">
                <div className="flex justify-between items-end mb-2">
                    <Label className="text-base font-semibold text-foreground">Descrição Detalhada</Label>
                    <Button type="button" variant={isRecording ? "destructive" : "outline"} size="sm" onClick={toggleRecording} disabled={isTranscribing} className={`gap-2 transition-all ${isRecording ? "animate-pulse" : ""}`}>
                        {isTranscribing ? <><Loader2 className="animate-spin w-4 h-4" /> Transcrevendo...</> : isRecording ? <><MicOff size={16} /> Parar e Transcrever</> : <><Mic size={16} /> Ditado por Voz</>}
                    </Button>
                </div>
                <div className="relative">
                    {isRecording && <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold z-10 border border-red-200 shadow-sm"><div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />Gravando...</div>}
                    <Textarea placeholder="Descreva aqui..." className="min-h-[250px] p-6 text-lg bg-background border-border text-foreground rounded-2xl resize-none focus:ring-2 focus:ring-primary/20" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} onFocus={() => handleFocus("descricao")} disabled={isTranscribing} />
                </div>
                <div className={`text-right text-sm mt-2 ${formData.descricao.length < 10 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>{formData.descricao.length} caracteres</div>
              </div>
            </div>
          )}

          {/* Passo 3: Dados Complementares */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 flex-1">
              <div className="text-center space-y-3 mb-10"><h2 className="text-3xl font-bold text-foreground">Dados da Ocorrência</h2><p className="text-lg text-muted-foreground">Preencha as informações complementares.</p></div>
              <div className="w-full">
                {selectedAssunto?.campos_adicionais && Object.keys(selectedAssunto.campos_adicionais).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(selectedAssunto.campos_adicionais).map(([key, config]: [string, any]) => (
                      <div key={key} className="space-y-3" onClick={() => handleFocus(`dinamico_${key}`)}>
                        <Label className="text-base font-semibold text-foreground">{config.label} {config.obrigatorio && "*"}</Label>
                        {config.tipo === "select" ? (
                          <Select onValueChange={(val) => setDynamicData({ ...dynamicData, [key]: val })} onOpenChange={(open) => open && handleFocus(`dinamico_${key}`)}>
                            <SelectTrigger className="!w-full !h-14 !px-4 !py-2 !text-lg !bg-background !border-border !rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>{config.opcoes?.map((opt: string) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
                          </Select>
                        ) : (
                          <Input className="h-14 px-4 py-2 text-lg bg-background border-border text-foreground rounded-xl" type={config.tipo === "date" ? "date" : "text"} onChange={e => setDynamicData({...dynamicData, [key]: e.target.value})} onFocus={() => handleFocus(`dinamico_${key}`)} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border"><p className="text-muted-foreground text-lg">Nenhum dado adicional necessário.</p></div>
                )}
              </div>
            </div>
          )}

          {/* Passo 4: Upload */}
          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 flex-1">
              <div className="text-center space-y-3 mb-6"><h2 className="text-3xl font-bold text-foreground">Anexar Arquivos</h2><p className="text-lg text-muted-foreground">Envie comprovantes. Opcional.</p></div>
              <div className="w-full space-y-6" onClick={() => handleFocus("anexos")}>
                <div className="border-2 border-dashed border-border bg-muted/20 rounded-2xl p-8 text-center hover:bg-muted/40 transition-colors group cursor-pointer"><input type="file" id="file-upload" multiple className="hidden" onChange={handleFileChange} accept="image/*,video/*,audio/*,application/pdf" /><label htmlFor="file-upload" className="cursor-pointer w-full h-full block"><div className="flex flex-col items-center gap-3"><UploadCloud className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" /><p className="text-lg font-medium text-foreground group-hover:text-primary">Clique para selecionar</p><p className="text-sm text-muted-foreground">Máximo de {MAX_SIZE_MB}MB.</p></div></label></div>
                {files.length > 0 && <div className="bg-card border border-border rounded-xl p-4 space-y-3">{files.map((file, index) => (<div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border"><div className="flex items-center gap-3 truncate">{getFileIcon(file.type)}<span className="text-foreground font-medium truncate max-w-[200px]">{file.name}</span></div><button onClick={() => removeFile(index)} className="text-muted-foreground hover:text-destructive"><XCircle className="w-5 h-5" /></button></div>))}</div>}
              </div>
            </div>
          )}

          {/* Passo 5: Confirmação */}
          {step === 5 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 flex-1">
              <div className="text-center space-y-3 mb-10"><h2 className="text-3xl font-bold text-foreground">Dados do Manifestante</h2><p className="text-lg text-muted-foreground">Confirme seus dados.</p></div>
              <div className="space-y-6 w-full">
                <div className="p-8 bg-card rounded-3xl border border-border space-y-6 shadow-sm">
                  {formData.anonimo ? <div className="bg-muted/30 p-6 rounded-2xl border border-border text-center space-y-2"><h3 className="text-lg font-bold text-foreground">Identidade Preservada</h3><p className="text-muted-foreground">Manifestação <strong>ANÔNIMA</strong>.</p></div> : <div className="grid gap-2"><span className="text-sm text-muted-foreground font-bold tracking-wider">Nome</span><p className="text-xl font-medium text-foreground">{user?.nome}</p></div>}
                  <div className="grid gap-2"><span className="text-sm text-muted-foreground font-bold tracking-wider">Resumo</span><p className="text-lg text-foreground flex items-center gap-2"><span className="font-semibold capitalize">{tiposManifestacao.find(t => t.valor === formData.classificacao)?.label}</span><span className="text-muted-foreground">•</span><span>{files.length} arquivo(s)</span></p></div>
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="pt-10 mt-auto border-t border-border flex justify-between items-center gap-4 w-full">
            <Button variant="outline" onClick={handleBack} className="h-12 md:h-14 px-4 md:px-8 text-base md:text-lg font-medium border-border text-muted-foreground hover:bg-muted rounded-xl">Voltar</Button>
            <Button onClick={step === 5 ? handleSubmit : handleNext} disabled={isLoading} className="h-12 md:h-14 px-6 md:px-10 text-base md:text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20">{step === 5 ? (isLoading ? "Enviando..." : "Confirmar") : "Próxima Etapa"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}