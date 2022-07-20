# JustLend DAO
----

## 1 Introduction

Distributed finance (or open finance) has evolved to be one of the key drivers of applications on
the TRON network. The core principle of DeFi is to pioneer a censorship-free financial service
ecosystem that is immune to centralized authority and accessible to all. Within the ecosystem,
users are their own asset custodians, and are granted full asset control and ownership. They
can freely access any decentralized market available.

## 2 JustLend DAO Protocol

JustLend DAO is a TRON-powered money market protocol aimed at establishing fund pools whose
interest rates are determined by an algorithm based on the supply and demand of TRON
assets. There are two roles within the protocol, namely suppliers and borrowers. Both of them
interact directly with the protocol to earn or pay a floating interest rate.

On JustLend DAO, each money market corresponds to a unique TRON asset such as TRX, TRC20
stablecoin (e.g. USDT) or other TRC20-based tokens, and entails an open and transparent
ledger that records all transactions and historical interest rates.

## 3 Architecture of JustLend DAO Protocol

JustLend DAO money market is essentially a distributed ledger that allows users to supply or borrow
assets as interest accrues.

## 4 Smart Contract of Money Market

Money markets in the JustLend DAO protocol are built on the basis of smart contracts for money
markets. Users can interact with the JustLend DAO protocol via smart contracts. Here are some key
functions of the smart contracts of money markets on JustLend DAO: Mint、Withdraw、Borrow、Repay、Liquidate.

## 5 JustLend DAO FAQ

### What determines the Supply APY and Borrow APY?
You will notice that on the market page the APYs for supply and borrow are different.Click on each token to view details of the token.

It can be seen from the two charts above that the variation curve for the APYs supply and borrow vary from token to token, because parameters vary for each token on. JustLend. Smooth model and jump model are applied to calculate the Supply APY and Borrow APY.

### What is net APY?
Net APY is an important reference for users to understand the P&L of the current assets and loans.

Net APY = [∑ (Value of Supplied Token × Supply APY) - ∑ (Value of Borrowed Token × Borrow APY) ] ÷ Value of Total Supply

### How to understand your risk value?
Risk value is an indicator of the health of the current portfolio. Collaterals will be liquidated when the risk value reaches 100.

Formula: Risk value = Total borrow ÷ Borrow limit x 100

### What is jToken?
jToken refers to the "receipt" users get for supplying underlying assets to JustLend DAO, such as the jTRX, jUSDT, jSUN and jBTC you receive after supplying the corresponding assets. jToken is a TRC20 token in your wallet.

All assets supported by JustLend DAO, a DeFi protocol, are packed and integrated through the smart contract - jToken. Users mint jToken, which generates interest for its holders, and provide assets to the protocol. Each jToken can be swapped back into the corresponding base asset when users redeem it.

jToken share the same properties as other TRC20 tokens, such as being transferred to others or deposited into a smart contract.Your transfer of jToken to other users or institutions constitute a waiver of ownership over the assets you have supplied to JustLend DAO.

## 6 Development

### Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run start
```

### Compiles and minifies for production
```
npm run build
```
