# arquivo: backend/models.py

from sqlalchemy import Column, Integer, String, Table, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base
from sqlalchemy import Column, Integer, String, Table, ForeignKey, Text, Enum

# --- GRANDE MUDANÇA: O Objeto de Associação ---
# A nossa antiga "tabela-ponte" agora é um MODELO COMPLETO.
# Isso nos permite adicionar colunas extras a ela, como a de observações.
class FolderProcessAssociation(Base):
    __tablename__ = 'folder_process_association'
    folder_id = Column(ForeignKey('folders.id'), primary_key=True)
    processo_id = Column(ForeignKey('processos.id'), primary_key=True)
    # --- A NOVA COLUNA! ---
    observation = Column(Text, nullable=True) # Usamos Text para anotações longas

    # Relações para que possamos navegar a partir deste objeto
    folder = relationship("Folder", back_populates="processo_associations")
    processo = relationship("Processo", back_populates="folder_associations")


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    
    folders = relationship("Folder", back_populates="owner")


class Processo(Base):
    __tablename__ = "processos"

    id = Column(Integer, primary_key=True, index=True)
    numero_processo = Column(String(255), unique=True, index=True)
    nome_reu = Column(String(255), index=True)
    cpf_cnpj_reu = Column(String(255))
    valor_causa = Column(String(50))

    # --- NOVA COLUNA DE STATUS ---
    # Usamos um Enum para garantir que apenas estes três valores sejam aceitos.
    # O valor padrão para todo novo processo será "PENDENTE".
    status = Column(Enum("PENDENTE", "APROVADO", "REJEITADO", name="status_enum"), default="PENDENTE", nullable=False)

    # A relação com as pastas continua a mesma
    folder_associations = relationship("FolderProcessAssociation", back_populates="processo")


class Folder(Base):
    __tablename__ = "folders"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="folders")
    
    # --- MUDANÇA SUTIL ---
    # A relação agora aponta para o nosso novo objeto de associação
    processo_associations = relationship("FolderProcessAssociation", back_populates="folder")