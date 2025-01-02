// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

error Lottery__NotEnoughETHforTicket();
error Lottery__TransactionFailed();
error Lottery__Closed();
error Lottery__upKeepNotNeeded(uint256 currentBal, uint256 numberOfPlayers, uint256 lotteryState);

/**
 * @title A Ethereum Lottery Smart Contract
 * @author Shafe ali khan
 * @notice This is a smart contract for creating a Fair and Random Lottery
 * @dev This implements Chainlink VRF for ensuring the randomness and Chainlink Keepers for the automation of the Lottery
 */

contract Lottery is VRFConsumerBaseV2Plus, AutomationCompatibleInterface {
    /* enums */
    enum LotteryState {
        OPEN,
        CALCULATING
    }

    /* State variables */
    uint256 private immutable i_ticketPrice;
    address payable[] private s_players;
    bytes32 private immutable i_keyHash;
    uint256 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATION = 3;
    uint32 private constant NUM_WORDS = 1;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    /*  Lottery Variables */
    address private s_recentWinner;
    LotteryState private s_LotteryState;

    /* Events */
    event LotteryEnter(address indexed player);
    event RequestedLotteryWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    /* Functions */
    constructor(
        address vrfCoordinatorV2,
        uint256 ticketPrice,
        bytes32 keyHash,
        uint256 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2Plus(vrfCoordinatorV2) {
        i_ticketPrice = ticketPrice;
        i_keyHash = keyHash;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_LotteryState = LotteryState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    function checkUpkeep(
        bytes memory /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory /* performData */) {
        bool isOpen = (s_LotteryState == LotteryState.OPEN);
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
        return (upkeepNeeded, "0x0");
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        s_LotteryState = LotteryState.CALCULATING;
        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: i_keyHash,
                subId: i_subscriptionId,
                requestConfirmations: REQUEST_CONFIRMATION,
                callbackGasLimit: i_callbackGasLimit,
                numWords: NUM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: true})
                )
            })
        );
        emit RequestedLotteryWinner(requestId);
    }

    function EnterLottery() public payable {
        if (msg.value < i_ticketPrice) {
            revert Lottery__NotEnoughETHforTicket();
        }
        if (s_LotteryState != LotteryState.OPEN) {
            revert Lottery__Closed();
        }
        s_players.push(payable(msg.sender));
        emit LotteryEnter(msg.sender);
    }

    function fulfillRandomWords(
        uint256 /*requestId*/,
        uint256[] calldata randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        (bool callSuc, ) = recentWinner.call{value: address(this).balance}("");
        s_LotteryState = LotteryState.OPEN;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;
        if (!callSuc) {
            revert Lottery__TransactionFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    receive() external payable {}

    function getticketPrice() public view returns (uint256) {
        return i_ticketPrice;
    }

    function getPlayers(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getLotteryState() public view returns (LotteryState) {
        return s_LotteryState;
    }

    function getNumPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimestamp() public view returns (uint256) {
        return uint256(s_lastTimeStamp);
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getkeyHash() public view returns (bytes32) {
        return i_keyHash;
    }

    function getsubscriptionId() public view returns (uint256) {
        return i_subscriptionId;
    }

    function getcallbackGasLimit() public view returns (uint32) {
        return i_callbackGasLimit;
    }

    function getNumWords() public pure returns (uint32) {
        return NUM_WORDS;
    }

    function getRequestConfirmations() public pure returns (uint16) {
        return REQUEST_CONFIRMATION;
    }
}
