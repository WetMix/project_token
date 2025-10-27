const Token = artifacts.require("./Token.sol");

contract("Token", accounts => {
  const creator = accounts[0];
  const user = accounts[1];

  it("assigns balance when created", async () => {
    const totalSupply = 10000n * BigInt(1e18);
    const instance = await Token.new("HelloToken", "HELLO", totalSupply, { from: creator });

    const balance = await instance.balanceOf.call(creator).then(BigInt);
    assert.equal(balance, totalSupply);

    const events = await instance.getPastEvents('Transfer');
    assert.equal(events.length, 1);
  });

  it("mint by owner works", async () => {
    const totalSupply = 10000n * BigInt(1e18);
    const instance = await Token.new("HelloToken", "HELLO", totalSupply, { from: creator });

    const mintedAmount = 10n * BigInt(1e18);
    const tx = await instance.mint(user, mintedAmount, { from: creator });

    assert.equal(tx.logs[0].event, 'Transfer');
    assert.equal(tx.logs[0].args.from, '0x0000000000000000000000000000000000000000');
    assert.equal(tx.logs[0].args.to, user);
    assert.equal(BigInt(tx.logs[0].args.value), mintedAmount);
  });
});


