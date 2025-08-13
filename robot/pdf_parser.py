# Arquivo: robot/pdf_parser.py (VERSÃO 5.2 - CORREÇÃO DE IMPORT CIRCULAR)
import fitz  # PyMuPDF
import re
import os
from PIL import Image
import pytesseract

# Configuração do Tesseract (ajuste o caminho se necessário)
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# --- FUNÇÕES AUXILIARES DE VALIDAÇÃO ---
def _is_cpf_valid(cpf: str) -> bool:
    cpf = ''.join(re.findall(r'\d', cpf))
    if len(cpf) != 11 or len(set(cpf)) == 1: return False
    soma = sum(int(cpf[i]) * (10 - i) for i in range(9)); resto = (soma * 10) % 11
    if resto == 10: resto = 0
    if resto != int(cpf[9]): return False
    soma = sum(int(cpf[i]) * (11 - i) for i in range(10)); resto = (soma * 10) % 11
    if resto == 10: resto = 0
    if resto != int(cpf[10]): return False
    return True

def _is_cnpj_valid(cnpj: str) -> bool:
    cnpj = ''.join(re.findall(r'\d', cnpj))
    if len(cnpj) != 14 or len(set(cnpj)) == 1: return False
    soma = sum(int(d) * w for d, w in zip(cnpj[:12], [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])); resto = soma % 11
    dv1 = 0 if resto < 2 else 11 - resto
    if dv1 != int(cnpj[12]): return False
    soma = sum(int(d) * w for d, w in zip(cnpj[:13], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])); resto = soma % 11
    dv2 = 0 if resto < 2 else 11 - resto
    if dv2 != int(cnpj[13]): return False
    return True
# --- FIM DAS FUNÇÕES AUXILIARES ---

def _extract_text_with_ocr(pdf_path: str) -> str:
    print("  [INFO] PDF sem texto detectado. Acionando modo OCR...")
    full_text = ""
    try:
        doc = fitz.open(pdf_path)
        for i, page in enumerate(doc):
            print(f"    -> Lendo imagem da página {i+1} com OCR...")
            pix = page.get_pixmap(dpi=300); img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            # Para melhores resultados, instale o Tesseract com o idioma 'por' (Português)
            full_text += pytesseract.image_to_string(img, lang='eng') + "\n"
        doc.close()
        print("  [SUCESSO] Extração via OCR concluída.")
        return full_text
    except Exception as e:
        print(f"  [ERRO] Falha no processo de OCR: {e}")
        return ""

def clean_name(name):
    """Limpa o nome extraído, removendo qualificações e texto residual."""
    name = " ".join(str(name).split()) # Normaliza espaços
    name = re.sub(r",.*", "", name).strip() # Remove tudo após a primeira vírgula
    return name.upper()

def extract_data_from_petition(pdf_path):
    print(f"\n--- LENDO ARQUIVO PDF (ESTRATÉGIA V5.2 - DUAS PASSAGENS): {pdf_path} ---")
    try:
        doc = fitz.open(pdf_path)
        full_text_plain = "".join(page.get_text() for page in doc)
        doc.close()

        if len(full_text_plain.strip()) < 200:
            full_text_plain = _extract_text_with_ocr(pdf_path)
            if not full_text_plain: raise Exception("Extração de texto e OCR falharam.")

        normalized_text = " ".join(full_text_plain.lower().split())
        
        defendant_name = None
        defendant_id = None

        # --- PRIMEIRA TENTATIVA (ALTA CONFIANÇA): Regex Contextual Completa ---
        print("  [INFO] Tentando Estratégia 1: Regex de Alta Confiança...")
        high_confidence_pattern = re.search(
            r'(?:em face de|ação de cobrança em)\s+(.*?),\s*.*?inscrita?\s+no\s+(?:cnpj|cpf).{0,5}\s+([\d.\-\/]+)',
            normalized_text,
            re.IGNORECASE
        )

        if high_confidence_pattern:
            potential_name = high_confidence_pattern.group(1)
            potential_id = high_confidence_pattern.group(2)
            
            clean_id_str = ''.join(re.findall(r'\d', potential_id))
            if _is_cpf_valid(clean_id_str) or _is_cnpj_valid(clean_id_str):
                defendant_name = clean_name(potential_name)
                defendant_id = clean_id_str
                print(f"  [SUCESSO] Dados encontrados via Estratégia 1.")

        # --- SEGUNDA TENTATIVA (FALLBACK): Análise de Bloco Contextual ---
        if not defendant_name or not defendant_id:
            print("  [INFO] Estratégia 1 falhou. Tentando Estratégia 2: Análise de Bloco Contextual...")
            keywords = ["em face de", "contra", "requerido:", "requerida:"]
            defendant_block = ""
            for key in keywords:
                start_pos = normalized_text.find(key)
                if start_pos != -1:
                    start_pos += len(key)
                    defendant_block = normalized_text[start_pos : start_pos + 400]
                    print(f"  [INFO] Bloco do réu identificado com a chave: '{key}'")
                    break
            
            if defendant_block:
                if not defendant_name:
                    match = re.search(r'^(.*?)(?:,)', defendant_block, re.IGNORECASE)
                    if match:
                        defendant_name = clean_name(match.group(1))

                if not defendant_id:
                    id_candidates = re.findall(r'[\d.\-\/]{11,18}', defendant_block)
                    for candidate in id_candidates:
                        clean_candidate = ''.join(re.findall(r'\d', candidate))
                        if _is_cpf_valid(clean_candidate) or _is_cnpj_valid(clean_candidate):
                            defendant_id = clean_candidate
                            break
        
        final_data = {
            "defendant_name": defendant_name if defendant_name else "Não encontrado",
            "defendant_id": defendant_id if defendant_id else "Não encontrado"
        }

        print(f"  [RESULTADO FINAL] Nome: {final_data['defendant_name']} | ID: {final_data['defendant_id']}")
        return final_data

    except Exception as e:
        print(f"  [ERRO CRÍTICO] Ocorreu um erro ao ler o arquivo PDF: {e}")
        return {"defendant_name": "Erro na leitura do PDF", "defendant_id": "Erro na leitura do PDF"}