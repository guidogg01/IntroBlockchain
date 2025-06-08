const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const Factory = await hre.ethers.getContractFactory("MyERC1155");
  const contract = await Factory.deploy();

  // ⚠️ ethers v6: espera a que termine el deploy
  await contract.waitForDeployment();

  // Obtenés la dirección desplegada en `target`, o con getAddress()
  console.log("MyERC1155 deployed to:", contract.target);
  // o bien:
  // console.log("MyERC1155 deployed to:", await contract.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
