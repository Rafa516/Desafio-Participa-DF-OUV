import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Video, Image as ImageIcon, FileText, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight font-nunito">
          Sua voz transforma <br />
          <span className="text-primary">o Distrito Federal</span>
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto text-lg font-lato">
          Registre reclamações, denúncias ou elogios de forma rápida, acessível e segura.
        </p>
      </section>

      {/* Quick Actions Grid */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Link href="/nova-manifestacao?type=texto">
          <div className="neu-btn flex flex-col items-center justify-center gap-3 h-32 w-full cursor-pointer hover:scale-[1.02] transition-transform group">
            <div className="p-3 rounded-full bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <FileText size={24} />
            </div>
            <span className="text-sm font-bold text-foreground font-nunito">Texto</span>
          </div>
        </Link>
        
        <Link href="/nova-manifestacao?type=audio">
          <div className="neu-btn flex flex-col items-center justify-center gap-3 h-32 w-full cursor-pointer hover:scale-[1.02] transition-transform group">
            <div className="p-3 rounded-full bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Mic size={24} />
            </div>
            <span className="text-sm font-bold text-foreground font-nunito">Áudio</span>
          </div>
        </Link>

        <Link href="/nova-manifestacao?type=video">
          <div className="neu-btn flex flex-col items-center justify-center gap-3 h-32 w-full cursor-pointer hover:scale-[1.02] transition-transform group">
            <div className="p-3 rounded-full bg-red-50 text-destructive group-hover:bg-destructive group-hover:text-white transition-colors">
              <Video size={24} />
            </div>
            <span className="text-sm font-bold text-foreground font-nunito">Vídeo</span>
          </div>
        </Link>

        <Link href="/nova-manifestacao?type=imagem">
          <div className="neu-btn flex flex-col items-center justify-center gap-3 h-32 w-full cursor-pointer hover:scale-[1.02] transition-transform group">
            <div className="p-3 rounded-full bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <ImageIcon size={24} />
            </div>
            <span className="text-sm font-bold text-foreground font-nunito">Imagem</span>
          </div>
        </Link>
      </section>

      {/* Recent Activity / Info Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold text-foreground font-nunito">Destaques</h3>
        </div>
        
        <Card className="neu-flat border-none overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 font-nunito">
              <ShieldCheck className="text-primary" size={20} />
              Denúncia Anônima
            </CardTitle>
            <CardDescription className="font-lato">
              Você pode registrar manifestações sem se identificar. Garantimos total sigilo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/nova-manifestacao?anonimo=true">
              <Button variant="outline" className="w-full justify-between group border-primary/20 hover:bg-primary/5 hover:text-primary">
                Iniciar Denúncia Anônima
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="neu-flat border-none overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 font-nunito">
              <Clock className="text-secondary-foreground" size={20} />
              Acompanhamento em Tempo Real
            </CardTitle>
            <CardDescription className="font-lato">
              Receba atualizações sobre o andamento da sua manifestação diretamente no app.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
