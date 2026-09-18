"""Optional Studio Next smoke. Direct tests remain the CI gate."""

import os

import pytest


@pytest.mark.skipif(
    not os.environ.get("RECALLINE_INTEGRATION"),
    reason="set RECALLINE_INTEGRATION=1 to hit studio-dev",
)
def test_placeholder_integration():
    assert os.environ.get("NEXT_PUBLIC_CONTRACT_ADDRESS")
