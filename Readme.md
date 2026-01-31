# Especificação Técnica: PWA de Ouvidoria Acessível

#### **Projeto**: `Participa-DF-Ouvidoria`
#### **Autores**: 
- Rafael da Silva Oliveira -
<a href="https://www.linkedin.com/in/rafael-da-silva-oliveira-623634184/" target="blank">Linkedin<img src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/linked-in-alt.svg" alt="https://www.linkedin.com/in/rafael-da-silva-oliveira-623634184/" height="15" width="50" /></a>

- Wallison Chagas Lucas - <a href="https://www.linkedin.com/in/wallison-lucas-410483239/" target="blank">Linkedin<img src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/linked-in-alt.svg" alt="https://www.linkedin.com/in/rafael-da-silva-oliveira-623634184/" height="15" width="50" /></a>

- Breno Braga Galvão - <a href="https://www.linkedin.com/in/breno-braga-galv%C3%A3o/" target="blank">Linkedin<img src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/linked-in-alt.svg" alt="https://www.linkedin.com/in/rafael-da-silva-oliveira-623634184/" height="15" width="50" /></a>
---

>**Link do Projeto:** https://participadf-ouvidoria-app.onrender.com/login

>:**Documentação da API (Swagger):** https://participadf-backend.onrender.com/docs#/

## 1. Introdução e Objetivos

Este documento detalha a especificação técnica para o desenvolvimento de uma solução digital inovadora e acessível para o **Participa DF**, em conformidade com o desafio da categoria **Ouvidoria** do 1º Hackathon em Controle Social. O objetivo é criar um Progressive Web App (PWA) que permita o registro de manifestações por texto, áudio, imagem e vídeo, com foco em acessibilidade, usabilidade e integração com a inteligência artificial IZA da Ouvidoria-Geral do DF.

### 1.1. Requisitos Chave

- **PWA**: A aplicação deve ser instalável, funcionar offline e ser responsiva.
- **Multicanalidade**: Suportar entradas de texto, áudio, vídeo e imagem.
- **Acessibilidade**: Conformidade total com as diretrizes WCAG 2.1 nível AA.
- **Anonimato**: Permitir o registro de manifestações de forma anônima.
- **Protocolo Automático**: Geração e emissão de um número de protocolo para cada manifestação.
- **Integração com IZA**: A solução deve se comunicar com a API da IZA para análise das manifestações.

---


## Estrutura do Projeto

```
Desafio-Participa-DF-OUV/
├── backend/                          # API FastAPI
│   ├── app/
│   │   ├── models/                   # Modelos de banco de dados
│   │   ├── routes/                   # Endpoints da API
│   │   ├── services/                 # Lógica de negócio
│   │   ├── integrations/             # Integrações externas
│   │   └── middleware/               # Middlewares
│   ├── README.md                     # Documentação do backend
│   ├── requirements.txt              # Dependências Python
│   └── seed_assuntos.py              # Script para popular banco com assuntos
├── frontend/                         # Aplicação React PWA
│   ├── client/                       # Código-fonte React
│   └── ideas.md                      # Brainstorming de design
├── docs/                             # Documentação
│   ├── Análise da Estrutura do Participa DF OUV.md
│   ├── DESIGN.md                     # Design System
│   ├── banco de dados/               # Documentação de BD
│   ├── diagramas/                    # Diagramas técnicos
│   ├── manuais/                      # Manuais de uso
│   └── normativas/                   # Referências legais
├── docker-compose.yml                # Orquestração de serviços
├── Dockerfile                        # Imagem Docker do backend
└── env.example                       # Variáveis de ambiente de exemplo
```
---
## 2. Arquitetura da Solução

A arquitetura proposta desacopla o frontend do backend, garantindo escalabilidade, manutenibilidade e uma melhor experiência de desenvolvimento. A stack tecnológica foi escolhida para atender aos requisitos de performance, PWA e integração.

- **Frontend**: React (com Vite, TypeScript, TailwindCSS)
- **Backend**: FastAPI (Python)
- **Cache**: Redis
- **Banco de Dados**: PostgreSQL

### 2.1. Diagrama de Arquitetura Geral

O diagrama abaixo ilustra a interação entre os principais componentes do sistema, desde o usuário até os serviços de backend e a infraestrutura de deploy.


```mermaid
   flowchart LR
    %% Definição de Estilos
    classDef frontend fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1
    classDef backend fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#e65100
    classDef data fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#4a148c
    classDef external fill:#eeeeee,stroke:#9e9e9e,stroke-width:2px,stroke-dasharray: 5 5

    subgraph Client ["Frontend PWA (React)"]
        direction TB
        UI["Interface do Usuário"]:::frontend
        Chat["Chatbot Assistente IZA"]:::frontend
        Store["Estado Local<br/>(Zustand)"]:::frontend
        SW["Service Worker<br/>Offline"]:::frontend
    end

    subgraph Server ["Backend (FastAPI)"]
        direction TB
        API["API Gateway / Router"]:::backend
        Auth["Autenticação JWT"]:::backend
        Logic["Regras de Negócio<br/>(Movimentações & Manifestações)"]:::backend
        IA["Integração IA<br/>(Futuro)"]:::external
    end

    subgraph Data ["Persistência & Storage"]
        direction TB
        DB[("PostgreSQL")]:::data
        Redis[("Redis Cache")]:::data
        Storage["File Storage<br/>Uploads"]:::data
    end

    %% Conexões
    UI <-->|Leitura/Escrita| Store
    UI -->|Interage| Chat
    Chat -->|Ações| UI
    UI -->|Request| SW

    SW -->|Cache Hit| UI
    SW ===>|Network / Fetch| API

    API --> Auth
    Auth --> Logic
    Logic -.->|Sugestões| IA

    Auth -.->|Sessão| Redis
    Logic -->|CRUD| DB
    Logic -->|Arquivos| Storage

    %% Link de Estilos
    linkStyle 4,5 stroke:#1565c0,stroke-width:2px
```
---

## 3. Especificação do Frontend (React)

O frontend será uma Single Page Application (SPA) construída com React, transformada em um PWA completo. O foco será em performance, acessibilidade e uma experiência de usuário fluida.

### 3.1. Estrutura de Componentes

A aplicação será modularizada em componentes reutilizáveis, seguindo as melhores práticas do React.

```mermaid
flowchart TD
    %% Definição de Estilos
    classDef core fill:#263238,stroke:#fff,stroke-width:2px,color:#fff
    classDef layout fill:#e1bee7,stroke:#4a148c,stroke-width:2px,color:#4a148c
    classDef page fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1
    classDef component fill:#fff3e0,stroke:#e65100,stroke-width:1px,color:#bf360c
    classDef input fill:#fff,stroke:#333,stroke-dasharray: 5 5

    %% Nível 1: Core da Aplicação
    subgraph Root ["Core Application"]
        App["App.tsx"]:::core
        Theme["ThemeProvider"]:::core
        App --> Theme
    end

    %% Nível 2: Layout Shell
    subgraph Shell ["Global Layout Layer"]
        Layout["Layout Wrapper"]:::layout
        Header["Header / TopBar"]:::layout
        BottomNav["Bottom Navigation<br/>(Mobile)"]:::layout
        Chatbot["Chatbot Fab<br/>Assistente IZA"]:::layout
        A11y["Acessibilidade Menu"]:::layout
        
        %% Conexões do Layout
        Layout --> Header
        Layout --> BottomNav
        Layout --> Chatbot
        Layout --> A11y
    end

    %% Nível 3: Router View
    subgraph Router ["Main Content (Router View)"]
        direction TB
        MainContent["Outlet / Switch"]:::core
        
        %% Páginas
        Home["Home Page"]:::page
        NovaMan["Nova Manifestação"]:::page
        MinhasMan["Minhas Manifestações"]:::page
        Login["Login"]:::page
    end

    %% Nível 4: Componentes Específicos
    subgraph Wizard ["Wizard Components"]
        Step1["Step 1: Tipo"]:::component
        Step2["Step 2: Conteúdo"]:::component
        Step3["Step 3: Identificação"]:::component
        
        %% Inputs do Step 2
        Audio["AudioRecorder"]:::input
        Upload["MediaUploader"]:::input
        Text["⌨TextInput"]:::input
    end

    subgraph Details ["Detail Components"]
        List["Lista Cards"]:::component
        Detail["Detalhe View"]:::component
        Timeline["Timeline Histórico"]:::input
        ChatInput["Chat Input"]:::input
    end

    %% Conexões Hierárquicas Principais
    App --> Layout
    Layout --> MainContent
    
    %% Rotas
    MainContent --> Home
    MainContent --> Login
    MainContent --> NovaMan
    MainContent --> MinhasMan

    %% Detalhes da Home
    Home --> Grid["Grid Ações Rápidas"]:::component
    Home --> Info["Info Cards"]:::component

    %% Detalhes Nova Manifestação
    NovaMan --> Step1
    NovaMan --> Step2
    NovaMan --> Step3
    
    Step2 --- Audio
    Step2 --- Upload
    Step2 --- Text

    %% Detalhes Minhas Manifestações
    MinhasMan --> List
    MinhasMan --> Detail
    Detail --> Timeline
    Detail --> ChatInput
	
	
	style MainContent color:#000000,fill:#D9D9D9,stroke:#545454
	style Theme stroke:#545454,fill:#D9D9D9,color:#000000
	style App stroke:#545454,fill:#D9D9D9,color:#000000
```


### 3.2. Estratégia de PWA e Offline-First

- **Service Worker**: Utilizaremos o Workbox para gerenciar o ciclo de vida do Service Worker. Ele será responsável por:
    - **Cache de Assets**: Cachear todos os arquivos estáticos (JS, CSS, fontes) na instalação (`Cache-First`).
    - **Navegação Offline**: Servir uma página de fallback customizada quando o usuário estiver offline e tentar acessar uma rota não cacheada.
    - **Sincronização em Background**: Usar a API `BackgroundSync` para enfileirar manifestações enviadas offline e submetê-las automaticamente quando a conexão for restabelecida.
- **Web App Manifest**: Um arquivo `manifest.json` será configurado para permitir que a aplicação seja instalada na tela inicial do dispositivo, com ícone, nome e tela de splash customizados.
- **IndexedDB**: Para armazenamento de dados no lado do cliente. Será usado para salvar rascunhos de manifestações e os dados de manifestações enviadas em modo offline antes da sincronização.

### 3.3. Estratégia de Acessibilidade (WCAG 2.1 AA)

- **HTML Semântico**: Uso correto de tags como `<main>`, `<nav>`, `<header>`, `<button>` para dar contexto a leitores de tela.
- **ARIA Attributes**: Implementação de roles e atributos ARIA (`aria-label`, `aria-hidden`) para componentes dinâmicos.
- **Contraste de Cores**: O design seguirá a recomendação de contraste mínimo de 4.5:1.
- **Navegação por Teclado**: Todos os elementos interativos serão acessíveis e operáveis via teclado.
- **Testes**: Serão realizados testes contínuos com ferramentas como Lighthouse, axe e testes manuais com leitores de tela (NVDA, VoiceOver).

### 3.4. Chatbot Assistente

- Um componente de chatbot será desenvolvido para guiar o usuário no preenchimento do formulário.
- **Fluxo**: O chatbot fará perguntas sequenciais (`Qual o assunto?`, `Descreva o ocorrido.`) e preencherá os campos do formulário em tempo real.
- **Interação**: O usuário poderá interagir tanto com o chatbot quanto diretamente com o formulário.
- **Inteligência**: O chatbot poderá usar uma LLM (via API do backend) para entender a intenção do usuário e oferecer sugestões.

---

## 4. Especificação do Backend (FastAPI)

O backend será uma API RESTful construída com FastAPI, responsável pela lógica de negócio, persistência de dados e integrações.

### 4.1. Endpoints da API

A API será organizada em rotas lógicas para gerenciar manifestações, protocolos e autenticação (se aplicável).

```mermaid
flowchart LR
    %% --- Definição de Estilos (Padrão Swagger/OpenAPI) ---
    classDef get fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1
    classDef post fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#1b5e20
    classDef put fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#e65100
    classDef delete fill:#ffebee,stroke:#c62828,stroke-width:2px,color:#b71c1c
    classDef client fill:#333,stroke:#000,stroke-width:2px,color:#fff
    
    %% Nó do Cliente
    Client("App / Client"):::client

    %% Grupo 1: Autenticação
    subgraph Auth ["Autenticação"]
        direction TB
        POST_LOGIN["POST /auth/login"]:::post
        POST_REGISTER["POST /auth/registrar"]:::post
        POST_MARCAR["POST /auth/marcar-lido"]:::post
        PUT_PERFIL["PUT /auth/atualizar-perfil"]:::put
        POST_ESQUECI["POST /auth/esqueci-senha"]:::post
        POST_REDEF["POST /auth/redefinir-senha"]:::post
    end

    %% Grupo 2: Assuntos (CRUD)
    subgraph Ass ["Assuntos"]
        direction TB
        GET_ASS["GET /assuntos/"]:::get
        POST_ASS["POST /assuntos/"]:::post
        GET_ASS_ID["GET /assuntos/{assunto_id}"]:::get
        PUT_ASS["PUT /assuntos/{assunto_id}"]:::put
        DEL_ASS["DELETE /assuntos/{assunto_id}"]:::delete
    end

    %% Grupo 3: Manifestações
    subgraph Man ["Manifestações"]
        direction TB
        POST_MAN["POST /manifestacoes/"]:::post
        GET_MAN["GET /manifestacoes/"]:::get
        GET_MAN_PROT["GET /manifestacoes/{protocolo}"]:::get
        GET_MAN_ADMIN["GET /manifestacoes/admin/todas"]:::get
    end

    %% Grupo 4: Movimentações
    subgraph Mov ["Movimentações"]
        direction TB
        GET_NOT["GET /movimentacoes/notificacoes/novas"]:::get
        GET_HIST["GET /movimentacoes/{manifestacao_id}"]:::get
        POST_MOV["POST /movimentacoes/{manifestacao_id}"]:::post
    end

    %% Grupo 5: Protocolos
    subgraph Prot ["Protocolos"]
        direction TB
        GET_PROT["GET /protocolos/{numero}"]:::get
        POST_PROT["POST /protocolos/simular-geracao"]:::post
    end

    %% Grupo 6: Transcrição
    subgraph Trans ["Transcrição"]
        direction TB
        POST_TRANS["POST /transcricao/"]:::post
    end

    %% --- Conexões ---
    %% Usamos links invisíveis ou diretos para organizar
    Client ===> Auth
    Client ===> Ass
    Client ===> Man
    Client ===> Mov
    Client ===> Prot
    Client ===> Trans

    %% Dica: LinkStyle deixa as setas mais suaves
    linkStyle default stroke:#b0bec5,stroke-width:2px
	style Client color:#000000,stroke:#737373,fill:#D9D9D9
```
### 4.2. Processamento de Mídia

- **Upload**: Arquivos de áudio, vídeo e imagem serão recebidos como `UploadFile` no FastAPI.
- **Armazenamento**: Os arquivos serão salvos em um serviço de armazenamento de objetos (como S3 ou similar) e o caminho será referenciado no banco de dados. Para o hackathon, podem ser salvos no sistema de arquivos do servidor de deploy.
- **Validação**: Serão aplicadas validações de tamanho e tipo de arquivo.

### 4.3. Integração com Redis

- **Cache de Sessão**: Se houver login, as sessões de usuário serão armazenadas no Redis para validação rápida.
- **Cache de Dados**: Respostas de API que não mudam com frequência (ex: tipos de manifestação) serão cacheadas para reduzir a carga no banco de dados.

---

## 5. Modelo de Dados e Banco de Dados

O banco de dados relacional (PostgreSQL) armazenará todas as informações de forma estruturada.

### 5.1. Diagrama Entidade-Relacionamento (ER)

O diagrama abaixo descreve as tabelas principais e seus relacionamentos.

```mermaid
erDiagram
    %% Relacionamentos
    USUARIOS ||--o{ MANIFESTACOES : "abre/cria"
    USUARIOS ||--o{ MOVIMENTACOES : "registra (autor)"
    ASSUNTOS ||--o{ MANIFESTACOES : "categoriza"
    MANIFESTACOES ||--|{ MOVIMENTACOES : "possui histórico"
    MANIFESTACOES ||--o{ ANEXOS : "contém evidências"
    MANIFESTACOES ||--|| PROTOCOLOS : "gera"

    %% Definição das Tabelas
    USUARIOS {
        varchar(36) id PK
        varchar(255) nome
        varchar(255) email
        varchar(11) cpf
        boolean admin
        boolean ativo
        varchar(255) senha_hash
        timestamp data_criacao
    }

    MANIFESTACOES {
        varchar(36) id PK
        varchar(50) protocolo
        text relato
        boolean anonimo
        json dados_complementares
        varchar status
        varchar(36) usuario_id FK "Pode ser nulo (anônimo)"
        varchar(36) assunto_id FK
    }

    MOVIMENTACOES {
        varchar(36) id PK
        text texto
        boolean interno "Se true, visível só para admin"
        varchar(36) manifestacao_id FK
        varchar(36) autor_id FK
        timestamp data_criacao
    }

    ASSUNTOS {
        varchar(36) id PK
        varchar(255) nome
        text descricao
        json campos_adicionais
        boolean ativo
    }

    ANEXOS {
        varchar(36) id PK
        varchar(500) arquivo_url
        varchar(50) tipo_arquivo
        integer tamanho
        varchar(36) manifestacao_id FK
    }

    PROTOCOLOS {
        varchar(50) numero PK
        integer sequencia_diaria
        timestamp data_geracao
        timestamp data_expiracao
        varchar(36) manifestacao_id FK
    }
```

---

## 6. Fluxo de Dados

O diagrama de sequência a seguir detalha o fluxo de uma manifestação, desde a criação pelo cidadão até o processamento no backend, incluindo o modo offline.

```mermaid
sequenceDiagram
    autonumber
    %% Definição dos Participantes
    actor Cid as Cidadão
    participant PWA as Frontend<br/>(PWA/React)
    participant Chat as  Chatbot IZA
    participant API as Backend<br/>(FastAPI)
    participant DB as  Dados & Storage<br/>(Postgres/S3)
    actor Ouv as  Ouvidor

    %% --- CENÁRIO 1: ABERTURA DE MANIFESTAÇÃO ---
    rect rgb(230, 245, 255)
        note right of Cid: <b>Fluxo 1:</b> Abertura da Manifestação
        
        Cid->>PWA: Acessa Aplicação
        
        alt Via Chatbot
            Cid->>Chat: Interage com IZA
            Chat-->>Cid: Auxilia e direciona
            Chat->>PWA: Solicita abertura de Form
        else Via Direta
            Cid->>PWA: Clica "Nova Manifestação"
        end

        PWA->>Cid: Exibe Formulário
        Cid->>PWA: Preenche e anexa mídia
        
        PWA->>API: POST /manifestacoes (JSON + Files)
        activate API
        
        API->>API: Valida Auth / Token
        
        par Persistência
            API->>DB: INSERT dados (PostgreSQL)
            API->>DB: Upload arquivos (Storage)
        end
        
        DB-->>API: Confirma ID/Protocolo
        API-->>PWA: Retorna 201 Created (Protocolo)
        deactivate API
        
        PWA-->>Cid: Exibe Sucesso e Protocolo
    end

    %% Separador visual
    note over Cid, Ouv: ... Tempo de espera ...

    %% --- CENÁRIO 2: TRATAMENTO PELO OUVIDOR ---
    rect rgb(255, 245, 230)
        note right of Cid: <b>Fluxo 2:</b> Tratamento Interno
        
        Ouv->>PWA: Acessa Painel Administrativo
        PWA->>API: GET /manifestacoes (Filtros)
        activate API
        API->>DB: SELECT * FROM manifestacoes
        DB-->>API: Retorna Lista
        API-->>PWA: JSON (Lista)
        deactivate API

        Ouv->>PWA: Analisa e registra Resposta
        PWA->>API: POST /movimentacoes
        activate API
        
        API->>DB: INSERT movimentacao
        API->>API: Dispara Notificação (Email Service)
        
        API-->>PWA: Retorna 200 OK
        deactivate API
        
        PWA-->>Ouv: Confirmação visual
    end
```

---

## 7. Estratégia de Deploy

- **Frontend (React)**: Deploy contínuo no Render plataforma de hospedagem estática a partir do repositório Git.
- **Backend (FastAPI)**: Containerização com Docker e deploy em uma plataforma como serviço (Render ou Google Cloud Run).
- **CI/CD**: Configuração de um pipeline simples com GitHub Actions para automatizar os builds e deploys do frontend e backend a cada `push` na branch principal.

---

# Guia de Configuração e Instalação - Participa DF OUV

Este guia detalha o processo de configuração do ambiente de desenvolvimento para o projeto Participa DF OUV, incluindo backend, banco de dados e frontend.

## Pré-requisitos

- **Docker** e **Docker Compose** (para banco de dados e cache)
- **Python 3.9+** (para o backend)
- **Node.js 18+** e **pnpm** (para o frontend)
- **Git**

---

## 1. Configuração do Banco de Dados (Docker)

O projeto utiliza PostgreSQL como banco de dados relacional e Redis para cache/sessões. A maneira mais fácil de iniciá-los é via Docker Compose.

1. Navegue até a raiz do projeto:
   ```bash
   cd Desafio-Participa-DF-Ouvidoria
   ```
2. Instale as imagens, volumes e os containers (Com o ambiente docker aberto):
   ```bash
   docker-compose up --build
   ```

Isso iniciará:
- **PostgreSQL** na porta `5432`
- **Redis** na porta `6379`

### Estrutura do Banco de Dados

O sistema criará automaticamente as tabelas ao iniciar o backend. As principais tabelas são:
- `usuarios`: Dados dos cidadãos
- `assuntos`: Categorias de manifestação
- `manifestacoes`: Registros principais
- `movimentacoes`: **Histórico de interações e chat** (Tabela crítica para o funcionamento do chat)
- `anexos`: Arquivos de mídia
- `protocolos`: Controle de numeração

>Use as credenciais contidas no arquivo docker-compose.yml para iniciar uma conexão no SGDB

---

## 2. Configuração do Backend (FastAPI)

1. Acesse a pasta do backend:
   ```bash
   cd backend
   ```

2. Crie e ative um ambiente virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # ou
   venv\Scripts\activate     # Windows
   ```

3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure as variáveis de ambiente:
   - Copie o arquivo de exemplo: `cp .env.example .env`
   - Edite o `.env` com as credenciais do banco (padrão do docker-compose):
     ```ini
     DATABASE_URL=postgresql://participa_user:participa_password@localhost:5432/participadf_ouv_db
     REDIS_URL=redis://localhost:6379
     ```

5. Execute as migrações e popule o banco (se necessário):
   ```bash
   # O sistema usa SQLAlchemy para criar tabelas automaticamente no startup
   # Para popular assuntos iniciais:
   python seed_assuntos.py
   ```

6. Inicie o servidor:
   ```bash
   uvicorn app.main:app --reload
   ```

O backend estará rodando em `http://localhost:8000`.
Documentação da API (Swagger): `http://localhost:8000/docs`

---

## 3. Configuração do Frontend (React PWA)

1. Acesse a pasta do frontend (se houver, ou siga as instruções do repositório frontend separado):
   ```bash
   cd frontend
   ```

2. Instale as dependências:
   ```bash
   pnpm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   pnpm dev
   ```

O frontend estará acessível em `http://localhost:3000` (ou porta indicada).

---

## 4. Verificação da Instalação

Para garantir que tudo está funcionando, especialmente o módulo de **Assuntos**:

1. Acesse o Swagger UI: `http://localhost:8000/docs`
2. Procure pela seção **Assuntos**.
3. Teste o endpoint `GET /api/assuntos/` (você precisará popular através do arquivo seed_assuntos.py ).
4. Se retornar `200 OK` (mesmo que lista vazia), a tabela e a API de assuntos estão configuradas corretamente.

