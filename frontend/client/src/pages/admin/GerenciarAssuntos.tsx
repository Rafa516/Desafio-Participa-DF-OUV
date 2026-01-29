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
import { Plus, Pencil, Trash2, X, ListPlus, AlertTriangle, Check, LayoutList } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// --- TIPOS ---
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
  // --- ESTADOS ---
  const [assuntos, setAssuntos] = useState<Assunto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<Assunto | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Form Principal
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  
  // Form Campos Dinâmicos
  const [campos, setCampos] = useState<Record<string, CampoConfig>>({});
  
  // Form Novo Campo
  const [novoLabel, setNovoLabel] = useState("");
  const [novoTipo, setNovoTipo] = useState<"text" | "date" | "time" | "select">("text");
  const [novoObrigatorio, setNovoObrigatorio] = useState(false);
  const [novasOpcoes, setNovasOpcoes] = useState(""); 

  // --- CARREGAMENTO ---
  const fetchAssuntos = async () => {
    try {
      setLoading(true);
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

  // --- HANDLERS MODAL ---
  const handleOpenModal = (item?: Assunto) => {
    // Limpa form de campos
    setNovoLabel("");
    setNovoTipo("text");
    setNovoObrigatorio(false);
    setNovasOpcoes("");

    if (item) {
      setEditingItem(item);
      setNome(item.nome);
      setDescricao(item.descricao || "");
      setAtivo(item.ativo);
      setCampos(item.campos_adicionais || {});
    } else {
      setEditingItem(null);
      setNome("");
      setDescricao("");
      setAtivo(true);
      setCampos({});
    }
    setModalOpen(true);
  };

  // --- LÓGICA DE CAMPOS ---
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
      toast.error("Campo já existe.");
      return;
    }

    const novoCampo: CampoConfig = {
      label: novoLabel,
      tipo: novoTipo,
      obrigatorio: novoObrigatorio
    };

    if (novoTipo === "select") {
      if (!novasOpcoes.trim()) {
        toast.warning("Informe as opções separadas por vírgula.");
        return;
      }
      novoCampo.opcoes = novasOpcoes.split(",").map(op => op.trim()).filter(op => op !== "");
    }

    setCampos(prev => ({ ...prev, [slug]: novoCampo }));
    
    // Reseta inputs
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

  // --- SALVAR ---
  const handleSave = async () => {
    try {
      if (!nome.trim()) {
        toast.warning("Nome é obrigatório.");
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
        toast.success("Assunto atualizado!");
      } else {
        await api.post("/assuntos/", payload);
        toast.success("Assunto criado!");
      }

      setModalOpen(false);
      fetchAssuntos();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Erro ao salvar.");
    }
  };

  // --- EXCLUIR ---
  const confirmDelete = (id: string) => {
      setItemToDelete(id);
      setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/assuntos/${itemToDelete}`);
      toast.success("Assunto removido.");
      fetchAssuntos();
    } catch (error: any) {
      toast.error("Não é possível excluir: Existem manifestações usando este assunto. Tente inativá-lo.");
    } finally {
        setDeleteModalOpen(false);
        setItemToDelete(null);
    }
  };

  return (
    <div className="p-6 w-full max-w-[1400px] mx-auto space-y-8 animate-in fade-in">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Assuntos</h1>
            <p className="text-muted-foreground mt-1">Crie e edite os formulários dinâmicos de cada assunto.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
            <Plus size={18} className="mr-2" /> Novo Assunto
        </Button>
      </div>

      {/* TABELA */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="w-[30%] pl-6">Nome</TableHead>
                        <TableHead className="w-[40%] hidden md:table-cell">Campos Personalizados</TableHead>
                        <TableHead className="w-[15%] text-center">Status</TableHead>
                        <TableHead className="w-[15%] text-right pr-6">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">Carregando...</TableCell>
                        </TableRow>
                    ) : assuntos.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">Nenhum assunto cadastrado.</TableCell>
                        </TableRow>
                    ) : (
                        assuntos.map((assunto) => (
                            <TableRow key={assunto.id} className="hover:bg-muted/10 transition-colors">
                                <TableCell className="py-4 pl-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-foreground text-sm">{assunto.nome}</span>
                                        <span className="text-xs text-muted-foreground line-clamp-1">{assunto.descricao}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell py-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {assunto.campos_adicionais && Object.values(assunto.campos_adicionais).length > 0 ? (
                                            Object.values(assunto.campos_adicionais).slice(0, 4).map((c, i) => (
                                                <Badge key={i} variant="secondary" className="text-[10px] font-medium border-border bg-muted text-muted-foreground">
                                                    {c.label}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground/60 italic">Padrão</span>
                                        )}
                                        {assunto.campos_adicionais && Object.values(assunto.campos_adicionais).length > 4 && (
                                            <Badge variant="outline" className="text-[10px] h-5">+ {Object.values(assunto.campos_adicionais).length - 4}</Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center py-4">
                                    {assunto.ativo ? (
                                        <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">ATIVO</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">INATIVO</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right pr-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleOpenModal(assunto)}>
                                            <Pencil size={16} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => confirmDelete(assunto.id)}>
                                            <Trash2 size={16} />
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

      {/* --- MODAL DE EDIÇÃO (FORÇADA A SER GRANDE) --- */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        {/* AQUI ESTÁ O TRUQUE: !max-w-4xl para forçar a largura e w-full */}
        <DialogContent className="sm:!max-w-[900px] w-full max-h-[90vh] overflow-y-auto gap-0 p-0 border-none shadow-2xl">
            
            <DialogHeader className="p-6 pb-4 border-b bg-card">
                <DialogTitle className="text-xl">{editingItem ? "Editar Assunto" : "Novo Assunto"}</DialogTitle>
                <DialogDescription>
                    Configure os dados básicos e os campos personalizados que o cidadão deverá preencher.
                </DialogDescription>
            </DialogHeader>
            
            <div className="p-6 space-y-8 bg-card">
                
                {/* 1. DADOS BÁSICOS */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold text-foreground">Dados Básicos</Label>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="ativo-switch" className="text-xs text-muted-foreground font-normal">Disponível no sistema?</Label>
                            <Switch id="ativo-switch" checked={ativo} onCheckedChange={setAtivo} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Nome do Assunto</Label>
                            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Iluminação Pública" className="font-medium h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Descrição (Ajuda para o cidadão)</Label>
                            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Relatar falta de luz ou postes quebrados." rows={2} className="resize-none" />
                        </div>
                    </div>
                </div>

                <Separator />

                {/* 2. CAMPOS PERSONALIZADOS */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold flex items-center gap-2">
                            <LayoutList size={16} className="text-primary" /> Campos Personalizados
                        </Label>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            {Object.keys(campos).length} adicionados
                        </span>
                    </div>

                    {/* BOX DE ADIÇÃO (Espaçoso) */}
                    <div className="bg-muted/30 p-5 rounded-xl border border-border/60">
                        {/* Grid ajustado para não espremer */}
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            
                            {/* Nome do Campo */}
                            <div className="flex-1 space-y-1.5 w-full">
                                <Label className="text-xs font-semibold text-foreground">Nome do Campo (Label)</Label>
                                <Input 
                                    value={novoLabel} 
                                    onChange={e => setNovoLabel(e.target.value)} 
                                    placeholder="Ex: Nome da Rua" 
                                    className="bg-background h-10"
                                />
                            </div>

                            {/* Tipo */}
                            <div className="w-full md:w-[200px] space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">Tipo de Dado</Label>
                                <Select value={novoTipo} onValueChange={(v: any) => setNovoTipo(v)}>
                                    <SelectTrigger className="bg-background h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Texto Curto</SelectItem>
                                        <SelectItem value="date">Data</SelectItem>
                                        <SelectItem value="time">Hora</SelectItem>
                                        <SelectItem value="select">Lista de Opções</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Obrigatório */}
                            <div className="flex items-center gap-3 bg-background border px-3 rounded-md h-10 shrink-0">
                                <Switch id="req-new" checked={novoObrigatorio} onCheckedChange={setNovoObrigatorio} />
                                <Label htmlFor="req-new" className="text-xs cursor-pointer font-medium whitespace-nowrap">Obrigatório</Label>
                            </div>

                            {/* Botão Adicionar */}
                            <Button onClick={handleAddField} className="bg-primary hover:bg-primary/90 h-10 px-6 shrink-0">
                                 Adicionar
                            </Button>
                        </div>

                        {/* Input Condicional para SELECT */}
                        {novoTipo === "select" && (
                            <div className="mt-4 pt-3 border-t border-dashed border-border/50 animate-in fade-in slide-in-from-top-1">
                                <Label className="text-xs text-primary font-medium mb-1.5 block">Opções da Lista (separadas por vírgula)</Label>
                                <Input 
                                    value={novasOpcoes} 
                                    onChange={e => setNovasOpcoes(e.target.value)} 
                                    placeholder="Ex: Zona Norte, Zona Sul, Zona Rural" 
                                    className="bg-background text-sm"
                                />
                            </div>
                        )}
                    </div>

                    {/* LISTA DE CAMPOS */}
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                        {Object.keys(campos).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-muted rounded-xl bg-muted/5">
                                <ListPlus size={32} className="text-muted-foreground/30 mb-2" />
                                <p className="text-sm font-medium text-muted-foreground">Nenhum campo extra configurado</p>
                                <p className="text-xs text-muted-foreground/70">O formulário terá apenas descrição e anexos.</p>
                            </div>
                        ) : (
                            Object.entries(campos).map(([slug, config]) => (
                                <div key={slug} className="flex items-center justify-between p-3 bg-card border rounded-lg shadow-sm group hover:border-primary/40 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                            {config.tipo === 'text' && 'Ab'}
                                            {config.tipo === 'date' && 'Dt'}
                                            {config.tipo === 'time' && 'Hr'}
                                            {config.tipo === 'select' && 'Li'}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-foreground">{config.label}</span>
                                                {config.obrigatorio && <Badge variant="destructive" className="text-[9px] h-4 px-1 rounded-sm">Obrigatório</Badge>}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{slug}</code>
                                                {config.tipo === "select" && config.opcoes && (
                                                    <span className="truncate max-w-[400px]" title={config.opcoes.join(", ")}>
                                                        • {config.opcoes.join(", ")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-100 transition-all"
                                        onClick={() => handleRemoveField(slug)}
                                    >
                                        <X size={18} />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <DialogFooter className="p-6 border-t bg-muted/5">
                <Button variant="outline" onClick={() => setModalOpen(false)} className="h-10 px-6">Cancelar</Button>
                <Button onClick={handleSave} className="min-w-[140px] h-10 px-6">
                     Salvar Assunto
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL DE EXCLUSÃO --- */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-xl">
            <div className="bg-red-50 p-8 flex flex-col items-center justify-center text-center border-b border-red-100">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 shadow-inner ring-4 ring-red-50">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-red-900">Excluir Assunto?</h2>
                <p className="text-sm text-red-700 mt-2 px-6 leading-relaxed">
                    Você está prestes a remover este assunto permanentemente. Essa ação é irreversível.
                </p>
            </div>
            
            <div className="p-6 space-y-3">
                <div className="bg-muted/40 p-4 rounded-lg text-xs text-muted-foreground border border-border/50 text-center">
                    Se existirem manifestações antigas vinculadas a este assunto, o sistema <strong>bloqueará a exclusão</strong> por segurança.
                </div>
            </div>

            <div className="p-4 bg-muted/10 border-t flex justify-center gap-3">
                <Button variant="outline" onClick={() => setDeleteModalOpen(false)} className="w-24">
                    Cancelar
                </Button>
                <Button variant="destructive" onClick={executeDelete} className="w-32 bg-red-600 hover:bg-red-700 shadow-sm">
                    Sim, Excluir
                </Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}