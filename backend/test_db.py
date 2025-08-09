# arquivo: backend/test_db.py

import pymysql

# --- Coloque aqui os mesmos dados da sua DATABASE_URL ---
DB_HOST = "localhost"
DB_PORT = 3307
DB_USER = "root"
DB_PASSWORD = ""  # <-- Coloque sua senha aqui se houver uma
DB_NAME = "juris_db"
# ---------------------------------------------------------

try:
    print("Tentando conectar ao MariaDB...")
    connection = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        connect_timeout=5
    )
    print("✅ Conexão com o banco de dados bem-sucedida!")
    connection.close()
    print("Conexão fechada.")

except pymysql.Error as e:
    print(f"❌ Falha ao conectar ao banco de dados: {e}")