# Arquivo: robot/pdf_parser.py (VERSÃO FINAL COM MÚLTIPLAS REGRAS E LIMPEZA)
import fitz  # PyMuPDF
import re

def clean_name(name):
    """Remove palavras-chave comuns que são capturadas por engano no nome do réu."""
    artefatos = [
        "face de", "em face de", "confronto de", "à presença de vossa excelência",
        "to de financiamento c.c pedido de consignação em pagamento c.c pedido de antecipação de tutela jurisdicional em face de",
        "tual e cancelamento de garantia por alienação fiduciária alienação fiduciária de bem imóvel – bem de família – impenhorabilidade em face de"
    ]
    name_lower = name.lower()
    for artefato in artefatos:
        if artefato in name_lower:
            name_lower = name_lower.replace(artefato, "")
    return name_lower.strip().upper()

def extract_data_from_petition(pdf_path):
    """
    Abre um PDF e tenta uma lista de regras (regex) para extrair os dados de forma robusta.
    """
    print(f"\n--- LENDO ARQUIVO PDF: {pdf_path} ---")
    full_text = ""
    try:
        with fitz.open(pdf_path) as doc:
            for page in doc:
                full_text += page.get_text()

        normalized_text = " ".join(full_text.lower().split())

        extracted_data = {
            "defendant_name": "Não encontrado",
            "defendant_id": "Não encontrado",
            "case_value": "Não encontrado"
        }

        # --- ESTRATÉGIA DE EXTRAÇÃO COM MÚLTIPLAS REGRAS PARA O RÉU ---
        defendant_patterns = [
            r'em face de\s*(.*?),\s*.*?(?:cpf|cnpj).*?n[º°]?\s*([\d\.\-\/]+)',
            r'ação de cobrança em\s*(.*?),\s*.*?(?:cpf|cnpj).*?n[º°]?\s*([\d\.\-\/]+)',
            r'contra\s*(.*?),\s*.*?(?:cpf|cnpj).*?n[º°]?\s*([\d\.\-\/]+)',
            r'em\s*(.*?),\s*.*?(?:inscrita no|inscrito no)\s*(?:cpf/?[mf]?|cnpj/?[mf]?)\s*n[º°]?\s*([\d\.\-\/]+)'
        ]

        for pattern in defendant_patterns:
            defendant_match = re.search(pattern, normalized_text, re.DOTALL)
            if defendant_match:
                # Limpa o nome para remover artefatos e extrai os dados
                extracted_data["defendant_name"] = clean_name(defendant_match.group(1))
                extracted_data["defendant_id"] = defendant_match.group(2).strip()
                break # Para na primeira regra que funcionar

        # --- ESTRATÉGIA DE EXTRAÇÃO COM MÚLTIPLAS REGRAS PARA O VALOR ---
        value_patterns = [
            r'(?:dando à presente o valor de|dá-se à causa o valor|dá à causa o valor de|dá-se à causa, o valor de)\s*r\$\s*([\d\.,]+)',
            r'valor\s*da\s*causa\s*:\s*r\$\s*([\d\.,]+)'
        ]

        for pattern in value_patterns:
            value_match = re.search(pattern, normalized_text)
            if value_match:
                extracted_data["case_value"] = value_match.group(1).strip()
                break # Para na primeira regra que funcionar

        return extracted_data

    except Exception as e:
        print(f"Ocorreu um erro ao ler o arquivo PDF: {e}")
        return None