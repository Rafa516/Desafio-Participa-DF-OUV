# Backend - Participa-DF API

FastAPI backend para a aplicação PWA de Ouvidoria Acessível.

## Início Rápido

### Pré-requisitos

- Python 3.9+
- PostgreSQL
- Redis

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/Rafa516/Desafio-Participa-DF.git
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
│   ├── main.py              # Entry point
│   ├── config.py            # Configurações
│   ├── models/              # Modelos de BD
│   ├── schemas/             # Schemas Pydantic
│   ├── routes/              # Endpoints
│   ├── services/            # Lógica de negócio
│   ├── integrations/        # APIs externas
│   └── middleware/          # Middlewares
├── requirements.txt
├── .env.example
└── README.md
```

## Endpoints Principais

### Health Check
- `GET /api/health` - Verificar saúde da API

### Manifestações
- `POST /api/manifestacoes` - Criar manifestação
- `GET /api/manifestacoes/{protocolo}` - Consultar manifestação
- `GET /api/manifestacoes` - Listar manifestações

### Protocolos
- `GET /api/protocolos/{numero}` - Rastrear protocolo
- `POST /api/protocolos/gerar` - Gerar novo protocolo

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
