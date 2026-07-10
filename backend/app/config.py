"""
SmartSeat AI — Application Configuration (Firebase)
"""
from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "SmartSeat AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Firebase Auth & Firestore (Obsolete but keeping for backward compat)
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = None
    
    # MongoDB (Mocked via InMemoryStore)
    MONGODB_URI: Optional[str] = None
    MONGODB_DB_NAME: Optional[str] = "smartseat"

    # JWT
    SECRET_KEY: str = "smartseat-ai-super-secret-key-min-32-characters-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    AI_MAX_TOKENS: int = 1000
    AI_TEMPERATURE: float = 0.1

    @property
    def ai_provider(self) -> str:
        return "openai" if self.OPENAI_API_KEY else "mock"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    AI_RATE_LIMIT_PER_MINUTE: int = 10


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
