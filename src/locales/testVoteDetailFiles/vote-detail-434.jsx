export default {
  title: 'Proposal to add the U Market&&Proposal to add the U Market',
  content: `<h2><strong><span style="font-size:16pt;font-family:Arial,sans-serif;">Proposal to add the U Market</span></strong></h2>

    <p><span style="font-weight: 400;">This proposal aims to add the United Stables (U) Token as a new market on the JustLend DAO platform. United Stables (U) is a USD-pegged stablecoin designed to unify liquidity across fragmented networks. Integrating United Stables (U) into JustLend DAO will diversify the protocol's stablecoin offerings, expand users' borrow and supply options, improve overall platform liquidity, and further enhance the diversity and accessibility of the DeFi lending experience.</span></p>
    <p>&nbsp;</p>

    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Background</span></strong></h3>
    <p style="margin-top:6pt;"></p>
    <p><span style="font-weight: 400;">United Stables (U) is a next-generation, USD-pegged stablecoin built on the TRC-20 standard, specifically designed to address liquidity fragmentation and power the burgeoning AI-driven economy. By serving as a unified liquidity layer, United Stables (U) facilitates seamless value transfer between decentralized protocols, centralized exchanges, and autonomous AI agents, ensuring high-speed settlement for machine-to-machine (M2M) transactions.</span></p>
    <p style="margin-top:6pt;"></p>
    <p><span style="font-weight: 400;">Underpinned by a 1:1 reserve of high-quality liquid assets, United Stables (U) prioritizes security through continuous auditing and Proof of Reserves (PoR). Its integration into the TRON ecosystem leverages the network's high throughput and low fees, making it an ideal collateral and borrowing asset for users seeking a transparent, audit-ready stablecoin within the JustLend DAO protocol. By establishing a United Stables (U) lending market on JustLend DAO, the protocol will offer holders more stablecoin offerings, while simultaneously attracting significant new TVL and strengthening the synergy between JustLend DAO and its most active governance community.</span></p>
    <p>&nbsp;</p>

    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Proposal Details</span></strong></h3>
    <p><span style="font-weight: 400;">This proposal aims to enable the supply/borrow of U (TRC20) market on JustLend DAO Protocol. To open the market in a safe and structured manner, JustLend DAO propose the following adjustments:</span></p>
    <p style="margin-top:6pt;"></p>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add a U price oracle for U/TRX;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add support for jU on JustLend DAO smart contracts;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the collateral factor of U at 75%;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the reserve factor of U at 10%;&nbsp;</span></p>
        </li>
    </ul>
    <p><span style="font-weight: 400;">The collateral factor of U is set at 75%, while its reserve factor is set at 10%. The U market adopts the jumping interest rate model, where the interest rate rockets to a higher tier when the utilization rate exceeds 80%. Its Supply APY hits 72% when the utilization rate reaches 100%. Supply and borrow APYs at different utilization rates are as follows: </span></p>
    <p style="margin-top:8pt;"></p>
    <table style="width: 343px; height: 1px;" border="1" cellspacing="1" cellpadding="1">
    <tbody>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">Utilization rate</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">Borrow Base APY</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">Supply Base APY</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">0%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">0.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">10%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">0.63%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.06%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">20%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">1.25%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.23%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">30%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">1.88%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.51%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">40%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">2.50%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.90%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">50%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">3.13%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">1.41%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">60%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">3.75%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">2.03%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">70%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">4.38%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">2.76%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">80%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">5.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">3.60%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">90%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">42.50%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">34.43%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">100%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">80.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">72.00%</span></p>
    </td>
    </tr>
    </tbody>
    </table>
    <p style="margin-top:8pt;"></p>
    <p><span style="font-weight: 400;">Listing the U market on JustLend DAO is a strategic move that aligns with our commitment to providing cutting-edge financial solutions to our users. If the proposal passes, users will be able to use U as collateral for borrowing other assets and supply to get interest earnings. By implementing this proposal, we aim to provide users with more reliable, safer, and efficient lending services.</span></p>
    <p><br></p>

    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Voting Options</span></strong></h3>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;">For</span></strong><span style="font-family:Avenir Next;">&nbsp;- I support JustLend DAO Protocol proceeding with this proposal.&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;">Against</span></strong><span style="font-family:Avenir Next;">&nbsp;- I oppose JustLend DAO Protocol proceeding with this proposal.</span></p>
        </li>
    </ul>   &&&&&&&&<h2><strong><span style="font-size:16pt;font-family:Arial,sans-serif;">Proposal to add the U Market</span></strong></h2>

    <p><span style="font-weight: 400;">This proposal aims to add the United Stables (U) Token as a new market on the JustLend DAO platform. United Stables (U) is a USD-pegged stablecoin designed to unify liquidity across fragmented networks. Integrating United Stables (U) into JustLend DAO will diversify the protocol's stablecoin offerings, expand users' borrow and supply options, improve overall platform liquidity, and further enhance the diversity and accessibility of the DeFi lending experience.</span></p>
    <p>&nbsp;</p>

    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Background</span></strong></h3>
    <p style="margin-top:6pt;"></p>
    <p><span style="font-weight: 400;">United Stables (U) is a next-generation, USD-pegged stablecoin built on the TRC-20 standard, specifically designed to address liquidity fragmentation and power the burgeoning AI-driven economy. By serving as a unified liquidity layer, United Stables (U) facilitates seamless value transfer between decentralized protocols, centralized exchanges, and autonomous AI agents, ensuring high-speed settlement for machine-to-machine (M2M) transactions.</span></p>
    <p style="margin-top:6pt;"></p>
    <p><span style="font-weight: 400;">Underpinned by a 1:1 reserve of high-quality liquid assets, United Stables (U) prioritizes security through continuous auditing and Proof of Reserves (PoR). Its integration into the TRON ecosystem leverages the network's high throughput and low fees, making it an ideal collateral and borrowing asset for users seeking a transparent, audit-ready stablecoin within the JustLend DAO protocol. By establishing a United Stables (U) lending market on JustLend DAO, the protocol will offer holders more stablecoin offerings, while simultaneously attracting significant new TVL and strengthening the synergy between JustLend DAO and its most active governance community.</span></p>
    <p>&nbsp;</p>

    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Proposal Details</span></strong></h3>
    <p><span style="font-weight: 400;">This proposal aims to enable the supply/borrow of U (TRC20) market on JustLend DAO Protocol. To open the market in a safe and structured manner, JustLend DAO propose the following adjustments:</span></p>
    <p style="margin-top:6pt;"></p>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add a U price oracle for U/TRX;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add support for jU on JustLend DAO smart contracts;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the collateral factor of U at 75%;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the reserve factor of U at 10%;&nbsp;</span></p>
        </li>
    </ul>
    <p><span style="font-weight: 400;">The collateral factor of U is set at 75%, while its reserve factor is set at 10%. The U market adopts the jumping interest rate model, where the interest rate rockets to a higher tier when the utilization rate exceeds 80%. Its Supply APY hits 72% when the utilization rate reaches 100%. Supply and borrow APYs at different utilization rates are as follows: </span></p>
    <p style="margin-top:8pt;"></p>
    <table style="width: 343px; height: 1px;" border="1" cellspacing="1" cellpadding="1">
    <tbody>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">Utilization rate</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">Borrow Base APY</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">Supply Base APY</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">0%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">0.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">10%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">0.63%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.06%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">20%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">1.25%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.23%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">30%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">1.88%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.51%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">40%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">2.50%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.90%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">50%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">3.13%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">1.41%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">60%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">3.75%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">2.03%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">70%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">4.38%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">2.76%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">80%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">5.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">3.60%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">90%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">42.50%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">34.43%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">100%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">80.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">72.00%</span></p>
    </td>
    </tr>
    </tbody>
    </table>
    <p style="margin-top:8pt;"></p>
    <p><span style="font-weight: 400;">Listing the U market on JustLend DAO is a strategic move that aligns with our commitment to providing cutting-edge financial solutions to our users. If the proposal passes, users will be able to use U as collateral for borrowing other assets and supply to get interest earnings. By implementing this proposal, we aim to provide users with more reliable, safer, and efficient lending services.</span></p>
    <p><br></p>

    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Voting Options</span></strong></h3>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;">For</span></strong><span style="font-family:Avenir Next;">&nbsp;- I support JustLend DAO Protocol proceeding with this proposal.&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;">Against</span></strong><span style="font-family:Avenir Next;">&nbsp;- I oppose JustLend DAO Protocol proceeding with this proposal.</span></p>
        </li>
    </ul>  `
};
