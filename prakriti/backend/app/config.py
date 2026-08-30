from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    APP_NAME: str = "PRAKRITI"
    APP_ENV: str = "development"
    DEBUG: bool = True

    DATABASE_URL: Optional[str] = None

    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    AI_MODE: str = "demo"

    MAX_UPLOAD_SIZE_MB: int = 10
    UPLOAD_DIR: str = "uploads"

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def db_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return "sqlite+aiosqlite:///./prakriti.db"

    @property
    def origins(self) -> list:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()
