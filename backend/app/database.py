"""
Database configuration and session management
Arquivo: backend/app/database.py
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from app.config import settings

# ==============================================================================
# CONFIGURAÇÃO DO ENGINE (MOTOR DO BANCO)
# ==============================================================================
# O 'engine' é o ponto de entrada principal do SQLAlchemy. Ele gerencia
# as conexões com o banco de dados PostgreSQL.
engine = create_engine(
    settings.DATABASE_URL, # A URL de conexão (vem do arquivo .env ou config)
    echo=settings.DATABASE_ECHO, # Se True, imprime todo SQL gerado no terminal (ótimo para debug)
    
    # poolclass=NullPool:
    # IMPORTANTE: Isso desabilita o "pool de conexões" do lado da aplicação.
    # É essencial em ambientes como Heroku ou quando usamos PgBouncer, 
    # pois evita que a aplicação segure conexões abertas desnecessariamente,
    # prevenindo erros de "too many connections".
    poolclass=NullPool,  
)

# ==============================================================================
# FÁBRICA DE SESSÕES (SESSION FACTORY)
# ==============================================================================
# O SessionLocal não é uma sessão em si, mas uma "fábrica" que cria sessões.
# Cada requisição (request) do usuário vai ganhar uma nova sessão criada por ele.
SessionLocal = sessionmaker(
    autocommit=False, # Garante que nada seja salvo no banco sem um db.commit() explícito
    autoflush=False,  # Evita que o SQLAlchemy envie dados parciais para o banco antes da hora
    bind=engine,      # Liga essa fábrica ao motor configurado acima
)


# ==============================================================================
# DEPENDENCY INJECTION (DEPENDÊNCIA DE SESSÃO)
# ==============================================================================
def get_db() -> Session:
    """
    Função geradora para Dependency Injection do FastAPI.
    
    Como funciona:
    1. Cria uma nova sessão de banco para a requisição atual.
    2. 'yield db': Entrega a sessão para a rota usar.
    3. O código da rota executa.
    4. 'finally': Assim que a rota termina (sucesso ou erro), o bloco finally
       roda e FECHA a sessão obrigatoriamente.
       
    Isso evita o vazamento de conexões (connection leaks).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()