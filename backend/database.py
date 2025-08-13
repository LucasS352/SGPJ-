from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import NullPool

# Verifique se esta URL corresponde exatamente à sua configuração do MariaDB
DATABASE_URL = "mysql+pymysql://root:@localhost:3307/juris_db"

# Engine configurado para maior estabilidade
engine = create_engine(
    DATABASE_URL,
    # Desativa o pool de conexões para evitar travamentos em certos ambientes
    poolclass=NullPool,
    # Define um tempo limite de 10 segundos para a tentativa de conexão inicial
    connect_args={"connect_timeout": 10}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os nossos modelos SQLAlchemy
class Base(DeclarativeBase):
    pass

# Função de dependência centralizada para obter a sessão do banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()