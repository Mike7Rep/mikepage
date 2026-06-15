from datetime import date

from api import storage
from api.config import Settings


def test_existing_weekly_run_prevents_duplicate(tmp_path):
    settings = Settings(db_path=str(tmp_path / "audit.sqlite3"))
    storage.init_db(settings)
    original = storage.get_settings
    storage.get_settings = lambda: settings
    try:
        run_id = storage.create_run("weekly", date(2026, 6, 17))
        found = storage.existing_run("weekly", date(2026, 6, 17))
    finally:
        storage.get_settings = original
    assert run_id > 0
    assert found is not None
    assert found["kind"] == "weekly"
