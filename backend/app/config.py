"""
Configurações da Aplicação Participa-DF
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """
    Configurações globais da aplicação
    """

    # Aplicação
    APP_NAME: str = "Participa-DF"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Banco de Dados
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/participa_df"
    DATABASE_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_EXPIRE: int = 3600

    # Segurança
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]

    # Integração com IZA
    IZA_API_URL: str = "https://api.iza.df.gov.br"
    IZA_API_KEY: str = "your-iza-api-key-here"
    IZA_API_SECRET: str = "your-iza-api-secret-here"

    # Upload de Arquivos
    MAX_UPLOAD_SIZE: int = 52428800  # 50MB em bytes
    UPLOAD_DIR: str = "./uploads"
    ALLOWED_EXTENSIONS: List[str] = ["mp3", "wav", "webm", "mp4", "jpg", "jpeg", "png", "webp"]

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"

    # Modo de Desenvolvimento
    RELOAD: bool = True
    WORKERS: int = 1

    class Config:
        env_file = ".env"
        case_sensitive = True


# Instância global de configurações
settings = Settings()
