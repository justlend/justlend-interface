<p align="center">
  <a href="https://app.justlend.org/">
    <img src="https://app.justlend.org/mainLogo.svg" alt="JustLend DAO Logo" width="180">
  </a>
</p>

<h1 align="center">JustLend DAO Interface</h1>


<p align="center">
    <a href="">
        <img alt="npm" src="https://img.shields.io/badge/npm-v18.15.0-blue?logo=nodedotjs">
    </a>
    <a href="./LICENSE.md">
      <img alt="License" src="https://img.shields.io/badge/License-Apache_2.0-blue.svg">
    </a>
</p>



Welcome to the JustLend DAO Interface project! This guide aims to provide clear instructions for all community members who wish to use, understand, or contribute to this project.



## 1. About the JustLend DAO Interface



The **JustLend Protocol** is a decentralized liquidity protocol deployed on the TRON network, forming the bedrock and rules layer of the entire market.

This open-source project, the **JustLend DAO Interface** (`app.justlend.org`), is a frontend user interface that aims to provide users with a safe and intuitive portal to interact with the protocol. As one of many ways to access the protocol, this interface is a fully open, community-driven public good. Its goal is to collaboratively build and maintain a secure, stable, and user-friendly frontend application.



### Key Features



This interface enables users to:

- **Manage your positions**: Easily supply assets to earn interest, or borrow assets against sufficient collateral.
- **Monitor market status**: View real-time key metrics for each market on JustLend, such as supply/borrow APY and total liquidity.
- **Participate in community governance**: Use your JST voting power to vote on the future direction of the protocol.

Additionally, the interface supports several of the JustLend Protocol's core mechanics:

- **Energy Rental**: All transactions on JustLend DAO require Energy, which can only be acquired through staking or burning TRX. This process involves high costs and lengthy procedures. In response, JustLend DAO introduces the Energy Rental service, allowing users to rent Energy at a significantly reduced price compared to staking or burning TRX. The contract EnergyRental is used to set up the Energy Rental service.
- **Liquidation**: Liquidation is determined by Risk Value, which is a critical metric within the JustLend DAO Protocol that measures the safety of a borrow position. Liquidation will be triggered when the risk value of your positions hits 100. The liquidator will settle the debt (in the borrowed token), take away the supplied asset (in the corresponding jToken), and earn a liquidation reward equal to 8% of the repaid debt value. It should be noted that each liquidation can only cover the debt of one token.

------



## 2. Quick Start



Getting the interface running on your local machine is straightforward.

1. **Prerequisites**

   - Ensure you have **Node.js v18.x** installed (we recommend using `nvm`).
   - This project uses `npm` as its package manager.

2. **Clone and Install Dependencies**

   Bash

   ```
   git clone https://github.com/justlend/justlend-interface.git
   cd justlend-interface
   npm install
   ```

3. Start the Development Server

   This command starts a hot-reloading development server connected to the Nile Testnet, listening on http://localhost:18113.

   Bash

   ```
   npm run start
   ```

------



## 3. How to Contribute



We enthusiastically welcome any form of contribution from the community, whether it's reporting a bug or submitting a new feature.



### Reporting Bugs & Feature Suggestions



If you encounter a problem or have a great idea, the best way to let us know is by creating a GitHub Issue.

1. **Visit the Issues Page**: https://github.com/justlend/justlend-interface/issues/new
2. **Choose a Template**: Select the `Bug Report` or `Feature Request` template based on your needs.
3. **Describe in Detail**: Please fill out the template with as much detail as possible. This helps us diagnose and address the issue faster.



### Picking Up a Task & Development Workflow



We encourage developers to get directly involved with coding. Issues tagged with **`looking for help`** are excellent starting points.

1. **Express Your Interest**: Leave a comment on the issue you'd like to work on. A core maintainer will assign it to you.

   > **Please note**: To ensure project momentum, we may reassign an issue if there is no activity for an extended period. We will contact the original assignee first in such cases.

2. **Fork & Create a Branch**:

   - Fork this project to your personal account.
   - Create a new branch for your work. Our recommended branch naming convention is `type/issue-number-short-description` (e.g., `feat/321-add-user-profile-page`).

3. **Develop & Commit**:

   - Complete your coding and ensure it passes local tests.
   - Please commit your code following the **[Conventional Commits](https://www.conventionalcommits.org/)** specification.

4. **Open a Pull Request (PR)**:

   - Push your branch to your forked repository, then open a PR against the `main` branch of the main repository.
   - Clearly summarize your changes in the PR description and complete the `Author Checklist` in the template.

5. **Code Review & Merge**:

   - Core maintainers will review your code and may request changes.
   - After your PR passes code review, QA testing, and design review, it will be merged. Congratulations on becoming a JustLend DAO Interface contributor!

------



## 4. Development & Deployment Information





### Running Locally



- **Development Mode (connects to Nile Testnet)**

  Bash

  ```
  npm run start
  ```

- **Production Mode (local preview)**

  Bash

  ```
  # Build the project for production
  npm run build
  
  # Start the production server
  npm run startPro
  ```

### Translations



If you would like to support a new language, please open an issue on GitHub and add the `i18n` label. Feel free to reach out to us on our **[Discord](https://discord.com/invite/2KdByBgBA3)** to become a valued translator!

------



## 5. License & Acknowledgements



- **License**: **[Apache-2.0 License](./LICENSE.md)**.
- **Acknowledgements**: To the entire TRON community and all its contributors.
