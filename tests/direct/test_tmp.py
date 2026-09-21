def test_dump(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/recallline.py")
    print("\nGL_DIR_IN_VM:", dir(contract._context.gl))
    try:
        getter = getattr(contract._context.gl, "get_contract_at", None) or contract._context.gl.contract.get_at
        stub = getter(direct_alice)
        print("\nSTUB_DIR:", dir(stub))
    except Exception as e:
        print(e)
    assert False
