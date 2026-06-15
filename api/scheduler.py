from __future__ import annotations

from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from .config import get_settings
from .trading_service import evaluate_weekly


def start_scheduler() -> Optional[AsyncIOScheduler]:
    settings = get_settings()
    if not settings.scheduler_enabled:
        return None

    scheduler = AsyncIOScheduler(timezone=settings.schedule_timezone)
    scheduler.add_job(
        evaluate_weekly,
        CronTrigger(
            day_of_week="wed",
            hour=settings.schedule_hour,
            minute=settings.schedule_minute,
            timezone=settings.schedule_timezone,
        ),
        kwargs={"execute": True, "force": False},
        id="weekly_asset_review",
        replace_existing=True,
    )
    scheduler.start()
    return scheduler
