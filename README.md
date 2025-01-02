# Lottery Smart Contract

This repository contains the implementation of a Lottery smart contract built using Solidity. The contract allows participants to enter a lottery, and the winner is chosen randomly using Chainlink VRF. Chainlink Keepers ensure the automation of the lottery.

## Technologies Used

### Smart Contract

-   **Solidity (v0.8.7)**: Programming language for Ethereum smart contracts.
-   **Chainlink VRF v2.5**: For generating verifiable random numbers.
-   **Chainlink Keepers**: For automating the lottery process.

### Development Environment

-   **Hardhat**: Development environment for compiling, testing, and deploying Solidity contracts.
-   **Node.js**: Backend runtime environment.
-   **Ethers.js**: Library for interacting with the Ethereum blockchain.

### Testing

-   **Mocha/Chai**: Testing framework for JavaScript.
-   **Hardhat Network**: Built-in Ethereum network for testing and debugging.

## Features

-   **Lottery Entry**: Participants can enter by paying the ticket price.
-   **Random Winner Selection**: Ensures fairness using Chainlink VRF.
-   **Automation**: Uses Chainlink Keepers to trigger winner selection when conditions are met.

## Prerequisites

Before deploying the contract, ensure you have the following:

-   **Node.js**: Installed on your system.
-   **NPM/Yarn**: Package manager for dependencies.
-   **Hardhat**: Installed globally or locally in your project.

## Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/your-repository/hardhat-smartcontract-lottery.git
    cd hardhat-smartcontract-lottery
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up the `.env` file:

    Create a `.env` file in the root directory and configure the following environment variables:

    ```env
    PRIVATE_KEY="<your-wallet-private-key>"
    RPC_URL="<your-blockchain-provider-rpc-url>"
    CHAIN_ID="11155111" # Sepolia test network chain ID
    SUBSCRIPTION_ID="<your-chainlink-vrf-subscription-id>"
    VRF_COORDINATOR="<chainlink-vrf-coordinator-address>"
    KEY_HASH="<chainlink-vrf-keyhash>"
    CALLBACK_GAS_LIMIT="<callback-gas-limit>"
    INTERVAL="<time-interval-for-lottery>"
    TICKET_PRICE="<lottery-ticket-price-in-wei>"
    ```

4. Compile the smart contracts:

    ```bash
    npx hardhat compile
    ```

5. Run tests:

    ```bash
    npx hardhat test
    ```

## Deployment

1. Configure the `hardhat.config.js` file with your network details:

    ```javascript
    module.exports = {
        solidity: "0.8.7",
        networks: {
            sepolia: {
                url: process.env.RPC_URL,
                accounts: [process.env.PRIVATE_KEY],
            },
        },
    }
    ```

2. Deploy the contract:

    ```bash
    npx hardhat run scripts/deploy.js --network sepolia
    ```

3. Run the `99-update-front-end.js` script to update the frontend:

    ```bash
    npx hardhat run deploy/99-update-front-end.js --network sepolia
    ```

    This script updates the ABI and contract address in the `nextjs-smartcontract-lottery` repository for frontend integration.

4. After deployment, save the contract address for interaction.

## Testing

To test the contract, run:

```bash
npx hardhat test
```

Ensure you have a local development blockchain or use the Hardhat Network for testing.

## Folder Structure

```plaintext
hardhat-smartcontract-lottery/
├── contracts/        # Solidity contract files
├── deploy/           # Deployment scripts (e.g., 99-update-front-end.js)
├── test/             # Test files
├── .env              # Environment variables
├── hardhat.config.js # Hardhat configuration
├── package.json      # Dependencies
└── README.md         # Project documentation
```

## Future Enhancements

-   Multi-token support for lottery entry.
-   Enhanced UI for frontend integration.
-   Support for additional networks.

## License

This project is licensed under the MIT License.

---
