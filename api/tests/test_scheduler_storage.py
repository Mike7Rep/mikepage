import os
from datetime import date

import pytest

from api import scheduler
from api import storage
from api.config import Settings


def test_scheduler_runs_weekly_review_on_sunday(monkeypatch):
    captured = {}

    class FakeScheduler:
        def __init__(self, timezone):
            captured["timezone"] = timezone

        def add_job(self, *_args, **kwargs):
            captured["trigger"] = _args[1]
            captured["kwargs"] = kwargs

        def start(self):
            captured["started"] = True

    def fake_trigger(**kwargs):
        captured["trigger_kwargs"] = kwargs
        return kwargs

    monkeypatch.setattr(scheduler, "get_settings", lambda: Settings(scheduler_enabled=True))
    monkeypatch.setattr(scheduler, "AsyncIOScheduler", FakeScheduler)
    monkeypatch.setattr(scheduler, "CronTrigger", fake_trigger)

    assert scheduler.start_scheduler() is not None
    assert captured["trigger_kwargs"]["day_of_week"] == "sun"
    assert captured["started"] is True


def test_existing_weekly_run_prevents_duplicate():
    database_url = os.getenv("TEST_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not database_url:
        pytest.skip("Postgres DATABASE_URL missing")

    settings = Settings(database_url=database_url)
    original = storage.get_settings
    storage.get_settings = lambda: settings
    try:
        with storage.connect(settings) as conn:
            conn.execute("delete from reviews")
            conn.execute("delete from runs")
        storage.init_db(settings)
        run_id = storage.create_run("weekly", date(2026, 6, 17))
        found = storage.existing_run("weekly", date(2026, 6, 17))
    finally:
        storage.get_settings = original
    assert run_id > 0
    assert found is not None
    assert found["kind"] == "weekly"


def test_strategy_version_is_saved_and_loaded():
    database_url = os.getenv("TEST_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not database_url:
        pytest.skip("Postgres DATABASE_URL missing")

    settings = Settings(database_url=database_url)
    original = storage.get_settings
    storage.get_settings = lambda: settings
    try:
        with storage.connect(settings) as conn:
            conn.execute("delete from strategy_versions")
        saved = storage.save_strategy_version(None, {"summary": "Test strategy"}, "Test rationale")
        loaded = storage.latest_strategy_version()
    finally:
        storage.get_settings = original

    assert saved["version"] > 0
    assert loaded is not None
    assert loaded["summary"] == "Test strategy"
