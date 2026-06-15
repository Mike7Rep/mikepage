from __future__ import annotations

import asyncio
import json
import sys

from .storage import init_db
from .trading_service import evaluate_weekly


async def main() -> int:
    init_db()
    result = await evaluate_weekly(execute=True, force=False)
    print(json.dumps(result.model_dump(mode="json"), ensure_ascii=True))
    return 1 if result.status == "failed" else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
