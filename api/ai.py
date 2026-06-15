from __future__ import annotations

import asyncio
from typing import Optional

from fastapi import HTTPException, status
from openai import OpenAI

from .config import Settings, get_settings
from .schemas import AssetAnalysis


SYSTEM_PROMPT = """
Du bewertest Assets fuer eine Buy-and-Hold Strategie. Nutze nur die gelieferten
Daten. Gib keine Order frei, sondern bewerte Qualitaet, Risiko, Marktbild und
Zukaufattraktivitaet. Sei konservativ bei fehlenden Daten.
""".strip()


async def analyze_with_ai(context: dict, settings: Optional[Settings] = None) -> AssetAnalysis:
    settings = settings or get_settings()
    if settings.ai_mock:
        return _mock_analysis(context["symbol"])
    if not settings.openai_api_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "OPENAI_API_KEY missing")

    client = OpenAI(api_key=settings.openai_api_key)
    return await asyncio.to_thread(_parse_response, client, settings, context)


def _parse_response(client: OpenAI, settings: Settings, context: dict) -> AssetAnalysis:
    response = client.responses.parse(
        model=settings.openai_model,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _prompt(context)},
        ],
        text_format=AssetAnalysis,
    )
    analysis = response.output_parsed
    if not analysis:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "OpenAI returned no parsed analysis")
    return analysis


def _prompt(context: dict) -> str:
    return (
        "Bewerte dieses Asset als JSON nach Schema. Ziel: Buy-and-Hold, "
        "schnelles Kapitalwachstum, aber keine Spekulation ohne Daten.\n"
        f"Kontext: {context}"
    )


def _mock_analysis(symbol: str) -> AssetAnalysis:
    return AssetAnalysis(
        symbol=symbol,
        rating=72,
        action="hold",
        confidence=0.68,
        market_outlook="neutral",
        undervaluation_score=0.52,
        risk_score=0.38,
        target_notional_pct=0,
        rationale="Mock-Bewertung fuer lokale Tests ohne OpenAI-Key.",
        risks=["AI_MOCK_RESPONSES ist aktiv"],
    )
