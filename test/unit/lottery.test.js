const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery", async () => {
          let deployer
          let Lottery
          let vrfCoordinatorV2Mock
          let interval
          let player
          let winnerStartingBalance
          const etherAmt = ethers.utils.parseEther("0.25")

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              player = accounts[1]
              await deployments.fixture(["all"])
              Lottery = await ethers.getContract("Lottery")
              LotteryPlayer = Lottery.connect(player)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2_5Mock")
              interval = await Lottery.getInterval()
          })

          describe("constructor", async () => {
              it("Sets the ticket Price ", async () => {
                  const response = await Lottery.getticketPrice()
                  assert.equal(
                      response.toString(),
                      networkConfig[network.config.chainId]["ticketPrice"]
                  )
              })
              it("Sets the keyHash", async () => {
                  const response = await Lottery.getkeyHash()
                  assert.equal(
                      response.toString(),
                      networkConfig[network.config.chainId]["keyHash"]
                  )
              })
              it("Sets the callbackGasLimit ", async () => {
                  const response = await Lottery.getcallbackGasLimit()
                  assert.equal(
                      response.toString(),
                      networkConfig[network.config.chainId]["callbackGasLimit"]
                  )
              })
              it("Sets the interval", async () => {
                  assert.equal(
                      interval.toString(),
                      networkConfig[network.config.chainId]["interval"]
                  )
              })
              it("Sets the Lottery Open", async () => {
                  const response = await Lottery.getLotteryState()
                  assert.equal(response.toString(), "0")
              })
          })
          describe("EnterLottery", async () => {
              it("Reverts if entrance fee is not paid", async () => {
                  await expect(
                      Lottery.EnterLottery({ value: ethers.utils.parseEther("0.20") })
                  ).to.be.revertedWith("Lottery__NotEnoughETHforTicket")
              })
              it("Reverts if the Lottery is closed", async () => {
                  await Lottery.EnterLottery({ value: ethers.utils.parseEther("0.25") })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  await Lottery.performUpkeep("0x")
                  await expect(
                      Lottery.EnterLottery({ value: ethers.utils.parseEther("0.25") })
                  ).to.be.revertedWith("Lottery__Closed")
              })
              it("Adds the sender to the funder array ", async () => {
                  await LotteryPlayer.EnterLottery({
                      value: etherAmt,
                  })
                  const contractPlayer = await LotteryPlayer.getPlayers(0)
                  assert.equal(player.address, contractPlayer)
              })
              it("Emits an event when player enters the lottery", async () => {
                  expect(await LotteryPlayer.EnterLottery({ value: etherAmt })).to.emit(
                      LotteryPlayer,
                      "LotteryEnter"
                  )
              })
          })
          describe("CheckupKeep", async () => {
              it("return false if people havent send any eth", async () => {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await LotteryPlayer.callStatic.checkUpkeep([])
                  assert(!upkeepNeeded)
              })
              it("returns false if lottery is closed", async () => {
                  await LotteryPlayer.EnterLottery({ value: etherAmt })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await LotteryPlayer.performUpkeep([])
                  const lotteryState = await LotteryPlayer.getLotteryState()
                  const upkeepNeeded = await LotteryPlayer.callStatic.checkUpkeep([])
                  assert.equal(lotteryState.toString(), "1")
                  assert.equal(upkeepNeeded[0], false)
              })
              it("returns false if enough time has not passed", async () => {
                  await LotteryPlayer.EnterLottery({ value: etherAmt })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() - 5])
                  await network.provider.send("evm_mine", [])
                  const upkeepNeeded = await LotteryPlayer.callStatic.checkUpkeep([])
                  assert.equal(upkeepNeeded[0], false)
              })
              it("returns true if all the upkeepconditions are satisfied", async () => {
                  await LotteryPlayer.EnterLottery({ value: etherAmt })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const upkeepNeeded = await LotteryPlayer.callStatic.checkUpkeep([])
                  assert.equal(upkeepNeeded[0], true)
              })
          })
          describe("performUpkeep", async () => {
              it("is only performed when checkupkeep is true", async () => {
                  await LotteryPlayer.EnterLottery({ value: etherAmt })
                  await network.provider.send("evm_increaseTime", [interval + 1])
                  await network.provider.send("evm_mine", [])
                  response = await LotteryPlayer.performUpkeep([])
                  assert(response)
              })
              it("is not perfomed when the checkupkeep is false", async () => {
                  await expect(LotteryPlayer.performUpkeep([])).to.be.revertedWith(
                      "Lottery__upKeepNotNeeded"
                  )
              })
              it("sets the lottery state and emits an event with requestId", async () => {
                  await LotteryPlayer.EnterLottery({ value: etherAmt })
                  await network.provider.send("evm_increaseTime", [interval + 1])
                  await network.provider.send("evm_mine", [])
                  const response = await LotteryPlayer.performUpkeep([])
                  const reciept = await response.wait(1)
                  const requestId = reciept.events[1].args.requestId
                  const lotteryState = await LotteryPlayer.getLotteryState()
                  assert(requestId.toNumber() > 0)
                  assert.equal(lotteryState.toString(), "1")
              })
          })
          describe("fulfillRandomWords", async () => {
              beforeEach(async () => {
                  await LotteryPlayer.EnterLottery({ value: etherAmt })
                  await network.provider.send("evm_increaseTime", [interval + 1])
                  await network.provider.send("evm_mine", [])
              })
              it("can only be called after performupkeep", async () => {
                  await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, LotteryPlayer.address)).to
                      .be.reverted
                  await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1, LotteryPlayer.address)).to
                      .be.reverted
              })
              it("picks the winner, resets the lottery and sends the money", async () => {
                  const contractBalanceBefore = await ethers.provider.getBalance(
                      LotteryPlayer.address
                  )
                  console.log(
                      "Contract balance before upkeep:",
                      ethers.utils.formatEther(contractBalanceBefore)
                  )
                  const signers = await ethers.getSigners()
                  const numberofPlayers = 3
                  const startingindex = 2 // 0 is the owner , 1 is already a player
                  for (i = startingindex; i <= startingindex + numberofPlayers; i++) {
                      const connectedAccount = await Lottery.connect(signers[i])
                      await connectedAccount.EnterLottery({ value: etherAmt })
                  }
                  const startingTimeStamp = await LotteryPlayer.getLatestTimestamp()
                  const entranceFee = await LotteryPlayer.getticketPrice()
                  await new Promise(async (resolve, reject) => {
                      LotteryPlayer.once("WinnerPicked", async () => {
                          console.log("Listner heard")
                          try {
                              const recentWinner = await LotteryPlayer.getRecentWinner()
                              console.log("recentWinner")
                              console.log(await recentWinner)
                              console.log("players")
                              for (i = 1; i <= 1 + numberofPlayers; i++) {
                                  console.log(signers[i].address)
                              }
                              const lotteryState = await LotteryPlayer.getLotteryState()
                              const endingTimeStamp = await LotteryPlayer.getLatestTimestamp()
                              const numPlayers = await LotteryPlayer.getNumPlayers()
                              const winner_endBal = await accounts[2].getBalance()
                              assert.equal(numPlayers.toString(), 0)
                              assert.equal(lotteryState.toString(), 0)
                              assert.equal(
                                  winner_endBal.toString(),
                                  winnerStartingBalance // startingBalance + ( (raffleEntranceFee * additionalEntrances) + raffleEntranceFee )
                                      .add(entranceFee.mul(numberofPlayers + 1).add(entranceFee))
                                      .toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              reject(error)
                          }
                      })
                      try {
                          const response = await LotteryPlayer.performUpkeep([])
                          const reciept = await response.wait(1)
                          winnerStartingBalance = await accounts[2].getBalance()
                          requestid = reciept.events[1].args.requestId
                          console.log(requestid)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestid,
                              LotteryPlayer.address
                          )
                      } catch (e) {
                          reject(e)
                      }
                  })
              })
          })
      })
