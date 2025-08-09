# Arquivo: robot/scraper.py (VERSÃO COM INTEGRAÇÃO À API)
import asyncio
import os
import re
import random
import requests # Importa a biblioteca para fazer chamadas de API
from dotenv import load_dotenv
from playwright.async_api import async_playwright, TimeoutError
from email_helper import fetch_verification_code
from pdf_parser import extract_data_from_petition

class TjspScraper:
    # ... (o __init__, _login, _random_delay e _process_digital_folder continuam os mesmos) ...
    LOGIN_URL = "https://esaj.tjsp.jus.br/cpopg/open.do"
    def __init__(self, tjsp_user, tjsp_pass, email_user, email_pass):
        self.tjsp_user = tjsp_user
        self.tjsp_pass = tjsp_pass
        self.email_user = email_user
        self.email_pass = email_pass
        self.processed_contracts = 0
        print("Robô TJSP inicializado.")
    async def _random_delay(self, min_seconds=2, max_seconds=4):
        delay = random.uniform(min_seconds, max_seconds)
        await asyncio.sleep(delay)
    async def _login(self, page):
        print("--- FASE: LOGIN ---")
        await page.goto(self.LOGIN_URL)
        await self._random_delay()
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
            print("Código enviado. Verificando o resultado...")
            success_task = asyncio.create_task(page.wait_for_url("**/cpopg/open.do**", timeout=15000))
            failure_task = asyncio.create_task(page.wait_for_selector('text="O código informado está inválido"', timeout=15000))
            done, pending = await asyncio.wait([success_task, failure_task], return_when=asyncio.FIRST_COMPLETED)
            for task in pending: task.cancel()
            if failure_task in done: raise Exception("O código 2FA é inválido ou expirou.")
            print("Login com 2FA realizado com sucesso!")
        except TimeoutError:
            print("Nenhuma tela 2FA detectada. Login direto realizado com sucesso!")
            await page.wait_for_url("**/cpopg/open.do**", timeout=15000)
    async def _process_digital_folder(self, digital_folder_page, process_number):
        print(f"--- FASE: PROCESSANDO PASTA DIGITAL DO PROCESSO {process_number} ---")
        try:
            await self._random_delay()
            petition_locator = digital_folder_page.get_by_text(re.compile(r"petição", re.IGNORECASE))
            await petition_locator.first.click()
            print("Documento da Petição selecionado.")
            iframe = digital_folder_page.frame_locator("iframe[name=\"documento\"]")
            download_button = iframe.get_by_role("button", name="Baixar")
            async with digital_folder_page.expect_download() as download_info:
                await self._random_delay(1, 2)
                await download_button.click()
            download = await download_info.value
            pdf_path = os.path.join(os.path.dirname(__file__), f"peticao_{process_number}.pdf")
            await download.save_as(pdf_path)
            print(f"Download concluído. PDF salvo em: {pdf_path}")
            extracted_data = extract_data_from_petition(pdf_path)
            os.remove(pdf_path)
            print(f"Arquivo PDF temporário removido.")
            return extracted_data
        except Exception as e:
            print(f"Ocorreu um erro ao processar a pasta digital: {e}")
            return None
        finally:
            await digital_folder_page.close()

    async def run_sessions(self, oab_list, target_contracts=10):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            context = await browser.new_context()
            page = await context.new_page()
            await self._login(page)
            for oab_number in oab_list:
                if self.processed_contracts >= target_contracts:
                    print(f"Meta de {target_contracts} contratos atingida. Encerrando.")
                    break
                print(f"\n--- INICIANDO BUSCA PARA A OAB: {oab_number} ---")
                await page.goto(self.LOGIN_URL)
                await self._random_delay()
                await page.wait_for_selector('select#cbPesquisa')
                await page.select_option('select#cbPesquisa', 'NUMOAB')
                await page.fill('#campo_NUMOAB', oab_number)
                async with page.expect_navigation():
                    await page.click('#botaoConsultarProcessos')
                page_number = 1
                while self.processed_contracts < target_contracts:
                    await self._random_delay()
                    print(f"\n--- Analisando página {page_number} de resultados da OAB {oab_number} ---")
                    process_rows = await page.locator('ul.unj-list-row > li').all()
                    if not process_rows:
                        print("Nenhum processo encontrado nesta página.")
                        break
                    valid_processes_on_page = []
                    for row in process_rows:
                        process_link_element = row.locator('a.linkProcesso')
                        process_number = await process_link_element.inner_text()
                        classe_text = await row.locator('div.classeProcesso').inner_text()
                        assunto_text = await row.locator('div.assuntoPrincipalProcesso').inner_text()
                        if "procedimento comum cível" in classe_text.lower() and "contratos bancários" in assunto_text.lower():
                            print(f"  [PROCESSO VÁLIDO ENCONTRADO]: {process_number}")
                            valid_processes_on_page.append(process_number)
                    for process_number in valid_processes_on_page:
                        if self.processed_contracts >= target_contracts: break
                        await self._random_delay()
                        print(f"\n-> Processando: {process_number}")
                        async with page.expect_navigation():
                            await page.get_by_role("link", name=process_number, exact=True).click()
                        page_content = await page.content()
                        if "extinto" in page_content.lower() or "cancelado" in page_content.lower():
                            print(f"  [AVISO]: Processo {process_number} está Extinto/Cancelado. Ignorando.")
                            await page.go_back()
                            await page.wait_for_load_state()
                            continue
                        visualizar_autos_button = page.get_by_title("Pasta digital")
                        if not await visualizar_autos_button.is_visible():
                            print(f"  [AVISO]: Botão 'Visualizar autos' não encontrado. Ignorando.")
                            await page.go_back()
                            await page.wait_for_load_state()
                            continue
                        async with page.context.expect_page() as folder_page_info:
                            await visualizar_autos_button.click()
                        digital_folder_page = await folder_page_info.value
                        await digital_folder_page.wait_for_load_state()
                        
                        # --- LÓGICA DE ENVIO PARA API ---
                        extracted_data = await self._process_digital_folder(digital_folder_page, process_number)
                        
                        if extracted_data:
                            payload = {
                                "numero_processo": process_number,
                                "nome_reu": extracted_data["defendant_name"],
                                "cpf_cnpj_reu": extracted_data["defendant_id"],
                                "valor_causa": extracted_data["case_value"]
                            }
                            try:
                                response = requests.post("http://127.0.0.1:8000/processos/", json=payload)
                                if response.status_code == 200:
                                    print("  -> Dados enviados para a API e salvos no banco de dados com sucesso!")
                                    self.processed_contracts += 1
                                elif response.status_code == 400 and "Processo já cadastrado" in response.text:
                                    print("  -> Processo já existente no banco de dados.")
                                else:
                                    print(f"  [ERRO] Falha ao enviar dados para a API: {response.status_code} - {response.text}")
                            except Exception as e:
                                print(f"  [ERRO] Não foi possível conectar à API: {e}")
                            print(f"Contratos processados: {self.processed_contracts}/{target_contracts}")
                        # --- FIM DA LÓGICA DE ENVIO ---

                        print("<- Voltando para a lista de processos...")
                        await page.go_back()
                        await page.wait_for_load_state()
                    if self.processed_contracts >= target_contracts: break
                    next_page_button = page.locator('a[title="Próxima página"]')
                    if await next_page_button.count() > 0:
                        print("\nIndo para a próxima página de resultados...")
                        await self._random_delay()
                        await next_page_button.first.click()
                        await page.wait_for_load_state()
                        page_number += 1
                    else:
                        print("Fim dos resultados para esta OAB.")
                        break
            print("\nSessão finalizada.")
            await context.close()
            await browser.close()

async def main():
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    load_dotenv(dotenv_path=dotenv_path)
    tjsp_user = os.getenv("TJSP_USER")
    tjsp_pass = os.getenv("TJSP_PASSWORD")
    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASSWORD")
    if not all([tjsp_user, tjsp_pass, email_user, email_pass]):
        print("Erro: Verifique se todas as credenciais estão no arquivo .env")
        return
    oab_list_to_search = ["259958", "205961", "149225"]
    scraper = TjspScraper(tjsp_user, tjsp_pass, email_user, email_pass)
    await scraper.run_sessions(oab_list=oab_list_to_search, target_contracts=10)

if __name__ == "__main__":
    print("Iniciando a automação...")
    asyncio.run(main())