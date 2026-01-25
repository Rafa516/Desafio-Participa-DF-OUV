# Brainstorming de Design - Participa DF

## <response>
<text>
### <idea>
**Design Movement**: **Neumorfismo Acessível (Soft UI)**
**Core Principles**:
1. **Suavidade e Profundidade**: Uso de sombras sutis e luz para criar elementos que parecem extrudados da superfície, transmitindo uma sensação tátil e amigável.
2. **Clareza Cognitiva**: Redução de ruído visual, focando no conteúdo e nas ações principais, essencial para acessibilidade e usabilidade em momentos de estresse (reclamações).
3. **Inclusividade Visual**: Alto contraste adaptado, garantindo que o estilo "soft" não comprometa a legibilidade (WCAG 2.1 AA).
4. **Humanização**: Elementos arredondados e transições suaves para tornar a experiência de ouvidoria menos burocrática e mais acolhedora.

**Color Philosophy**:
- **Base**: Tons de off-white e cinza muito claro para o fundo, criando uma superfície limpa.
- **Acento**: Azul institucional (confiança) e Verde (esperança/resolução) em tons pastéis saturados para ações principais.
- **Alerta**: Laranja suave para avisos, evitando o vermelho agressivo.
- **Intenção**: Transmitir calma, transparência e modernidade institucional.

**Layout Paradigm**:
- **Cartões Flutuantes**: Conteúdo organizado em "ilhas" ou cartões com bordas arredondadas e sombras suaves.
- **Espaçamento Generoso**: Margens amplas para evitar aglomeração de informações.
- **Navegação Inferior (Mobile-First)**: Barra de navegação fixa na parte inferior para fácil acesso em dispositivos móveis (PWA).

**Signature Elements**:
- **Botões "Soft"**: Botões que parecem pressionáveis (efeito de profundidade).
- **Ícones Duotone**: Ícones com duas tonalidades da mesma cor para adicionar profundidade sem complexidade.
- **Micro-interações de Feedback**: Animações sutis de "pressão" ao clicar em elementos.

**Interaction Philosophy**:
- **Feedback Tátil Visual**: Elementos reagem ao toque simulando física real (afundam levemente).
- **Fluxo Guiado**: Formulários divididos em etapas claras (wizard) para não sobrecarregar o usuário.

**Animation**:
- **Transições Suaves**: Elementos deslizam e aparecem com fade-in suave (ease-out).
- **Skeleton Loading**: Carregamento progressivo que imita a estrutura dos cartões.

**Typography System**:
- **Primária (Títulos)**: **Nunito** ou **Quicksand** (arredondada, amigável, moderna).
- **Secundária (Corpo)**: **Lato** ou **Roboto** (legibilidade, neutra, funcional).
- **Hierarquia**: Uso claro de pesos (Bold para títulos, Regular para texto) e cores (Preto suave para texto, Cinza para legendas).
</idea>
</text>
<probability>0.08</probability>
</response>

## <response>
<text>
### <idea>
**Design Movement**: **Brutalismo Utilitário (GovTech Moderno)**
**Core Principles**:
1. **Funcionalidade Extrema**: Design cru e direto, priorizando a informação e a ação sobre a estética decorativa.
2. **Contraste Alto e Nítido**: Uso de bordas pretas finas, fundos sólidos e tipografia grande para máxima legibilidade.
3. **Estrutura Rígida**: Grids visíveis e separadores claros para organizar a informação de forma lógica e previsível.
4. **Transparência Radical**: Mostrar o status e o processo de forma clara, sem esconder detalhes técnicos.

**Color Philosophy**:
- **Base**: Branco absoluto e Preto puro.
- **Acento**: Amarelo "Marca-texto" (atenção), Azul Cobalto (ação) e Cinza Concreto (estrutura).
- **Intenção**: Transmitir eficiência, seriedade, urgência e clareza absoluta.

**Layout Paradigm**:
- **Grid Modular**: Layout baseado em blocos retangulares bem definidos por bordas.
- **Tipografia Gigante**: Títulos grandes que funcionam como elementos gráficos.
- **Densidade de Informação Controlada**: Uso de linhas divisórias para agrupar dados relacionados.

**Signature Elements**:
- **Bordas Visíveis**: Caixas de texto e botões com bordas pretas de 1px ou 2px.
- **Sombras "Hard"**: Sombras sólidas (sem blur) deslocadas para dar um aspecto de colagem ou impressão.
- **Tags e Labels**: Uso extensivo de etiquetas coloridas para categorizar status e tipos de manifestação.

**Interaction Philosophy**:
- **Feedback Imediato**: Respostas instantâneas e diretas ("clique seco").
- **Navegação Direta**: Menus e botões grandes e fáceis de acertar.

**Animation**:
- **Cortes Secos**: Transições rápidas sem fade (ou muito rápidas).
- **Hover de Deslocamento**: Botões se movem ligeiramente na diagonal ao passar o mouse (efeito 3D simples).

**Typography System**:
- **Primária (Títulos)**: **Archivo** ou **Chivo** (grotesca, técnica, impactante).
- **Secundária (Corpo)**: **Inter** ou **Public Sans** (neutra, otimizada para UI, governamental).
- **Hierarquia**: Contraste extremo de tamanho e peso. Uso de CAIXA ALTA para rótulos.
</idea>
</text>
<probability>0.05</probability>
</response>

## <response>
<text>
### <idea>
**Design Movement**: **Glassmorfismo Cívico (Transparência Institucional)**
**Core Principles**:
1. **Transparência e Camadas**: Uso de fundos translúcidos (efeito vidro fosco) para criar hierarquia e contexto sobreposto.
2. **Cores Vibrantes e Gradientes**: Uso de gradientes sutis no fundo para dar vida e energia, representando a diversidade da cidadania.
3. **Fluidez Orgânica**: Formas arredondadas e fluidas que quebram a rigidez burocrática.
4. **Imersão Visual**: Uso de imagens de fundo (da cidade, pessoas) desfocadas para dar contexto local (Brasília).

**Color Philosophy**:
- **Base**: Vidro fosco (branco com opacidade e blur) sobre fundos coloridos.
- **Acento**: Gradientes de Azul Céu a Verde Água (natureza e céu de Brasília) e Roxo a Rosa (inovação e diversidade).
- **Intenção**: Transmitir modernidade, tecnologia, transparência e conexão com a cidade.

**Layout Paradigm**:
- **Camadas de Profundidade**: O conteúdo flutua sobre o fundo, criando uma sensação de espaço.
- **Centralização Focada**: Formulários e conteúdos principais centralizados em "placas de vidro".
- **Background Vivo**: O fundo não é estático, mas parte da composição visual.

**Signature Elements**:
- **Cartões de Vidro**: Backgrounds com `backdrop-filter: blur()`, bordas brancas semitransparentes.
- **Gradientes Mesh**: Fundos com gradientes suaves e misturados (mesh gradients).
- **Ícones 3D ou Ilustrações Flat**: Elementos visuais que flutuam nas camadas de vidro.

**Interaction Philosophy**:
- **Profundidade Interativa**: Ao interagir, os elementos podem se tornar mais opacos ou mudar o nível de blur.
- **Foco Contextual**: O fundo escurece ou desfoca mais para dar foco ao modal ou formulário ativo.

**Animation**:
- **Parallax Suave**: Movimento sutil do fundo em relação aos elementos de frente.
- **Glow Effects**: Brilhos suaves ao redor de elementos ativos.

**Typography System**:
- **Primária (Títulos)**: **Montserrat** ou **Poppins** (geométrica, moderna, limpa).
- **Secundária (Corpo)**: **Open Sans** ou **Mulish** (amigável, legível).
- **Hierarquia**: Uso de peso e cor (branco ou cinza escuro dependendo do fundo) para contraste.
</idea>
</text>
<probability>0.07</probability>
</response>
