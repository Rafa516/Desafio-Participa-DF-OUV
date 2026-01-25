import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, CheckCircle2, Send } from "lucide-react";
import AudioRecorder from "@/components/AudioRecorder";
import MediaUploader from "@/components/MediaUploader";
import { toast } from "sonner";
import { manifestacaoService } from "@/services/manifestacaoService";
import { Assunto } from "@/lib/api";

export default function NovaManifestacao() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialType = searchParams.get("type") || "texto";
  const isAnonimo = searchParams.get("anonimo") === "true";

  const [step, setStep] = useState(1);
  const [assuntos, setAssuntos] = useState<Assunto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    tipo: initialType,
    anonimo: isAnonimo,
    assunto: "",
    descricao: "",
    midia: null as File | Blob | null,
    nome: "",
    email: "",
    cpf: ""
  });

  useEffect(() => {
    manifestacaoService.listarAssuntos()
      .then(setAssuntos)
      .catch(() => toast.error("Erro ao carregar assuntos."));
  }, []);

  const handleNext = () => {
    if (step === 1 && !formData.assunto) {
      toast.error("Por favor, selecione um assunto.");
      return;
    }
    if (step === 2 && !formData.descricao && formData.tipo === "texto") {
      toast.error("Por favor, descreva sua manifestação.");
      return;
    }
    if (step === 2 && !formData.midia && formData.tipo !== "texto") {
      toast.error("Por favor, grave ou anexe sua mídia.");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else setLocation("/");
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    const data = new FormData();
    data.append("tipo", formData.tipo);
    data.append("assunto_id", formData.assunto);
    data.append("descricao", formData.descricao);
    data.append("anonimo", String(formData.anonimo));
    
    if (!formData.anonimo) {
      data.append("nome", formData.nome);
      data.append("email", formData.email);
      data.append("cpf", formData.cpf);
    }

    if (formData.midia) {
      if (formData.midia instanceof Blob && !(formData.midia instanceof File)) {
        data.append("arquivo", formData.midia, "audio_gravado.webm");
      } else {
        data.append("arquivo", formData.midia);
      }
    }

    try {
      const result = await manifestacaoService.criarManifestacao(data);
      toast.success(`Manifestação registrada! Protocolo: ${result.protocolo}`);
      setLocation(`/manifestacoes/${result.protocolo}`);
    } catch (error) {
      toast.error("Erro ao enviar manifestação. Tente novamente.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header com Progresso */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full hover:bg-primary/10 text-primary">
          <ArrowLeft size={24} />
        </Button>
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-2 w-8 rounded-full transition-colors duration-300 ${s <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="space-y-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold font-nunito text-primary">Sobre o que você quer falar?</h2>
              <p className="text-muted-foreground font-lato">Selecione a categoria que melhor se encaixa.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-nunito font-bold text-foreground">Tipo de Manifestação</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(v) => setFormData({...formData, tipo: v})}
                >
                  <SelectTrigger className="neu-flat h-12 border-none focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="texto">Texto</SelectItem>
                    <SelectItem value="audio">Áudio</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="imagem">Imagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-nunito font-bold text-foreground">Assunto</Label>
                <Select 
                  value={formData.assunto} 
                  onValueChange={(v) => setFormData({...formData, assunto: v})}
                >
                  <SelectTrigger className="neu-flat h-12 border-none focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Selecione o assunto" />
                  </SelectTrigger>
                  <SelectContent>
                    {assuntos.map((assunto) => (
                      <SelectItem key={assunto.id} value={String(assunto.id)}>
                        {assunto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 neu-flat rounded-xl border-none">
                <div className="space-y-0.5">
                  <Label className="text-base font-nunito font-bold text-foreground">Manifestação Anônima</Label>
                  <p className="text-sm text-muted-foreground font-lato">Seus dados não serão revelados</p>
                </div>
                <Switch 
                  checked={formData.anonimo}
                  onCheckedChange={(c) => setFormData({...formData, anonimo: c})}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold font-nunito text-primary">Descreva o ocorrido</h2>
              <p className="text-muted-foreground font-lato">Conte-nos os detalhes da sua manifestação.</p>
            </div>

            {formData.tipo === "texto" && (
              <div className="space-y-2">
                <Label className="font-nunito font-bold text-foreground">Descrição</Label>
                <Textarea 
                  placeholder="Digite aqui os detalhes..." 
                  className="neu-flat min-h-[200px] resize-none p-4 text-base border-none focus:ring-2 focus:ring-primary/20 font-lato"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                />
              </div>
            )}

            {formData.tipo === "audio" && (
              <div className="space-y-4">
                <Label className="font-nunito font-bold text-foreground">Gravação de Áudio</Label>
                <AudioRecorder 
                  onAudioRecorded={(blob) => setFormData({...formData, midia: blob})}
                  onClear={() => setFormData({...formData, midia: null})}
                />
                <div className="space-y-2">
                  <Label className="font-nunito font-bold text-foreground">Observações (Opcional)</Label>
                  <Textarea 
                    placeholder="Adicione observações em texto se desejar..." 
                    className="neu-flat border-none focus:ring-2 focus:ring-primary/20 font-lato"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  />
                </div>
              </div>
            )}

            {(formData.tipo === "imagem" || formData.tipo === "video") && (
              <div className="space-y-4">
                <Label className="font-nunito font-bold text-foreground">Anexar {formData.tipo === "imagem" ? "Imagem" : "Vídeo"}</Label>
                <MediaUploader 
                  type={formData.tipo as "image" | "video"}
                  onFileSelect={(file) => setFormData({...formData, midia: file})}
                  onClear={() => setFormData({...formData, midia: null})}
                />
                <div className="space-y-2">
                  <Label className="font-nunito font-bold text-foreground">Descrição</Label>
                  <Textarea 
                    placeholder={`Descreva o que aparece no ${formData.tipo}...`} 
                    className="neu-flat border-none focus:ring-2 focus:ring-primary/20 font-lato"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold font-nunito text-primary">Identificação</h2>
              <p className="text-muted-foreground font-lato">
                {formData.anonimo 
                  ? "Como você optou pelo anonimato, estes dados são opcionais." 
                  : "Precisamos dos seus dados para contato."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-nunito font-bold text-foreground">Nome Completo</Label>
                <Input 
                  placeholder="Seu nome" 
                  className="neu-flat h-12 border-none focus:ring-2 focus:ring-primary/20 font-lato"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-nunito font-bold text-foreground">E-mail</Label>
                <Input 
                  type="email" 
                  placeholder="seu@email.com" 
                  className="neu-flat h-12 border-none focus:ring-2 focus:ring-primary/20 font-lato"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-nunito font-bold text-foreground">CPF</Label>
                <Input 
                  placeholder="000.000.000-00" 
                  className="neu-flat h-12 border-none focus:ring-2 focus:ring-primary/20 font-lato"
                  value={formData.cpf}
                  onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                />
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-xl flex gap-3 items-start border border-primary/10">
              <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-muted-foreground font-lato">
                Ao enviar, você concorda com os termos de uso e política de privacidade da Ouvidoria do DF.
              </p>
            </div>
          </div>
        )}

        <div className="pt-4">
          <Button 
            onClick={step === 3 ? handleSubmit : handleNext} 
            className="w-full h-14 text-lg font-nunito font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-[0.98]"
            disabled={isLoading}
          >
            {step === 3 ? (
              <>
                Enviar Manifestação
                <Send className="ml-2" size={20} />
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="ml-2" size={20} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
