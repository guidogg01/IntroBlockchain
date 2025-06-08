require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.28",
  networks: {
    // Hardhat local, siempre disponible
    hardhat: {},

    // Tu red Sepolia
    sepolia: {
      url: process.env.ALCHEMY_KEY || "",       // ej: https://eth-sepolia.g.alchemy.com/v2/tu_key
      accounts:
        process.env.PRIVATE_KEY?.length > 0
          ? [process.env.PRIVATE_KEY]
          : [],                                   // tu private key con 0x delante
    },
  },
};
