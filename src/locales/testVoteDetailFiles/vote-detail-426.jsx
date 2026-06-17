export default {
  title: 'Proposal to add the WBTC Market&&Proposal to add the WBTC Market',
  content: `<h2><strong><span style="font-size:16pt;font-family:Arial,sans-serif;">Proposal to add the WBTC Market</span></strong></h2>

    <p><span style="font-weight: 400;">This proposal aims to add the Wrapped BTC (WBTC) as a new market on the JustLend DAO platform. WBTC is a tokenized version of BTC that runs on the TRON network as a TRC20 token, pegged 1:1 to BTC. Adding WBTC to JustLend DAO will expand users' borrow and supply options, improve overall platform liquidity, and further enhance the diversity and accessibility of the DeFi lending experience.</span></p>
    <p>&nbsp;</p>

    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Background</span></strong></h3>
    <p style="margin-top:6pt;"></p>
    <p><span style="font-weight: 400;">Following the latest expansion of native WBTC beyond Ethereum and Solana to now include TRON, JustLend DAO intends to list the WBTC market as part of an official collaboration with the WBTC team, integrating the world's largest crypto asset directly into TRON's DeFi ecosystem, providing users with new opportunities to lend, borrow, and earn yields using Bitcoin-backed assets.&nbsp;</span></p>
    <p style="margin-top:6pt;"></p>
    <p><span style="font-weight: 400;">Since 2019, WBTC has redefined how Bitcoin moves and interacts within decentralized finance. As the unified standard for using Bitcoin across multiple blockchains, it enables BTC to exist natively on chains like Ethereum, TRON, Solana, and many more —allowing it to flow, integrate, and transact without friction. WBTC is not a proxy or derivative; it is Bitcoin re-engineered for composability. A direct, 1:1 representation designed to uphold Bitcoin's value, while expanding its utility. At its core lies a foundation of transparency and secure custody. Every unit of WBTC is secured through robust standards, including cold storage, multi-signature authentication, and on-chain, publicly verifiable audits.</span></p>
    <p>&nbsp;</p>

    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Proposal Details</span></strong></h3>
    <p><span style="font-weight: 400;">This proposal aims to enable the supply/borrow of WBTC (TRC20) market on JustLend DAO Protocol. To open the market in a safe and structured manner, JustLend DAO propose the following adjustments:</span></p>
    <p style="margin-top:6pt;"></p>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add a WBTC price oracle for WBTC/TRX;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add support for jWBTC on JustLend DAO smart contracts;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the collateral factor of WBTC at 75%;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the reserve factor of WBTC at 5%;&nbsp;</span></p>
        </li>
    </ul>
    <p><span style="font-weight: 400;">The collateral factor of WBTC is set at 75%, while its reserve factor is set at 5%. The WBTC market adopts the jumping interest rate model, where the interest rate rockets to a higher tier when the utilization rate exceeds 80%. Its Supply APY hits 285% when the utilization rate reaches 100%. Supply and borrow APYs at different utilization rates are as follows: </span></p>
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
    <p><span style="font-weight: 400;">0.50%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.05%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">20%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">1.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.19%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">30%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">1.50%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.43%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">40%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">2.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.76%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">50%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">2.50%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">1.19%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">60%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">3.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">1.71%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">70%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">3.50%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">2.33%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">80%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">4.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">3.04%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">90%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">152.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">129.96%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">100%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">300.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">285.00%</span></p>
    </td>
    </tr>
    </tbody>
    </table>
    <p style="margin-top:8pt;"></p>
    <p><span style="font-weight: 400;">Listing the WBTC market on JustLend DAO is a strategic move that aligns with our commitment to providing cutting-edge financial solutions to our users. If the proposal passes, users will be able to use WBTC as collateral for borrowing other assets and supply to get interest earnings. By implementing this proposal, we aim to provide users with more reliable, safer, and efficient lending services.</span></p>
    <p><br></p>
    
    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Voting Options</span></strong></h3>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;">For</span></strong><span style="font-family:Avenir Next;">&nbsp;- I support JustLend DAO Protocol proceeding with this proposal.&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;">Against</span></strong><span style="font-family:Avenir Next;">&nbsp;- I oppose JustLend DAO Protocol proceeding with this proposal.</span></p>
        </li>
    </ul>   &&&&&&&&<h2><strong><span style="font-size:16pt;font-family:Arial,sans-serif;">Proposal to add the WBTC Market</span></strong></h2>

    <p><span style="font-weight: 400;">This proposal aims to add the Wrapped BTC (WBTC) as a new market on the JustLend DAO platform. WBTC is a tokenized version of BTC that runs on the TRON network as a TRC20 token, pegged 1:1 to BTC. Adding WBTC to JustLend DAO will expand users' borrow and supply options, improve overall platform liquidity, and further enhance the diversity and accessibility of the DeFi lending experience.</span></p>
    <p>&nbsp;</p>

    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Background</span></strong></h3>
    <p style="margin-top:6pt;"></p>
    <p><span style="font-weight: 400;">Following the latest expansion of native WBTC beyond Ethereum and Solana to now include TRON, JustLend DAO intends to list the WBTC market as part of an official collaboration with the WBTC team, integrating the world's largest crypto asset directly into TRON's DeFi ecosystem, providing users with new opportunities to lend, borrow, and earn yields using Bitcoin-backed assets.&nbsp;</span></p>
    <p style="margin-top:6pt;"></p>
    <p><span style="font-weight: 400;">Since 2019, WBTC has redefined how Bitcoin moves and interacts within decentralized finance. As the unified standard for using Bitcoin across multiple blockchains, it enables BTC to exist natively on chains like Ethereum, TRON, Solana, and many more —allowing it to flow, integrate, and transact without friction. WBTC is not a proxy or derivative; it is Bitcoin re-engineered for composability. A direct, 1:1 representation designed to uphold Bitcoin's value, while expanding its utility. At its core lies a foundation of transparency and secure custody. Every unit of WBTC is secured through robust standards, including cold storage, multi-signature authentication, and on-chain, publicly verifiable audits.</span></p>
    <p>&nbsp;</p>

    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Proposal Details</span></strong></h3>
    <p><span style="font-weight: 400;">This proposal aims to enable the supply/borrow of WBTC (TRC20) market on JustLend DAO Protocol. To open the market in a safe and structured manner, JustLend DAO propose the following adjustments:</span></p>
    <p style="margin-top:6pt;"></p>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add a WBTC price oracle for WBTC/TRX;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add support for jWBTC on JustLend DAO smart contracts;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the collateral factor of WBTC at 75%;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the reserve factor of WBTC at 5%;&nbsp;</span></p>
        </li>
    </ul>
    <p><span style="font-weight: 400;">The collateral factor of WBTC is set at 75%, while its reserve factor is set at 5%. The WBTC market adopts the jumping interest rate model, where the interest rate rockets to a higher tier when the utilization rate exceeds 80%. Its Supply APY hits 285% when the utilization rate reaches 100%. Supply and borrow APYs at different utilization rates are as follows: </span></p>
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
    <p><span style="font-weight: 400;">0.50%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.05%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">20%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">1.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.19%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">30%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">1.50%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.43%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">40%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">2.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.76%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">50%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">2.50%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">1.19%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">60%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">3.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">1.71%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">70%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">3.50%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">2.33%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">80%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">4.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">3.04%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">90%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">152.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">129.96%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">100%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">300.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">285.00%</span></p>
    </td>
    </tr>
    </tbody>
    </table>
    <p style="margin-top:8pt;"></p>
    <p><span style="font-weight: 400;">Listing the WBTC market on JustLend DAO is a strategic move that aligns with our commitment to providing cutting-edge financial solutions to our users. If the proposal passes, users will be able to use WBTC as collateral for borrowing other assets and supply to get interest earnings. By implementing this proposal, we aim to provide users with more reliable, safer, and efficient lending services.</span></p>
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
