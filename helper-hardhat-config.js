const { ethers } = require("hardhat")

const networkConfig = {
    11155111: {
        name: "Sepolia",
        vrfCoordinatorV2: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
        ticketPrice: ethers.utils.parseEther("0.01"),
        keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
        subscriptionId:
            "7703609317906008247899184035322382920123098252118640800638944735701946943783",
        callbackGasLimit: "500000",
        interval: "30",
    },
    31337: {
        name: "hardhat",
        ticketPrice: ethers.utils.parseEther("0.25"),
        keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
        callbackGasLimit: "500000",
        interval: "30",
    },
}

const developmentChains = ["hardhat", "localhost"]
const frontEndContractsFile = "../nextjs-smartcontract-lottery/constants/contractAddresses.json"
const frontEndAbiFile = "../nextjs-smartcontract-lottery/constants/abi.json"

module.exports = {
    networkConfig,
    developmentChains,
    frontEndContractsFile,
    frontEndAbiFile,
}
