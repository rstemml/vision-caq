from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    llm_api_key: str
    llm_provider: Literal["openai", "anthropic"] = "openai"
    llm_model: str = "gpt-4-vision-preview"
    port: int = 8000
    host: str = "0.0.0.0"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
