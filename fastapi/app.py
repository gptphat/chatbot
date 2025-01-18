from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from litellm import acompletion
from pydantic import BaseModel
from typing import List
import aiohttp

class RequestModel(BaseModel):
    model: str
    messages: List[dict]
    stream: bool

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

host_ollama = "http://127.0.0.1:11434"

async def get_json_events(request: RequestModel): 
  response = await acompletion(
      model=f"ollama/{request.model}", 
      messages=request.messages, 
      api_base=host_ollama,
      max_tokens=1024,
      stream=request.stream
  )
  async for chunk in response:
    if chunk['choices'][0]['finish_reason']:
      break
    yield chunk['choices'][0]['delta']["content"]

@app.post("/api/chat", response_class=StreamingResponse)
async def chat(request: RequestModel):
  return StreamingResponse(get_json_events(request))

@app.get("/api/tags")
async def tags():
  async with aiohttp.ClientSession() as session: 
    async with session.get(f"{host_ollama}/api/tags") as resp: 
      return await resp.json()

# if __name__ == '__main__':
#     uvicorn.run(app, port=8080, host='0.0.0.0', workers=1, debug=True)