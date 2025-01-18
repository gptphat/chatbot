# Requirement Ubuntu 22.04 LTS

## Install Ollama

https://github.com/ollama/ollama

```
curl -fsSL https://ollama.com/install.sh | sh
```

## Load model to Ollama

1. Download model: https://huggingface.co/janhq/Vistral-7b-Chat-GGUF/tree/main
2. Change path in model/Modelfile 
3. Load model: ollama create my-model -f model/Modelfile 


## Run and import data to ELASTICSEARCH

1. cd chatbot
2. docker compose up -d

#### Import data

3. cd ../crawler
4. python3 elasticserach_index.py

# Run UI

## Run server
```
screen -S chatbot
cd chatbotguest
npm run build
npm run start
```

## Run ngrok
screen -S ngrok
ngrok http --domain gptphat.com 3000

## Start up with crontab
```
chmod +x /home/{user}/bavangbot/script.sh # change path
```
### Add to crontab

crontab -e
```
@reboot /home/{user}/bavangbot/script.sh # change path
```

UI from source https://github.com/mckaywrigley/chatbot-ui