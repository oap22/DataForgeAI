from pydantic import BaseModel
from typing import Any

class URLData(BaseModel):
    urls: dict[str, Any]