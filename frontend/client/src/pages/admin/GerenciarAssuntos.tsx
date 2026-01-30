import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, X, ListPlus, AlertTriangle, LayoutList } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// --- DEFINIÇÃO DE TIPOS ---
interface CampoConfig {
  tipo: "text" | "date" | "time" | "select";
  label: string;
  obrigatorio: boolean;
  opcoes?: string[];
}

interface Assunto {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  campos_adicionais?: Record<string, CampoConfig>;
}

export default function GerenciarAssuntos() {
  // --- ESTADOS DE DADOS ---
  const [assuntos, setAssuntos] = useState<Assunto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controle de visibilidade dos Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<Assunto | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Estados do Formulário Principal
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  
  // Dicionário que guarda os campos dinâmicos criados
  const [campos, setCampos] = useState<Record<string, CampoConfig>>({});
  
  // Estados auxiliares para criação de um novo campo
  const [novoLabel, setNovoLabel] = useState("");
  const [novoTipo, setNovoTipo] = useState<"text" | "date" | "time" | "select">("text");
  const [novoObrigatorio, setNovoObrigatorio] = useState(false);
  const [novasOpcoes, setNovasOpcoes] = useState(""); 

  // --- CARREGAMENTO DE DADOS ---
  const fetchAssuntos = async () => {
    try {
      setLoading(true);
      // Busca todos os assuntos, incluindo inativos para gestão
      const res = await api.get("/assuntos/?apenas_ativos=false");
      setAssuntos(res.data.assuntos || []);
    } catch (error) {
      toast.error("Erro ao carregar assuntos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssuntos();
  }, []);

  // --- CONTROLE DO MODAL DE EDIÇÃO/CRIAÇÃO ---
  const handleOpenModal = (item?: Assunto) => {
    // Limpa os campos temporários de "novo campo"
    setNovoLabel("");
    setNovoTipo("text");
    setNovoObrigatorio(false);
    setNovasOpcoes("");

    if (item) {
      // Preenche o formulário para edição
      setEditingItem(item);
      setNome(item.nome);
      setDescricao(item.descricao || "");
      setAtivo(item.ativo);
      setCampos(item.campos_adicionais || {});
    } else {
      // Limpa para criação de um novo
      setEditingItem(null);
      setNome("");
      setDescricao("");
      setAtivo(true);
      setCampos({});
    }
    setModalOpen(true);
  };

  // --- LÓGICA DE GERAÇÃO DE CAMPOS DINÂMICOS ---
  
  // Transforma o Label (Ex: Nome da Rua) em uma chave de banco (nome_da_rua)
  const gerarSlug = (texto: string) => {
    return texto
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
      .replace(/[^a-z0-9]/g, "_"); 
  };

  const handleAddField = () => {
    if (!novoLabel.trim()) {
      toast.warning("Informe o nome do campo.");
      return;
    }

    const slug = gerarSlug(novoLabel);
    if (campos[slug]) {
      toast.error("Este campo já foi adicionado.");
      return;
    }

    const novoCampo: CampoConfig = {
      label: novoLabel,
      tipo: novoTipo,
      obrigatorio: novoObrigatorio
    };

    // Se for do tipo lista, valida as opções
    if (novoTipo === "select") {
      if (!novasOpcoes.trim()) {
        toast.warning("Informe as opções separadas por vírgula.");
        return;
      }
      novoCampo.opcoes = novasOpcoes.split(",").map(op => op.trim()).filter(op => op !== "");
    }

    setCampos(prev => ({ ...prev, [slug]: novoCampo }));
    
    // Reseta inputs de criação de campo
    setNovoLabel("");
    setNovoTipo("text");
    setNovoObrigatorio(false);
    setNovasOpcoes("");
  };

  const handleRemoveField = (slug: string) => {
    const novos = { ...campos };
    delete novos[slug];
    setCampos(novos);
  };

  // --- OPERAÇÕES DE API (SALVAR E EXCLUIR) ---
  const handleSave = async () => {
    try {
      if (!nome.trim()) {
        toast.warning("O nome do assunto é obrigatório.");
        return;
      }

      const payload = {
        nome,
        descricao,
        ativo,
        campos_adicionais: campos
      };

      if (editingItem) {
        await api.put(`/assuntos/${editingItem.id}`, payload);
        toast.success("Assunto atualizado com sucesso!");
      } else {
        await api.post("/assuntos/", payload);
        toast.success("Novo assunto criado!");
      }

      setModalOpen(false);
      fetchAssuntos();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Erro ao processar solicitação.");
    }
  };

  const confirmDelete = (id: string) => {
      setItemToDelete(id);
      setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/assuntos/${itemToDelete}`);
      toast.success("Assunto removido permanentemente.");
      fetchAssuntos();
    } catch (error: any) {
      // Backend protege assuntos que já possuem manifestações vinculadas
      toast.error("Não é possível excluir assuntos em uso. Tente inativá-lo.");
    } finally {
        setDeleteModalOpen(false);
        setItemToDelete(null);
    }
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* SEÇÃO DE TÍTULO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Gestão de Assuntos</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Personalize os formulários que o cidadão preenche para cada assunto.
            </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
            <Plus size={18} className="mr-2" /> Novo Assunto
        </Button>
      </div>

      {/* TABELA DE ASSUNTOS */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="w-[30%] pl-6">Assunto / Descrição</TableHead>
                        <TableHead className="w-[40%] hidden md:table-cell">Campos Extras</TableHead>
                        <TableHead className="w-[15%] text-center">Disponível</TableHead>
                        <TableHead className="w-[15%] text-right pr-6">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">Sincronizando dados...</TableCell>
                        </TableRow>
                    ) : assuntos.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">Nenhum registro encontrado.</TableCell>
                        </TableRow>
                    ) : (
                        assuntos.map((assunto) => (
                            <TableRow key={assunto.id} className="hover:bg-muted/10 transition-colors">
                                <TableCell className="py-4 pl-6">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-bold text-foreground text-sm">{assunto.nome}</span>
                                        <span className="text-xs text-muted-foreground line-clamp-1 italic">{assunto.descricao || "Sem descrição."}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell py-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {assunto.campos_adicionais && Object.keys(assunto.campos_adicionais).length > 0 ? (
                                            Object.values(assunto.campos_adicionais).slice(0, 3).map((c, i) => (
                                                <Badge key={i} variant="secondary" className="text-[10px] bg-muted/50 border-border">
                                                    {c.label}
                                                </Badge>
                                            ))
                                        ) : <span className="text-xs text-muted-foreground/60 italic">Nenhum</span>}
                                        {assunto.campos_adicionais && Object.keys(assunto.campos_adicionais).length > 3 && (
                                            <Badge variant="outline" className="text-[10px] h-5">+ {Object.keys(assunto.campos_adicionais).length - 3}</Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center py-4">
                                    <Badge variant={assunto.ativo ? "default" : "secondary"} className={assunto.ativo ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-700 border-red-200"}>
                                        {assunto.ativo ? "SIM" : "NÃO"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50" onClick={() => handleOpenModal(assunto)}>
                                            <Pencil size={18} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-red-600 hover:bg-red-50" onClick={() => confirmDelete(assunto.id)}>
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* --- MODAL PRINCIPAL (FIX DE RESPONSIVIDADE) --- */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[900px] h-[92vh] md:h-auto md:max-h-[90vh] flex flex-col gap-0 p-0 border-none shadow-2xl overflow-hidden rounded-2xl animate-in zoom-in-95">
            
            {/* Header Fixo */}
            <DialogHeader className="p-4 md:p-6 border-b bg-card shrink-0">
                <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    {editingItem ? "Editar Assunto" : "Criar Novo Assunto"}
                   
                </DialogTitle>
                <DialogDescription className="text-xs md:text-sm">
                    Configure os dados básicos e os campos extras que serão exibidos para o usuário.
                </DialogDescription>
            </DialogHeader>
            
            {/* Área Central com Scroll Independente */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-card custom-scrollbar">
                
                {/* 1. DADOS BÁSICOS */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Dados Gerais
                        </Label>
                        <div className="flex items-center gap-2 bg-muted/40 px-3 py-1 rounded-full border border-border">
                            <Label htmlFor="ativo-switch" className="text-[10px] md:text-xs text-muted-foreground font-medium">Ativo no sistema?</Label>
                            <Switch id="ativo-switch" checked={ativo} onCheckedChange={setAtivo} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Título do Assunto</Label>
                            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Manutenção de Vias Públicas" className="h-11 shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Descrição de Ajuda</Label>
                            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Explique brevemente o que o cidadão pode relatar aqui..." rows={3} className="resize-none shadow-sm text-sm" />
                        </div>
                    </div>
                </section>

                <Separator />

                {/* 2. CONFIGURAÇÃO DE CAMPOS EXTRAS */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold flex items-center gap-2">
                            <LayoutList size={18} className="text-primary" /> Formulário Dinâmico
                        </Label>
                        <Badge variant="secondary" className="font-mono">{Object.keys(campos).length} campos</Badge>
                    </div>

                    {/* Formulário para Adicionar Campo */}
                    <div className="bg-muted/30 p-4 md:p-6 rounded-2xl border border-border/60 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            
                            <div className="md:col-span-5 space-y-2">
                                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nome do Campo (Label)</Label>
                                <Input value={novoLabel} onChange={e => setNovoLabel(e.target.value)} placeholder="Ex: Placa do Veículo" className="bg-background h-11" />
                            </div>

                            <div className="md:col-span-3 space-y-2">
                                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tipo</Label>
                                <Select value={novoTipo} onValueChange={(v: any) => setNovoTipo(v)}>
                                    <SelectTrigger className="bg-background h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Texto Curto</SelectItem>
                                        <SelectItem value="date">Data do Fato</SelectItem>
                                        <SelectItem value="time">Horário</SelectItem>
                                        <SelectItem value="select">Lista (Seleção)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="md:col-span-2 flex items-center justify-center gap-3 bg-background border rounded-xl h-11 px-4 shadow-sm">
                                <Switch id="req-new" checked={novoObrigatorio} onCheckedChange={setNovoObrigatorio} />
                                <Label htmlFor="req-new" className="text-[10px] font-bold cursor-pointer">OBRIG.</Label>
                            </div>

                            <Button onClick={handleAddField} className="md:col-span-2 bg-primary h-11 w-full font-bold shadow-lg shadow-primary/20">
                                <Plus size={20} />
                            </Button>
                        </div>

                        {/* Configuração de Opções se for SELECT */}
                        {novoTipo === "select" && (
                            <div className="pt-3 border-t border-dashed animate-in slide-in-from-top-2 duration-300">
                                <Label className="text-[11px] text-primary font-bold mb-2 block uppercase tracking-widest">Opções (separe por vírgula)</Label>
                                <Input value={novasOpcoes} onChange={e => setNovasOpcoes(e.target.value)} placeholder="Opção 1, Opção 2, Opção 3..." className="bg-background h-10 border-primary/20" />
                            </div>
                        )}
                    </div>

                    {/* Listagem dos Campos Adicionados */}
                    <div className="grid grid-cols-1 gap-3">
                        {Object.entries(campos).map(([slug, config]) => (
                            <div key={slug} className="flex items-center justify-between p-4 bg-card border rounded-xl shadow-sm hover:border-primary/40 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-xs border border-primary/10">
                                        {config.tipo.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-foreground">{config.label}</span>
                                            {config.obrigatorio && <Badge className="bg-red-500/10 text-red-600 border-red-200 text-[8px] h-4 px-1">OBRIGATÓRIO</Badge>}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded w-fit mt-1">slug: {slug}</span>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" size="icon" 
                                    className="text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-full"
                                    onClick={() => handleRemoveField(slug)}
                                >
                                    <X size={18} />
                                </Button>
                            </div>
                        ))}
                        {Object.keys(campos).length === 0 && (
                            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-muted/5">
                                <p className="text-sm text-muted-foreground">Nenhum campo personalizado adicionado.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Footer Fixo */}
            <DialogFooter className="p-4 md:p-6 border-t bg-muted/10 shrink-0 flex-row justify-end gap-3">
                <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 md:flex-none h-12 md:h-11 font-semibold">Cancelar</Button>
                <Button onClick={handleSave} className="flex-1 md:min-w-[180px] h-12 md:h-11 font-bold shadow-xl shadow-primary/10">
                     Salvar Configuração
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL DE EXCLUSÃO --- */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
            <div className="bg-red-500/10 p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 border-2 border-red-200">
                    <AlertTriangle className="text-red-600 w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-red-900">Excluir Assunto?</h2>
                <p className="text-sm text-red-700/80 mt-2">Esta ação não poderá ser desfeita. Deseja realmente remover este assunto da lista?</p>
            </div>
            <div className="p-6 bg-card flex gap-3">
                <Button variant="outline" onClick={() => setDeleteModalOpen(false)} className="flex-1 h-11 font-medium">Cancelar</Button>
                <Button variant="destructive" onClick={executeDelete} className="flex-1 h-11 font-bold bg-red-600 hover:bg-red-700">Sim, Remover</Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}