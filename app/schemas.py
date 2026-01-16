from pydantic import BaseModel


class URLData(BaseModel):
    domain: str
    duration: int