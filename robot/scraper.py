# Arquivo: robot/scraper.py
# Versão: Produção 1.7
# Descrição: Robô orquestrador para extração de dados de processos no portal e-SAJ TJSP.
# Changelog v1.7: Adicionada a camada final de resiliência. O robô agora captura
#                 timeouts no clique de "Visualizar autos", evitando que a aplicação
#                 trave em caso de "soft-blocking" do site.

import asyncio
import os
import re
import random
import requests
from dotenv import load_dotenv
from playwright.async_api import async_playwright, TimeoutError
from email_helper import fetch_verification_code
from pdf_parser import extract_data_from_petition

class TjspScraper:
    LOGIN_URL = "https://esaj.tjsp.jus.br/cpopg/open.do"
    
    def __init__(self, tjsp_user, tjsp_pass, email_user, email_pass):
        self.tjsp_user = tjsp_user
        self.tjsp_pass = tjsp_pass
        self.email_user = email_user
        self.email_pass = email_pass
        self.processed_contracts = 0
        self.seen_process_numbers = set()
        print("Robô TJSP v1.7 (Produção - Resiliência Total) inicializado.")

    async def _random_delay(self, min_seconds=2, max_seconds=5):
        delay = random.uniform(min_seconds, max_seconds)
        await asyncio.sleep(delay)

    async def _login(self, page):
        print("--- FASE: LOGIN ---")
        await page.goto(self.LOGIN_URL)
        await self._random_delay(1, 2)
        await page.click('#headerNmUsuarioLogado')
        await page.type('#usernameForm', self.tjsp_user, delay=100)
        await page.type('#passwordForm', self.tjsp_pass, delay=120)
        await page.click('#pbEntrar')
        try:
            print("Verificando se a tela 2FA apareceu (aguardando até 7s)...")
            validation_locator = page.get_by_role("textbox", name="Ex.:")
            await validation_locator.wait_for(timeout=7000)
            print("!!! TELA DE VALIDAÇÃO DE LOGIN DETECTADA !!!")
            auth_code = fetch_verification_code(self.email_user, self.email_pass)
            if not auth_code: raise Exception("Não foi possível obter o código 2FA.")
            print(f"Preenchendo com o código: {auth_code}")
            await validation_locator.fill(auth_code)
            submit_button = page.get_by_role("button", name="Enviar")
            await submit_button.click()
            await page.wait_for_url("**/cpopg/open.do**", timeout=15000)
            print("Login com 2FA realizado com sucesso!")
        except TimeoutError:
            print("Nenhuma tela 2FA detectada. Login direto realizado com sucesso!")
            await page.wait_for_url("**/cpopg/open.do**", timeout=15000)

    async def _process_digital_folder(self, digital_folder_page, process_number):
        print(f"--- FASE: PROCESSANDO PASTA DIGITAL (DADOS DO RÉU) | PROCESSO {process_number} ---")
        try:
            await self._random_delay()
            petition_locator = digital_folder_page.get_by_text(re.compile(r"petição", re.IGNORECASE))
            await petition_locator.first.click()
            print("  [INFO] Documento da Petição selecionado.")
            iframe = digital_folder_page.frame_locator("iframe[name=\"documento\"]")
            download_button = iframe.get_by_role("button", name="Baixar")
            async with digital_folder_page.expect_download() as download_info:
                await self._random_delay(1, 2)
                await download_button.click()
            download = await download_info.value
            pdf_path = os.path.join(os.path.dirname(__file__), f"peticao_{process_number}.pdf")
            await download.save_as(pdf_path)
            print(f"  [INFO] Download concluído. PDF salvo em: {pdf_path}")
            extracted_data = extract_data_from_petition(pdf_path)
            os.remove(pdf_path)
            print(f"  [INFO] Arquivo PDF temporário removido.")
            return extracted_data
        except Exception as e:
            print(f"  [ERRO] Ocorreu um erro ao processar a pasta digital: {e}")
            return None
        finally:
            await digital_folder_page.close()

    async def run_sessions(self, oab_list, target_contracts=500):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            await self._login(page)

            for oab_number in oab_list:
                if self.processed_contracts >= target_contracts:
                    print(f"\n[META ATINGIDA] Total de {target_contracts} contratos processados. Encerrando.")
                    break
                
                print("\n... Pausa estratégica antes da próxima busca ...")
                await self._random_delay(4, 8)
                
                print(f"\n--- INICIANDO BUSCA PARA A OAB: {oab_number} ---")
                await page.goto(self.LOGIN_URL)
                await page.wait_for_selector('select#cbPesquisa')
                await page.select_option('select#cbPesquisa', 'NUMOAB')
                print(f"  [INFO] Digitanto OAB: {oab_number}")
                await page.locator('#campo_NUMOAB').type(oab_number, delay=random.randint(80, 200))

                await self._random_delay(1, 2)
                async with page.expect_navigation():
                    await page.click('#botaoConsultarProcessos')

                try:
                    print(f"  [INFO] Aguardando o carregamento do primeiro resultado para a OAB {oab_number}...")
                    await page.locator('ul.unj-list-row').first.wait_for(timeout=15000)
                    print("  [INFO] Lista de resultados carregada com sucesso.")
                except TimeoutError:
                    print(f"  [AVISO] A busca pela OAB {oab_number} não retornou nenhum resultado inicial. Pulando para a próxima OAB.")
                    continue 
                
                page_number = 1
                oab_session_stable = True
                
                while oab_session_stable: 
                    if self.processed_contracts >= target_contracts: break
                    
                    await self._random_delay(2, 4)
                    print(f"\n--- Analisando página {page_number} de resultados da OAB {oab_number} ---")
                    
                    process_rows = await page.locator('ul.unj-list-row > li').all()
                    if not process_rows:
                        print("  [INFO] Nenhum processo encontrado nesta página específica. Finalizando busca para esta OAB.")
                        break

                    valid_processes_on_page = []
                    for row in process_rows:
                        process_link_element = row.locator('a.linkProcesso')
                        process_number_text = await process_link_element.inner_text()
                        process_number = re.sub(r'[\s.-]', '', process_number_text)
                        classe_text = await row.locator('div.classeProcesso').inner_text()
                        assunto_text = await row.locator('div.assuntoPrincipalProcesso').inner_text()
                        if "procedimento comum cível" in classe_text.lower() and "contratos bancários" in assunto_text.lower():
                            valid_processes_on_page.append((process_number, process_number_text.strip()))
                            
                    for process_number, process_number_text in valid_processes_on_page:
                        if self.processed_contracts >= target_contracts: break
                        if process_number in self.seen_process_numbers:
                            print(f"  [INFO] Processo {process_number} já foi visto nesta sessão. Ignorando.")
                            continue

                        await self._random_delay(1, 3)
                        print(f"\n-> Processando: {process_number_text}")
                        self.seen_process_numbers.add(process_number)

                        try:
                            async with page.expect_navigation(timeout=30000):
                                await page.get_by_text(process_number_text, exact=True).click()
                        except TimeoutError:
                             print(f"  [ERRO CRÍTICO] Timeout ao navegar para o processo {process_number_text}.")
                             print("  [AÇÃO DE RECUPERAÇÃO] Abandonando a busca para a OAB ATUAL para garantir a estabilidade da sessão.")
                             oab_session_stable = False
                             break
                        
                        page_content = await page.content()
                        if "extinto" in page_content.lower() or "cancelado" in page_content.lower():
                            print(f"  [INFO] Processo {process_number} está Extinto/Cancelado. Ignorando.")
                            await page.go_back(); await page.wait_for_load_state()
                            continue
                        
                        valor_causa_site = "Não encontrado"
                        try:
                            mais_locator = page.get_by_text("Mais Recolher")
                            if await mais_locator.is_visible(timeout=3000):
                                await mais_locator.click(); await page.wait_for_timeout(500)
                            
                            label_valor = page.locator("span:text-is('Valor da ação')")
                            await label_valor.wait_for(timeout=3000)
                            valor_causa_site = await label_valor.locator("xpath=./following-sibling::div").inner_text()
                        except Exception:
                            pass 

                        visualizar_autos_button = page.get_by_title("Pasta digital")
                        if not await visualizar_autos_button.is_visible():
                            await page.go_back(); await page.wait_for_load_state()
                            continue

                        try:
                            print("  [AÇÃO] Clicando em 'Visualizar autos'...")
                            async with page.context.expect_page(timeout=45000) as folder_page_info:
                                await visualizar_autos_button.click()
                            
                            digital_folder_page = await folder_page_info.value
                            await digital_folder_page.wait_for_load_state()
                            
                            extracted_data_pdf = await self._process_digital_folder(digital_folder_page, process_number)
                            
                            if extracted_data_pdf:
                                payload = {
                                    "numero_processo": process_number,
                                    "nome_reu": extracted_data_pdf.get("defendant_name", "Não encontrado"),
                                    "cpf_cnpj_reu": extracted_data_pdf.get("defendant_id", "Não encontrado"),
                                    "valor_causa": valor_causa_site
                                }
                                try:
                                    response = requests.post("http://127.0.0.1:8000/processos/", json=payload, timeout=15)
                                    if response.status_code == 200:
                                        self.processed_contracts += 1
                                        print("    -> SUCESSO: Dados salvos no banco de dados!")
                                    elif response.status_code == 400 and "Processo já cadastrado" in response.text:
                                        print("    -> INFO: Processo já existente no banco de dados.")
                                    else:
                                        print(f"    -> ERRO API: {response.status_code} - {response.text}")
                                except Exception as e:
                                    print(f"    -> ERRO CONEXÃO API: {e}")
                                print(f"  [STATUS] Contratos processados: {self.processed_contracts}/{target_contracts}")
                        
                        except TimeoutError:
                            print(f"  [AVISO CRÍTICO] Timeout ao tentar abrir a Pasta Digital do processo {process_number_text}.")
                            print("  [INFO] O site pode estar sobrecarregado ou a sessão foi bloqueada. Ignorando este processo para continuar.")
                        
                        print("<- Voltando para a lista de processos...")
                        await page.go_back()
                        await page.wait_for_load_state()
                    
                    if not oab_session_stable: break
                    
                    next_page_button = page.locator('a[title="Próxima página"]')
                    if await next_page_button.count() > 0:
                        print("\n-> Indo para a próxima página de resultados...")
                        await self._random_delay(2, 4)
                        await next_page_button.first.click()
                        await page.wait_for_load_state()
                        page_number += 1
                    else:
                        print("  [INFO] Fim dos resultados para esta OAB.")
                        break

            print("\n[SESSÃO FINALIZADA] Todas as OABs foram processadas ou a meta de contratos foi atingida.")
            await context.close()
            await browser.close()

async def main():
    try:
        dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
        if not os.path.exists(dotenv_path):
             dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
        load_dotenv(dotenv_path=dotenv_path)

        tjsp_user = os.getenv("TJSP_USER")
        tjsp_pass = os.getenv("TJSP_PASSWORD")
        email_user = os.getenv("EMAIL_USER")
        email_pass = os.getenv("EMAIL_PASSWORD")

        if not all([tjsp_user, tjsp_pass, email_user, email_pass]):
            print("[ERRO CRÍTICO] Verifique se todas as credenciais (TJSP_USER, TJSP_PASSWORD, EMAIL_USER, EMAIL_PASSWORD) estão no arquivo .env")
            return
        
        oab_file_path = os.path.join(os.path.dirname(__file__), 'oabs.txt')
        with open(oab_file_path, 'r') as f:
            oab_list_to_search = [line.strip() for line in f if line.strip()]
        print(f"{len(oab_list_to_search)} OABs carregadas do arquivo oabs.txt")
        
        scraper = TjspScraper(tjsp_user, tjsp_pass, email_user, email_pass)
        await scraper.run_sessions(oab_list=oab_list_to_search, target_contracts=500)

    except FileNotFoundError:
        print(f"[ERRO CRÍTICO] Arquivo de configuração não encontrado. Verifique se '.env' e 'oabs.txt' existem.")
    except Exception as e:
        print(f"[ERRO INESPERADO NA EXECUÇÃO PRINCIPAL] Ocorreu um erro fatal: {e}")

if __name__ == "__main__":
    print("=============================================")
    print("== INICIANDO AUTOMAÇÃO JURIS-SISTEMA SCRAPER ==")
    print("=============================================")
    asyncio.run(main())