# arquivo: backend/models.py

from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

# Tabela de associação para a relação Muitos-para-Muitos entre Pastas e Processos
folder_process_association = Table('folder_process_association', Base.metadata,
    Column('folder_id', Integer, ForeignKey('folders.id'), primary_key=True),
    Column('processo_id', Integer, ForeignKey('processos.id'), primary_key=True)
)

# Modelo para a tabela 'users'
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))

    # Relação: Um Usuário é "dono" de muitas Pastas
    folders = relationship("Folder", back_populates="owner")

# Modelo para a tabela 'processos'
class Processo(Base):
    __tablename__ = "processos"

    id = Column(Integer, primary_key=True, index=True)
    numero_processo = Column(String(255), unique=True, index=True)
    nome_reu = Column(String(255), index=True)
    cpf_cnpj_reu = Column(String(255))
    valor_causa = Column(String(50))
    
    # Relação: Um Processo pode estar em muitas Pastas
    folders = relationship(
        "Folder",
        secondary=folder_process_association,
        back_populates="processos"
    )

# Modelo para a tabela 'folders'
class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    
    # Relação: Uma Pasta pertence a um único "dono" (Usuário)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="folders")
    
    # Relação: Uma Pasta pode conter muitos Processos
    processos = relationship(
        "Processo",
        secondary=folder_process_association,
        back_populates="folders"
    )