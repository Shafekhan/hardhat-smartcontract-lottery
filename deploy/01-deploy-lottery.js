const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId
    const networkParams = networkConfig[chainId]

    if (!networkParams) {
        console.error(`No network configuration found for chainId: ${chainId}`)
        process.exit(1)
    }

    log("Starting deployment...")

    let MockvrfCoordinatorAddress, subscriptionId

    if (developmentChains.includes(network.name)) {
        const MockvrfCoordinator = await ethers.getContract("VRFCoordinatorV2_5Mock")
        MockvrfCoordinatorAddress = MockvrfCoordinator.address

        const transactionResponse = await MockvrfCoordinator.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)
        subscriptionId = transactionReceipt.events[0].args.subId

        await MockvrfCoordinator.fundSubscription(subscriptionId, ethers.utils.parseEther("5"))
    } else {
        MockvrfCoordinatorAddress = networkParams.vrfCoordinatorV2
        subscriptionId = networkParams.subscriptionId
    }

    const ticketPrice = networkParams.ticketPrice
    const keyHash = networkParams.keyHash
    const callbackGasLimit = networkParams.callbackGasLimit
    const interval = networkParams.interval

    const args = [
        MockvrfCoordinatorAddress,
        ticketPrice,
        keyHash,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]

    log("Constructor Arguments:", args)

    const Lottery = await deploy("Lottery", {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (developmentChains.includes(network.name)) {
        const MockvrfCoordinator = await ethers.getContract("VRFCoordinatorV2_5Mock")
        await MockvrfCoordinator.addConsumer(subscriptionId, Lottery.address)
    }

    if (!developmentChains.includes(network.name)) {
        await verify(Lottery.address, args)
    }
}

module.exports.tags = ["all", "Lottery"]
