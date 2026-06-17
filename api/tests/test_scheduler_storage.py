import os
from datetime import date

import pytest

from api import storage
from api.config import Settings


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
