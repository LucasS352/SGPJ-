# arquivo: backend/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import NullPool  # Importa o NullPool para desativar o pool de conexões

# Sua string de conexão (verifique se continua correta)
DATABASE_URL = "mysql+pymysql://root:@localhost:3307/leads"

# --- CONFIGURAÇÃO ROBUSTA DO ENGINE ---
engine = create_engine(
    DATABASE_URL, 

    # 1. Desativa o pool de conexões, que é a causa mais provável do travamento.
    poolclass=NullPool,

    # 2. Adiciona um tempo limite explícito de 10 segundos para a conexão.
    connect_args={"connect_timeout": 10}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os nossos modelos SQLAlchemy
class Base(DeclarativeBase):
    pass

# Função de dependência centralizada para obter a sessão do banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()