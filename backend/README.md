# Backend - Participa-DF-Ouvidoria API

FastAPI backend para a aplicação PWA de Ouvidoria Acessível.

## Início Rápido

### Pré-requisitos

- Python 3.9+
- PostgreSQL
- Redis

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/Rafa516/Desafio-Participa-DF-Ouvidoria.git
cd Desafio-Participa-DF/backend
```

2. **Crie um ambiente virtual**
```bash
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
```

3. **Instale as dependências**
```bash
pip install -r ../requirements.txt
```

4. **Configure as variáveis de ambiente**
```bash
cp ../.env.example .env
# Edite o arquivo .env com suas configurações
```

5. **Inicie o servidor**
```bash
python -m uvicorn app.main:app --reload
```

A API estará disponível em `http://localhost:8000`

## Documentação

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Estrutura do Projeto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                   # Entry point
│   ├── config.py                 # Configurações
│   ├── models/                   # Modelos de BD
│   │   ├── usuario.py
│   │   ├── manifestacao.py
│   │   ├── movimentacao.py       # Chat/Histórico
│   │   ├── assunto.py
│   │   ├── anexo.py
│   │   └── protocolo.py
│   ├── schemas/                  # Schemas Pydantic
│   ├── routes/                   # Endpoints
│   │   ├── manifestacoes.py
│   │   └── movimentacoes.py      # Endpoints de chat
│   ├── services/                 # Lógica de negócio
│   │   ├── manifestacao_service.py
│   │   ├── movimentacao_service.py   # Lógica de chat
│   │   └── assunto_service.py
│   ├── integrations/             # APIs externas
│   └── middleware/               # Middlewares
├── requirements.txt
├── .env.example
├── seed_assuntos.py              # popular BD com assuntos específicos
└── README.md
```

## Endpoints Principais

### Health
- `GET /health` - Health Check

### Autenticação
- `POST /api/auth/registrar` - Registrar Usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/marcar-lido` - Marcar Notificações Lidas
- `PUT /api/auth/atualizar-perfil` - Atualizar Meu Perfil
- `POST /api/auth/esqueci-senha` - Solicitar Recuperação Senha
- `POST /api/auth/redefinir-senha` - Redefinir Senha

### Assuntos
- `GET /api/assuntos/` - Listar Assuntos
- `POST /api/assuntos/` - Criar Assunto
- `GET /api/assuntos/{assunto_id}` - Obter Assunto
- `PUT /api/assuntos/{assunto_id}` - Atualizar Assunto
- `DELETE /api/assuntos/{assunto_id}` - Deletar Assunto

### Manifestações
- `POST /api/manifestacoes/` - Criar Manifestação
- `GET /api/manifestacoes/` - Listar Manifestações
- `GET /api/manifestacoes/{protocolo}` - Consultar Manifestação
- `GET /api/manifestacoes/admin/todas` - Listar Todas Admin

### Protocolos
- `GET /api/protocolos/{numero}` - Rastrear Protocolo
- `POST /api/protocolos/simular-geracao` - Simular Geração Protocolo

### Movimentações
- `GET /api/movimentacoes/notificacoes/novas` - Obter Notificações
- `GET /api/movimentacoes/{manifestacao_id}` - Listar Histórico
- `POST /api/movimentacoes/{manifestacao_id}` - Responder Manifestação

## Modelos de Dados

### Usuario
Armazena informações do cidadão para manifestações não-anônimas.

### Manifestacao
Representa a manifestação/reclamação principal com suporte a múltiplos formatos (texto, áudio, vídeo, imagem).

### Movimentacao
Histórico de ações e mensagens associadas a uma manifestação. Funciona como um sistema de chat ou ticket tracking.

### Assunto
Categorias de manifestação com campos dinâmicos em JSON para flexibilidade.

### Anexo
Arquivos de mídia (áudio, vídeo, imagem) associados à manifestação.

### Protocolo
Número de protocolo único para rastreamento (formato: OUVIDORIA-YYYYMMDD-XXXXXX).

## Testes

```bash
pytest
pytest --cov=app
```

## Docker

```bash
# Build
docker build -t participa-df-backend .

# Run
docker run -p 8000:8000 participa-df-backend
```

## Variáveis de Ambiente

Veja `.env.example` para todas as configurações disponíveis.

## Licença

MIT License
