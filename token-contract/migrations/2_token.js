 const Token = artifacts.require("./Token.sol");
 module.exports = async function (deployer) {
     const deployment = deployer.deploy(Token, "HelloToken", "HELL0", 10000n * 
BigInt(1e18));
     const instance = await deployment.await
     const newOwner = '0x44EFaa9ce0D549E81C9bB9A4DEb234119A7c4333'
     await instance.transferOwnership(newOwner)
 };

