# Arquivo: robot/test_email.py
import os
from dotenv import load_dotenv
from imap_tools import MailBox

print("Iniciando teste de conexão de e-mail...")

# Carrega as variáveis do arquivo .env na raiz do projeto
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
IMAP_SERVER = "imap.gmail.com"
TARGET_FOLDER = "INBOX" # Pasta que você mencionou

if not EMAIL_USER or not EMAIL_PASSWORD:
    print("ERRO: Verifique se EMAIL_USER e EMAIL_PASSWORD estão no arquivo .env")
else:
    try:
        # Tenta fazer login e selecionar a pasta 'ESAJ'
        with MailBox(IMAP_SERVER).login(EMAIL_USER, EMAIL_PASSWORD, initial_folder=TARGET_FOLDER) as mailbox:
            print(f"\n>>> SUCESSO: Conexão com o servidor de e-mail e acesso à pasta '{TARGET_FOLDER}' foram bem-sucedidos!")
    except Exception as e:
        print(f"\n>>> FALHA: Não foi possível conectar ao servidor de e-mail.")
        print(f"Detalhe do erro: {e}")
        print("\nPossíveis soluções:")
        print("1. Verifique se a SENHA DE APLICATIVO está correta no arquivo .env.")
        print("2. Verifique se o acesso IMAP está ativado nas configurações do Outlook.com.")