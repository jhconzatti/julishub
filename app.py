import requests

# URL da API pública de cotações
url = "https://economia.awesomeapi.com.br/last/USD-BRL"

print("Consultando API...")

response = requests.get(url)
data = response.json()

# Acessando os dados (parecido com JSON do JS)
cotacao = data['USDBRL']['bid']

print(f"O Dólar está custando: R$ {cotacao}")