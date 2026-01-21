from app.database import engine
from app.models.manifestacao import Base

# Testar conexão
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Conexão com banco de dados OK!")
    print("✅ Tabelas criadas com sucesso!")
except Exception as e:
    print(f"❌ Erro: {e}")
