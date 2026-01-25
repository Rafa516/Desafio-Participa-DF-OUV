"""
Configurações da Aplicação Participa-DF
Arquivo: backend/app/config.py
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """
    Configurações globais da aplicação.
    
    A biblioteca Pydantic lê automaticamente essas variáveis de três lugares,
    nesta ordem de prioridade:
    1. Variáveis de ambiente do sistema operacional (Environment Variables)
    2. Arquivo .env (se existir)
    3. Valores padrão definidos aqui no código
    """

    # ==========================================================================
    # GERAL DA APLICAÇÃO
    # ==========================================================================
    APP_NAME: str = "ParticipaDF-Ouvidoria"
    APP_VERSION: str = "1.0.0"
    
    # Se True, mostra erros detalhados no navegador (perigoso em produção!)
    DEBUG: bool = False 
    ENVIRONMENT: str = "development" # pode ser 'production', 'staging', 'development'

    # ==========================================================================
    # BANCO DE DADOS (PostgreSQL)
    # ==========================================================================
    # String de conexão: driver://usuario:senha@host:porta/nome_banco
    DATABASE_URL: str = "postgresql://participa_user:participa_password@localhost:5432/participadf_ouv_db"
    
    # Se True, imprime no terminal todo SQL que o sistema executa (bom para debug)
    DATABASE_ECHO: bool = False

    # ==========================================================================
    # REDIS (Cache e Filas) - Opcional por enquanto
    # ==========================================================================
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_EXPIRE: int = 3600 # Tempo de vida do cache em segundos (1 hora)

    # ==========================================================================
    # SEGURANÇA (JWT - Login)
    # ==========================================================================
    # Chave mestra para assinar tokens
    # Se alguém descobrir isso, pode gerar tokens falsos de admin.
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    
    # Algoritmo de criptografia padrão para JWT
    ALGORITHM: str = "HS256"
    
    # Tempo que o usuário fica logado antes de precisar autenticar de novo
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # ==========================================================================
    # CORS (Cross-Origin Resource Sharing)
    # ==========================================================================
    # Lista de URLs que têm permissão para chamar esta API.
    # O navegador bloqueia qualquer site que não esteja nesta lista.
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173", 
        "http://localhost:3000", # Alternativa comum
        "http://localhost:8080",
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"] # Permite GET, POST, PUT, DELETE, etc.
    CORS_ALLOW_HEADERS: List[str] = ["*"] # Permite enviar tokens e JSONs

    # ==========================================================================
    # INTEGRAÇÕES EXTERNAS (Placeholder)
    # ==========================================================================
    IZA_API_URL: str = "https://api.iza.df.gov.br"
    IZA_API_KEY: str = "your-iza-api-key-here"
    IZA_API_SECRET: str = "your-iza-api-secret-here"

    # ==========================================================================
    # UPLOAD DE ARQUIVOS
    # ==========================================================================
    # Limite máximo do tamanho do arquivo (50MB = 50 * 1024 * 1024 bytes)
    MAX_UPLOAD_SIZE: int = 52428800 
    
    # Pasta onde os arquivos serão salvos fisicamente
    UPLOAD_DIR: str = "./uploads"
    
    # Extensões permitidas por segurança (evita upload de .exe, .py, .sh)
    ALLOWED_EXTENSIONS: List[str] = ["mp3", "wav", "webm", "mp4", "jpg", "jpeg", "png", "webp"]

    # ==========================================================================
    # LOGGING
    # ==========================================================================
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"

    # ==========================================================================
    # SERVIDOR DE DESENVOLVIMENTO (Uvicorn)
    # ==========================================================================
    # Se True, reinicia o servidor automaticamente quando você salva um arquivo
    RELOAD: bool = True
    WORKERS: int = 1

    class Config:
        """
        Configura o Pydantic para ler o arquivo .env
        """
        env_file = ".env"
        case_sensitive = True


# Instância global de configurações pronta para uso
settings = Settings()