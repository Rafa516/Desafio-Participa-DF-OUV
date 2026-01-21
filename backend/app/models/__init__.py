"""
Modelos de Banco de Dados
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Base para todos os modelos
Base = declarative_base()

# Será configurado em config.py
