from typing import List, Optional
import logging
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class BaseLLMClient(ABC):
    """Base class for LLM clients"""

    @abstractmethod
    async def analyze(self, prompt: str, images: Optional[List[str]] = None) -> str:
        """Analyze content with the LLM"""
        pass


class OpenAIClient(BaseLLMClient):
    """OpenAI API client"""

    def __init__(self, api_key: str, model: str):
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model

    async def analyze(self, prompt: str, images: Optional[List[str]] = None) -> str:
        """Analyze with OpenAI Vision API"""
        try:
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt}
                    ]
                }
            ]

            # Add images if provided
            if images:
                for img_base64 in images:
                    messages[0]["content"].append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{img_base64}"
                        }
                    })

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=1000,
                temperature=0.1,
            )

            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}", exc_info=True)
            raise


class AnthropicClient(BaseLLMClient):
    """Anthropic API client"""

    def __init__(self, api_key: str, model: str):
        from anthropic import AsyncAnthropic
        self.client = AsyncAnthropic(api_key=api_key)
        self.model = model

    async def analyze(self, prompt: str, images: Optional[List[str]] = None) -> str:
        """Analyze with Anthropic Claude API"""
        try:
            content = [
                {"type": "text", "text": prompt}
            ]

            # Add images if provided
            if images:
                for img_base64 in images:
                    content.append({
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": img_base64,
                        },
                    })

            response = await self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                temperature=0.1,
                messages=[
                    {
                        "role": "user",
                        "content": content
                    }
                ]
            )

            return response.content[0].text

        except Exception as e:
            logger.error(f"Anthropic API error: {str(e)}", exc_info=True)
            raise


class LLMClient:
    """Factory for creating LLM clients"""

    def __init__(self, provider: str, api_key: str, model: str):
        if provider == "openai":
            self.client = OpenAIClient(api_key, model)
        elif provider == "anthropic":
            self.client = AnthropicClient(api_key, model)
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

    async def analyze(self, prompt: str, images: Optional[List[str]] = None) -> str:
        """Analyze content with the configured LLM"""
        return await self.client.analyze(prompt, images)
