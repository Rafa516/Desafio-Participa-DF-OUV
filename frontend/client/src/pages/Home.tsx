import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Video, Image as ImageIcon, FileText, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <section className="text-center space-y-4 py-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Sua voz transforma <br />
          <span className="text-primary">o Distrito Federal</span>
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto text-lg">
          Registre reclamações, denúncias ou elogios de forma rápida, acessível e segura.
        </p>
      </section>

      {/* Quick Actions Grid */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        
        {/* Botão Texto */}
        <Link href="/nova-manifestacao?type=texto">
          <div className="bg-card border border-border shadow-sm rounded-2xl flex flex-col items-center justify-center gap-3 h-32 w-full cursor-pointer hover:scale-[1.02] hover:border-primary/50 transition-all hover:shadow-md group">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText size={24} />
            </div>
            <span className="text-sm font-bold text-foreground">Texto</span>
          </div>
        </Link>
        
        {/* Botão Áudio */}
        <Link href="/nova-manifestacao?type=audio">
          <div className="bg-card border border-border shadow-sm rounded-2xl flex flex-col items-center justify-center gap-3 h-32 w-full cursor-pointer hover:scale-[1.02] hover:border-purple-500/50 transition-all hover:shadow-md group">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Mic size={24} />
            </div>
            <span className="text-sm font-bold text-foreground">Áudio</span>
          </div>
        </Link>

        {/* Botão Vídeo */}
        <Link href="/nova-manifestacao?type=video">
          <div className="bg-card border border-border shadow-sm rounded-2xl flex flex-col items-center justify-center gap-3 h-32 w-full cursor-pointer hover:scale-[1.02] hover:border-red-500/50 transition-all hover:shadow-md group">
            <div className="p-3 rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Video size={24} />
            </div>
            <span className="text-sm font-bold text-foreground">Vídeo</span>
          </div>
        </Link>

        {/* Botão Imagem */}
        <Link href="/nova-manifestacao?type=imagem">
          <div className="bg-card border border-border shadow-sm rounded-2xl flex flex-col items-center justify-center gap-3 h-32 w-full cursor-pointer hover:scale-[1.02] hover:border-green-500/50 transition-all hover:shadow-md group">
            <div className="p-3 rounded-full bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <ImageIcon size={24} />
            </div>
            <span className="text-sm font-bold text-foreground">Imagem</span>
          </div>
        </Link>
      </section>

      {/* Destaques (Cards Informativos) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold text-foreground">Destaques</h3>
        </div>
        
        {/* Card Denúncia Anônima */}
        <Card className="bg-card border border-border shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <ShieldCheck className="text-primary" size={20} />
              Denúncia Anônima
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Você pode registrar manifestações sem se identificar. Garantimos total sigilo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/nova-manifestacao?anonimo=true">
              <Button variant="outline" className="w-full justify-between group border-border text-foreground hover:bg-muted hover:text-foreground">
                Iniciar Denúncia Anônima
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card Acompanhamento */}
        <Card className="bg-card border border-border shadow-sm rounded-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Clock className="text-blue-500 dark:text-blue-400" size={20} />
              Acompanhamento em Tempo Real
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Receba atualizações sobre o andamento da sua manifestação diretamente no app.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}