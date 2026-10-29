"""Typed errors. The analysis path must raise these instead of returning a guess."""


class AnalysisError(Exception):
    """Raised whenever an image cannot be analysed trustworthily."""

    def __init__(self, code: str, message: str, hint: str = ""):
        super().__init__(f"{code}: {message}")
        self.code = code
        self.message = message
        self.hint = hint

    def to_dict(self) -> dict:
        return {"code": self.code, "message": self.message, "hint": self.hint}
