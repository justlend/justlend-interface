export default {
  title: 'Proposal to add the HTX Market&&Proposal to add the HTX Market',
  content: `<h2><strong><span style="font-size:16pt;font-family:Arial,sans-serif;">Proposal to add the HTX Market</span></strong></h2>

    <p><span style="font-weight: 400;">This proposal aims to add the HTX (HTX DAO Token) as a new market on the JustLend DAO platform. HTX serves as a crucial link between the TRON ecosystem and global trading users, boasting a large holder base and robust liquidity. Adding HTX to JustLend DAO will expand users' borrow and supply options, improve overall platform liquidity, and further enhance the diversity and accessibility of the DeFi lending experience.</span></p>
    <p>&nbsp;</p>

    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Background</span></strong></h3>
    <p style="margin-top:6pt;"></p>
    <p><span style="font-weight: 400;">HTX is the native governance token of HTX DAO, a decentralized autonomous organization that represents the strategic evolution of one of the world's largest cryptocurrency exchange ecosystems. Launched as a TRC-20 token on the TRON network, HTX serves as the foundational asset for a multi-layered ecosystem, bridging centralized exchange liquidity with decentralized governance.</span></p>
    <p style="margin-top:6pt;"></p>
    <p><span style="font-weight: 400;">As a core pillar of the TRON DeFi landscape, HTX boasts significant market depth and a massive global holder base. Beyond its role in protocol governance, the token provides extensive utility, including transaction fee discounts, ecosystem rewards, and seamless integration with major TRON-based protocols like SunSwap. By establishing an HTX lending market on JustLend DAO, the protocol will offer these holders a way to unlock capital efficiency without divesting, while simultaneously attracting significant new TVL and strengthening the synergy between JustLend DAO and its most active governance community.</span></p>
    <p>&nbsp;</p>

    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Proposal Details</span></strong></h3>
    <p><span style="font-weight: 400;">This proposal aims to enable the supply/borrow of HTX (TRC20) market on JustLend DAO Protocol. To open the market in a safe and structured manner, JustLend DAO propose the following adjustments:</span></p>
    <p style="margin-top:6pt;"></p>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add a HTX price oracle for HTX/TRX;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add support for jHTX on JustLend DAO smart contracts;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the collateral factor of HTX at 50%;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the reserve factor of HTX at 30%;&nbsp;</span></p>
        </li>
    </ul>
    <p><span style="font-weight: 400;">The collateral factor of HTX is set at 50%, while its reserve factor is set at 30%. The HTX market adopts the jumping interest model, where the interest rate rockets to a higher tier when the utilization rate exceeds 45%. Its Supply APY hits 192.50% when the utilization rate reaches 100%. Supply and borrow APYs at different utilization rates are as follows: </span></p>
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
    <p><span style="font-weight: 400;">5.00%</span></p>
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
    <p><span style="font-weight: 400;">16.11%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">1.13%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">20%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">27.22%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">3.81%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">30%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">38.33%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">8.05%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">40%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">49.44%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">13.84%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">50%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">75.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">26.25%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">60%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">115.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">48.30%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">70%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">155.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">75.95%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">80%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">195.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">109.20%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">90%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">235.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">148.05%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">100%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">275.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">192.50%</span></p>
    </td>
    </tr>
    </tbody>
    </table>
    <p style="margin-top:8pt;"></p>
    <p><span style="font-weight: 400;">Listing the HTX market on JustLend DAO is a strategic move that aligns with our commitment to providing cutting-edge financial solutions to our users. If the proposal passes, users will be able to use HTX as collateral for borrowing other assets and supply to get interest earnings. By implementing this proposal, we aim to provide users with more reliable, safer, and efficient lending services.</span></p>
    <p><br></p>

    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Voting Options</span></strong></h3>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;">For</span></strong><span style="font-family:Avenir Next;">&nbsp;- I support JustLend DAO Protocol proceeding with this proposal.&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;">Against</span></strong><span style="font-family:Avenir Next;">&nbsp;- I oppose JustLend DAO Protocol proceeding with this proposal.</span></p>
        </li>
    </ul>   &&&&&&&&<h2><strong><span style="font-size:16pt;font-family:Arial,sans-serif;">Proposal to add the HTX Market</span></strong></h2>

    <p><span style="font-weight: 400;">This proposal aims to add the HTX (HTX DAO Token) as a new market on the JustLend DAO platform. HTX serves as a crucial link between the TRON ecosystem and global trading users, boasting a large holder base and robust liquidity. Adding HTX to JustLend DAO will expand users' borrow and supply options, improve overall platform liquidity, and further enhance the diversity and accessibility of the DeFi lending experience.</span></p>
    <p>&nbsp;</p>

    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Background</span></strong></h3>
    <p style="margin-top:6pt;"></p>
    <p><span style="font-weight: 400;">HTX is the native governance token of HTX DAO, a decentralized autonomous organization that represents the strategic evolution of one of the world's largest cryptocurrency exchange ecosystems. Launched as a TRC-20 token on the TRON network, HTX serves as the foundational asset for a multi-layered ecosystem, bridging centralized exchange liquidity with decentralized governance.</span></p>
    <p style="margin-top:6pt;"></p>
    <p><span style="font-weight: 400;">As a core pillar of the TRON DeFi landscape, HTX boasts significant market depth and a massive global holder base. Beyond its role in protocol governance, the token provides extensive utility, including transaction fee discounts, ecosystem rewards, and seamless integration with major TRON-based protocols like SunSwap. By establishing an HTX lending market on JustLend DAO, the protocol will offer these holders a way to unlock capital efficiency without divesting, while simultaneously attracting significant new TVL and strengthening the synergy between JustLend DAO and its most active governance community.</span></p>
    <p>&nbsp;</p>

    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Proposal Details</span></strong></h3>
    <p><span style="font-weight: 400;">This proposal aims to enable the supply/borrow of HTX (TRC20) market on JustLend DAO Protocol. To open the market in a safe and structured manner, JustLend DAO propose the following adjustments:</span></p>
    <p style="margin-top:6pt;"></p>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add a HTX price oracle for HTX/TRX;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add support for jHTX on JustLend DAO smart contracts;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the collateral factor of HTX at 50%;&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the reserve factor of HTX at 30%;&nbsp;</span></p>
        </li>
    </ul>
    <p><span style="font-weight: 400;">The collateral factor of HTX is set at 50%, while its reserve factor is set at 30%. The HTX market adopts the jumping interest model, where the interest rate rockets to a higher tier when the utilization rate exceeds 45%. Its Supply APY hits 192.50% when the utilization rate reaches 100%. Supply and borrow APYs at different utilization rates are as follows: </span></p>
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
    <p><span style="font-weight: 400;">5.00%</span></p>
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
    <p><span style="font-weight: 400;">16.11%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">1.13%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">20%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">27.22%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">3.81%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">30%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">38.33%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">8.05%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">40%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">49.44%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">13.84%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">50%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">75.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">26.25%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">60%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">115.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">48.30%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">70%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">155.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">75.95%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">80%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">195.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">109.20%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">90%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">235.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">148.05%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">100%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">275.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">192.50%</span></p>
    </td>
    </tr>
    </tbody>
    </table>
    <p style="margin-top:8pt;"></p>
    <p><span style="font-weight: 400;">Listing the HTX market on JustLend DAO is a strategic move that aligns with our commitment to providing cutting-edge financial solutions to our users. If the proposal passes, users will be able to use HTX as collateral for borrowing other assets and supply to get interest earnings. By implementing this proposal, we aim to provide users with more reliable, safer, and efficient lending services.</span></p>
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
