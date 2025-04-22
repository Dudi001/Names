# backend/app/config/responses.py
from typing import Any
from abc import abstractmethod, ABC
from fastapi.responses import JSONResponse, PlainTextResponse


class ResponseBase(ABC):
    """Абстрактный класс для формирования ответа на http-запрос."""

    def __init__(self, response: Any):
        self.response = response

    @abstractmethod
    def get_response(self):
        pass


class Http200(ResponseBase):
    """Ответ со статусом 200 OK.

    Аргументы:
        - response: словарь с результирующими данными
    """

    def __init__(self, response: dict[str, Any]):
        super().__init__(response=response)

    def get_response(self) -> JSONResponse:
        return JSONResponse({"response": self.response}, 200)


class Http400(ResponseBase):
    """Ответ со статусом 400 Bad Request.

    Аргументы:
        - response: список ошибок
    """

    def __init__(self, response: list[str] | str):
        super().__init__(response=response)

    def get_response(self) -> JSONResponse:
        list_data = [str(self.response)] if type(self.response) is not list else self.response
        return JSONResponse({"response": {"errors": list_data}}, 400)


class Http404(ResponseBase):
    """Ответ со статусом 404 Not Found.

    Аргументы:
        - response: строка с описанием ошибки
    """

    def __init__(self, response: str = "Не верно указан URL!"):
        super().__init__(response=response)

    def get_response(self) -> JSONResponse:
        return JSONResponse({"response": {"errors": [self.response]}}, 404)


class Http500(ResponseBase):
    """Ответ со статусом 500 Internal Server Error.

    Аргументы:
        - response: строка с описанием ошибки
    """

    def __init__(self, response: str):
        super().__init__(response=response)

    def get_response(self) -> PlainTextResponse:
        return PlainTextResponse(
            content=self.response,
            status_code=500
        )


def create_http_response(response: ResponseBase) -> JSONResponse | PlainTextResponse:
    """
    Метод принимает на вход результат выполнения обработчика роута.
    На выходе этот результат будет преобразован в единый формат.

    Аргументы:
        response: Результат выполнения обработчика роута.
    """

    return response.get_response()