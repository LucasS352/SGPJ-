# Arquivo: robot/email_helper.py

import re
import time
from imap_tools import MailBox, A

IMAP_SERVER = "imap.gmail.com"

def fetch_verification_code(email_user, email_password, retries=6, delay=8):
    """
    Conecta-se à caixa de e-mail do Gmail, busca pelo último e-mail não lido que contenha o
    assunto correto e extrai o código de 6 dígitos.
    """
    print("\n--- FASE: BUSCANDO CÓDIGO DE VERIFICAÇÃO NO GMAIL ---")
    
    if not email_user or not email_password:
        print("Erro: Credenciais de e-mail não foram fornecidas para a função.")
        return None

    # Espera inicial aumentada para dar tempo do e-mail chegar
    print(f"Aguardando 20 segundos iniciais para o e-mail chegar...")
    time.sleep(20)

    for i in range(retries):
        try:
            with MailBox(IMAP_SERVER).login(email_user, email_password, 'INBOX') as mailbox:
                print(f"Tentativa {i+1}/{retries}: Conectado a {email_user}. Procurando e-mails não lidos...")
                
                criteria = A(seen=False)
                
                for msg in mailbox.fetch(criteria, charset='UTF8', reverse=True):
                    print(f"  -> Verificando e-mail com assunto: '{msg.subject}'")
                    
                    if "portal e-saj - validação de login" in msg.subject.lower():
                        print(f"  [E-MAIL CORRETO ENCONTRADO!]")
                        match = re.search(r'\b\d{6}\b', msg.text)
                        
                        if match:
                            code = match.group(0)
                            print(f"  [CÓDIGO DE 6 DÍGITOS ENCONTRADO]: {code}")
                            
                            # --- CORREÇÃO APLICADA AQUI ---
                            # Usando o método .flag() que é mais compatível
                            mailbox.flag([msg.uid], '\\Seen', True)
                            print(f"  E-mail marcado como lido.")
                            
                            return code
                        else:
                            print("  [ERRO]: E-mail válido encontrado, mas não foi possível extrair o código.")
                    
        except Exception as e:
            print(f"Ocorreu um erro ao tentar processar o e-mail: {e}")

        if i < retries - 1:
            print(f"Código não encontrado nesta tentativa. Aguardando {delay} segundos...")
            time.sleep(delay)
            
    print("Não foi possível encontrar o código de verificação após várias tentativas.")
    return None