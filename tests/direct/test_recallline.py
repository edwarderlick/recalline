from __future__ import annotations

import json

import pytest

from tests.direct.conftest import (
    NDC,
    NDC2,
    WEI,
    deploy_funded,
    empty_fda,
    load_fix,
    mock_fda,
)

START = "2026-03-04T00:00:00Z"
END = "2026-03-08T00:00:00Z"
PREMIUM = 100 * WEI
POOL = 10_000 * WEI


def _buy(direct_vm, contract, template="DRUG_NDC", key=NDC, premium=PREMIUM, start=START, end=END):
    direct_vm.value = premium
    cid = contract.buy_cover(template, key, start, end)
    direct_vm.value = 0
    return cid


def test_five_concurrent_buy_cover_distinct_hash_ids(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    ids = [_buy(direct_vm, contract) for _ in range(5)]
    assert len(ids) == 5
    assert len(set(ids)) == 5
    for i in ids:
        assert str(i).startswith("0x")
        assert len(str(i)) == 66
        assert "COVER-" not in str(i).upper()
        assert "0001" not in str(i)[:10]


def test_buy_inside_window_reverts(direct_vm, direct_deploy, direct_alice):
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    direct_vm.warp("2026-03-05T00:00:00Z")
    with direct_vm.expect_revert("buy before window_start - 24h"):
        _buy(direct_vm, contract)


def test_buy_less_than_24h_before_start_reverts(direct_vm, direct_deploy, direct_alice):
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    direct_vm.warp("2026-03-03T12:00:00Z")
    with direct_vm.expect_revert("buy before window_start - 24h"):
        _buy(direct_vm, contract)


def test_window_over_14_days_reverts(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    with direct_vm.expect_revert("window length 1..14 days"):
        _buy(direct_vm, contract, end="2026-03-19T00:00:00Z")


def test_vague_drug_name_reverts(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    with direct_vm.expect_revert("DRUG_NAME requires brand AND generic"):
        _buy(direct_vm, contract, template="DRUG_NAME", key="ibuprofen")


def test_bad_ndc_and_empty_device_reverts(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    with direct_vm.expect_revert("bad NDC"):
        _buy(direct_vm, contract, key="12")
    with direct_vm.expect_revert("empty product_key"):
        _buy(direct_vm, contract, template="DEVICE_PRODUCT_CODE", key="")
    with direct_vm.expect_revert("empty device code"):
        _buy(direct_vm, contract, template="DEVICE_PRODUCT_CODE", key="ab")


def test_buy_empty_pool_reverts(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    empty_fda(direct_vm)
    contract = direct_deploy("contracts/recallline.py")
    direct_vm.sender = direct_alice
    direct_vm.deal(direct_alice, POOL)
    with direct_vm.expect_revert("pool_available < reserve"):
        _buy(direct_vm, contract)


def test_lookback_class_i_ii_reverts(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    mock_fda(direct_vm, load_fix("lookback_class_i.json"))
    with direct_vm.expect_revert("lookback Class I/II"):
        _buy(direct_vm, contract)


def test_fund_then_buy_reserves_capacity(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    eco0 = contract.get_economics()
    assert eco0["pool_deposited"] == POOL
    assert eco0["pool_available"] == POOL
    cid = _buy(direct_vm, contract)
    eco = contract.get_economics()
    assert eco["pool_reserved"] == 2 * PREMIUM
    assert eco["open_premiums"] == PREMIUM
    assert eco["pool_available"] == POOL - 2 * PREMIUM
    assert eco["treasury"] == 0
    cover = contract.get_cover(cid)
    assert cover["status"] == "OPEN"
    assert cover["id"] == cid
    assert cover["hit_i_mult"] == 3
    assert cover["hit_ii_mult"] == 2


def _open_then_settle(direct_vm, direct_deploy, direct_alice, fixture: str, key=NDC):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    cid = _buy(direct_vm, contract, key=key)
    mock_fda(direct_vm, load_fix(fixture))
    direct_vm.warp("2026-03-08T00:00:01Z")
    contract.settle(cid)
    return contract, cid


def test_class_i_hit_3x_balances_move(direct_vm, direct_deploy, direct_alice):
    contract, cid = _open_then_settle(direct_vm, direct_deploy, direct_alice, "class_i_ndc.json")
    cover = contract.get_cover(cid)
    assert cover["status"] == "HIT"
    assert cover["classification"] == "Class I"
    assert cover["payout"] == 3 * PREMIUM
    assert "Particulate matter" in cover["match_reason"]
    eco = contract.get_economics()
    assert eco["pool_reserved"] == 0
    assert eco["open_premiums"] == 0
    assert eco["pool_deposited"] == POOL - 2 * PREMIUM


def test_class_ii_hit_2x(direct_vm, direct_deploy, direct_alice):
    contract, cid = _open_then_settle(
        direct_vm, direct_deploy, direct_alice, "class_ii_ndc.json", key=NDC2
    )
    cover = contract.get_cover(cid)
    assert cover["status"] == "HIT"
    assert cover["classification"] == "Class II"
    assert cover["payout"] == 2 * PREMIUM
    eco = contract.get_economics()
    assert eco["pool_deposited"] == POOL - PREMIUM


def test_class_iii_only_nohit_premium_stays(direct_vm, direct_deploy, direct_alice):
    contract, cid = _open_then_settle(direct_vm, direct_deploy, direct_alice, "class_iii_ndc.json")
    cover = contract.get_cover(cid)
    assert cover["status"] == "NOHIT"
    assert cover["payout"] == 0
    eco = contract.get_economics()
    assert eco["pool_deposited"] == POOL + PREMIUM
    assert eco["pool_reserved"] == 0
    assert eco["open_premiums"] == 0


def test_no_match_nohit(direct_vm, direct_deploy, direct_alice):
    contract, cid = _open_then_settle(direct_vm, direct_deploy, direct_alice, "empty.json")
    assert contract.get_cover(cid)["status"] == "NOHIT"


def test_oversize_missing_meta_non_json_insufficient_refund(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)

    cid = _buy(direct_vm, contract)
    mock_fda(direct_vm, "x" * (33 * 1024))
    direct_vm.warp("2026-03-08T00:00:01Z")
    contract.settle(cid)
    assert contract.get_cover(cid)["status"] == "INSUFFICIENT"
    assert contract.get_cover(cid)["refund"] == PREMIUM
    assert contract.get_economics()["pool_reserved"] == 0

    direct_vm.warp("2026-03-01T00:00:00Z")
    empty_fda(direct_vm)
    cid2 = _buy(direct_vm, contract)
    mock_fda(direct_vm, load_fix("missing_meta.json"))
    direct_vm.warp("2026-03-08T00:00:01Z")
    contract.settle(cid2)
    assert contract.get_cover(cid2)["status"] == "INSUFFICIENT"

    direct_vm.warp("2026-03-01T00:00:00Z")
    empty_fda(direct_vm)
    cid3 = _buy(direct_vm, contract)
    mock_fda(direct_vm, "not-json{")
    direct_vm.warp("2026-03-08T00:00:01Z")
    contract.settle(cid3)
    assert contract.get_cover(cid3)["status"] == "INSUFFICIENT"
    eco = contract.get_economics()
    assert eco["open_premiums"] == 0
    assert eco["pool_reserved"] == 0


def test_wrong_ndc_nohit_not_hit(direct_vm, direct_deploy, direct_alice):
    contract, cid = _open_then_settle(direct_vm, direct_deploy, direct_alice, "wrong_ndc.json")
    cover = contract.get_cover(cid)
    assert cover["status"] == "NOHIT"
    assert cover["payout"] == 0


def test_cancel_before_start_refunds(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    cid = _buy(direct_vm, contract)
    contract.cancel(cid)
    cover = contract.get_cover(cid)
    assert cover["status"] == "CANCELED"
    assert cover["refund"] == PREMIUM
    assert contract.get_credit(cover["buyer"]) == PREMIUM
    assert contract.get_economics()["pool_reserved"] == 0
    assert contract.get_economics()["pool_deposited"] == POOL
    assert contract.get_economics()["credits_outstanding"] == PREMIUM


def test_cancel_after_start_reverts(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    cid = _buy(direct_vm, contract)
    direct_vm.warp("2026-03-04T00:00:00Z")
    with direct_vm.expect_revert("now < window_start"):
        contract.cancel(cid)


def test_settle_before_end_reverts(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    cid = _buy(direct_vm, contract)
    direct_vm.warp("2026-03-07T00:00:00Z")
    with direct_vm.expect_revert("now >= window_end"):
        contract.settle(cid)


def test_settle_twice_reverts(direct_vm, direct_deploy, direct_alice):
    contract, cid = _open_then_settle(direct_vm, direct_deploy, direct_alice, "class_i_ndc.json")
    with direct_vm.expect_revert("OPEN only"):
        contract.settle(cid)


def test_expire_before_grace_reverts_after_grace_refunds(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    cid = _buy(direct_vm, contract)
    direct_vm.warp("2026-03-10T00:00:00Z")
    with direct_vm.expect_revert("now >= expire_at"):
        contract.expire(cid)
    direct_vm.warp("2026-03-15T00:00:00Z")
    contract.expire(cid)
    cover = contract.get_cover(cid)
    assert cover["status"] == "EXPIRED"
    assert cover["refund"] == PREMIUM
    assert contract.get_credit(cover["buyer"]) == PREMIUM
    assert contract.get_economics()["pool_reserved"] == 0
    assert contract.get_economics()["credits_outstanding"] == PREMIUM


def test_fake_id_cannot_withdraw_or_settle(direct_vm, direct_deploy, direct_alice, direct_bob):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    with direct_vm.expect_revert("unknown cover"):
        contract.settle("0x" + "ab" * 32)
    with direct_vm.prank(direct_bob):
        with direct_vm.expect_revert("no credit"):
            contract.withdraw()


def test_transfer_fail_credits_withdraw_keeps_on_fail(direct_vm, direct_deploy, direct_alice):
    fail = {"on": True}

    def hook(_vm, request):
        blob = str(request)
        if fail["on"] and ("PostMessage" in blob or "EmitInternalMessage" in blob):
            raise RuntimeError("ghost fail")
        return {"ok": None}

    direct_vm._gl_call_hook = hook
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    cid = _buy(direct_vm, contract)
    mock_fda(direct_vm, load_fix("class_i_ndc.json"))
    direct_vm.warp("2026-03-08T00:00:01Z")
    contract.settle(cid)
    cover = contract.get_cover(cid)
    assert cover["status"] == "HIT"
    buyer = cover["buyer"]
    credited = contract.get_credit(buyer)
    assert credited == 3 * PREMIUM
    eco = contract.get_economics()
    assert eco["credits_outstanding"] == 3 * PREMIUM

    with direct_vm.expect_revert("ghost fail"):
        contract.withdraw()
    assert contract.get_credit(buyer) == 3 * PREMIUM

    fail["on"] = False
    contract.withdraw()
    assert contract.get_credit(buyer) == 0
    with direct_vm.expect_revert("no credit"):
        contract.withdraw()


def test_scan_ten_results_considers_earlier_entries(direct_vm, direct_deploy, direct_alice):
    contract, cid = _open_then_settle(
        direct_vm, direct_deploy, direct_alice, "ten_rows_early_hit.json"
    )
    cover = contract.get_cover(cid)
    assert cover["status"] == "HIT"
    assert cover["classification"] == "Class I"
    assert cover["payout"] == 3 * PREMIUM


def test_kind_template_cannot_change_multipliers(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    cid = _buy(direct_vm, contract)
    cover = contract.get_cover(cid)
    assert cover["hit_i_mult"] == 3
    assert cover["hit_ii_mult"] == 2
    eco = contract.get_economics()
    assert eco["treasury"] == 0


def test_buyer_cannot_pass_url(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    with direct_vm.expect_revert("buyer cannot pass a URL"):
        _buy(direct_vm, contract, key="https://api.fda.gov/drug/enforcement.json")


def test_list_ids_matches_get_cover_ids(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    a = _buy(direct_vm, contract)
    b = _buy(direct_vm, contract, key=NDC2)
    assert contract.list_ids() == contract.get_cover_ids()
    assert set(contract.list_ids()) == {a, b}

def test_source_failure_on_lookback_fails_closed(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    
    # Mock FDA to return INSUFFICIENT for lookback
    import json
    direct_vm.clear_mocks()
    direct_vm.mock_web(
        r".*api\.fda\.gov.*",
        {"status": 404, "body": json.dumps({"error": {"code": "NOT_FOUND", "message": "No matches found!"}})}
    )
    
    direct_vm.value = 100 * 10**18
    with direct_vm.expect_revert("lookback insufficient evidence"):
        contract.buy_cover("DEVICE_PRODUCT_CODE", "9999", "2026-03-04T00:00:00Z", "2026-03-08T00:00:00Z")
    direct_vm.value = 0

def test_pagination_finds_hit_on_second_page(direct_vm, direct_deploy, direct_alice):
    import json
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    cid = _buy(direct_vm, contract)
    
    direct_vm.clear_mocks()
    # Page 1: Empty results
    direct_vm.mock_web(
        r".*skip=0.*",
        {"status": 200, "body": json.dumps({"meta": {"results": {"skip": 0, "limit": 100, "total": 150}}, "results": [{}] * 100})}
    )
    
    # Page 2: Contains hit
    direct_vm.mock_web(
        r".*skip=100.*",
        {"status": 200, "body": json.dumps({"meta": {"results": {"skip": 100, "limit": 100, "total": 150}}, "results": [
            {
                "classification": "Class I",
                "product_ndc": "0069-4210-66",
                "status": "Ongoing",
                "recall_initiation_date": "20260305",
                "report_date": "20260306",
                "recall_number": "D-1234-5"
            }
        ]})}
    )
    
    direct_vm.warp("2026-03-08T00:00:01Z")
    contract.settle(cid)
    cover = contract.get_cover(cid)
    assert cover["status"] == "HIT"
    assert cover["classification"] == "Class I"

def test_validator_disagreement(direct_vm, direct_deploy, direct_alice):
    direct_vm.warp("2026-03-01T00:00:00Z")
    contract = deploy_funded(direct_vm, direct_deploy, direct_alice)
    cid = _buy(direct_vm, contract)
    
    mock_fda(direct_vm, load_fix("class_i_ndc.json"))
    
    import sys
    import genlayer as gl
    gl_vm = sys.modules.get("genlayer.vm") or sys.modules.get("genlayer.gl.vm")
    
    run_func = getattr(gl_vm, "run_nondet_default", None) or getattr(gl_vm, "run_nondet")
    
    disagreed = []
    def override_run_nondet(leader_fn, validator_fn):
        res = run_func(leader_fn, validator_fn)
        # Validator fn should reject a bad result
        if not validator_fn(gl.vm.Return({"kind": "INSUFFICIENT"})):
            disagreed.append(True)
        return res
        
    try:
        gl_vm.run_nondet_default = override_run_nondet
        gl_vm.run_nondet = override_run_nondet
        
        direct_vm.warp("2026-03-08T00:00:01Z")
        contract.settle(cid)
        
        assert len(disagreed) > 0
    finally:
        gl_vm.run_nondet_default = run_func
        gl_vm.run_nondet = run_func
