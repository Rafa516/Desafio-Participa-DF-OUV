from app.database import engine
from app.models.manifestacao import Manifestacao
from app.models.protocolo import Protocolo
from app.models.usuario import Usuario
from app.models.assunto import Assunto
from app.models.anexo import Anexo
from app.models import Base

# Criar tabelas
try:
    Base.metadata.create_all(bind=engine)
    print("Conexão com banco de dados OK!")
    print("Tabelas criadas com sucesso!")
except Exception as e:
    print(f"Erro: {e}")
