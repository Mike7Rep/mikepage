from __future__ import annotations

from typing import Any, Optional
from urllib.parse import quote

import httpx
from fastapi import HTTPException, status

from .config import Settings, get_settings


class AlpacaClient:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()

    def _headers(self) -> dict[str, str]:
        return {
            "accept": "application/json",
            "APCA-API-KEY-ID": self.settings.alpaca_key,
            "APCA-API-SECRET-KEY": self.settings.alpaca_secret,
        }

    async def _request(
        self, method: str, base: str, path: str, **kwargs: Any
    ) -> Any:
        if not self.settings.alpaca_endpoint or not self.settings.alpaca_key:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Alpaca ENV missing")

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                method, f"{base}{path}", headers=self._headers(), **kwargs
            )

        if response.status_code >= 400:
            raise HTTPException(response.status_code, _error_message(response))
        return response.json()

    async def get_account(self) -> dict:
        return await self._request("GET", self.settings.alpaca_endpoint, "/v2/account")

    async def get_positions(self) -> list[dict]:
        return await self._request("GET", self.settings.alpaca_endpoint, "/v2/positions")

    async def get_asset(self, symbol_or_id: str) -> dict:
        symbol = quote(symbol_or_id, safe="")
        return await self._request("GET", self.settings.alpaca_endpoint, f"/v2/assets/{symbol}")

    async def get_open_buy_orders(self) -> list[dict]:
        orders = await self._request(
            "GET",
            self.settings.alpaca_endpoint,
            "/v2/orders",
            params={"status": "open", "direction": "desc", "limit": "100"},
        )
        return [order for order in orders if order.get("side") == "buy"]

    async def get_clock(self) -> dict:
        return await self._request("GET", self.settings.alpaca_endpoint, "/v2/clock")

    async def get_cash_activities(self) -> list[dict]:
        params = {"activity_types": "CSD,CSW", "direction": "asc", "page_size": "100"}
        return await self._request(
            "GET", self.settings.alpaca_endpoint, "/v2/account/activities", params=params
        )

    async def get_fill_activities(self, symbol: str, after: str) -> list[dict]:
        fills: list[dict] = []
        page_token: Optional[str] = None
        while True:
            params = {
                "activity_types": "FILL",
                "after": after,
                "direction": "asc",
                "page_size": "100",
            }
            if page_token:
                params["page_token"] = page_token
            page = await self._request(
                "GET",
                self.settings.alpaca_endpoint,
                "/v2/account/activities",
                params=params,
            )
            if not page:
                break
            fills.extend(item for item in page if item.get("symbol") == symbol)
            if len(page) < 100 or not page[-1].get("id"):
                break
            page_token = page[-1]["id"]
        return fills

    async def place_order(self, payload: dict) -> dict:
        return await self._request(
            "POST", self.settings.alpaca_endpoint, "/v2/orders", json=payload
        )

    async def get_stock_bars(self, symbols: list[str], start: str, end: Optional[str] = None) -> dict:
        params = {
            "symbols": ",".join(symbols),
            "timeframe": "1Day",
            "start": start,
            "adjustment": "all",
            "feed": "iex",
            "limit": "10000",
        }
        if end:
            params["end"] = end
        return await self._request(
            "GET",
            self.settings.alpaca_data_endpoint,
            "/v2/stocks/bars",
            params=params,
        )


def _error_message(response: httpx.Response) -> str:
    try:
        data = response.json()
    except ValueError:
        return response.text or response.reason_phrase
    return data.get("message") or data.get("error") or str(data)
