import os
import pytest
from backend.app.background_workers import repo_sentry

def test_repo_sentry_lifecycle(tmp_path):
    repo_dir = str(tmp_path / "test_repo")
    os.makedirs(repo_dir, exist_ok=True)
    
    # 1. Add repo with an echo test command
    repo_id = repo_sentry.add_repo(
        path=repo_dir,
        test_cmd="python -c \"print('All good')\"",
        auto_commit=False,
        interval_minutes=0
    )
    assert repo_id is not None
    
    # 2. Check repo is listed
    repos = repo_sentry.get_repos()
    match = [r for r in repos if r["id"] == repo_id]
    assert len(match) == 1
    assert match[0]["path"] == os.path.abspath(repo_dir)

    # 3. Trigger manual scan
    res = repo_sentry.scan_repo(repo_id)
    assert res.get("status") == "clean"

    # 4. Remove repo
    repo_sentry.remove_repo(repo_id)
    repos_after = repo_sentry.get_repos()
    assert not any(r["id"] == repo_id for r in repos_after)
