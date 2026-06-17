export default {
  title: 'Proposal to add the USDD V2.0 Market&&Proposal to add the USDD V2.0 Market',
  content: `<h2><strong><span style="font-size:16pt;font-family:Arial,sans-serif;">Proposal to add the USDD V2.0 Market</span></strong></h2>
    <p><span style="font-weight: 400;">To enhance the stability and risk management of JustLend DAO platform, and in response to the comprehensive upgrade of the USDD token by the USDD team, this proposal outlines our plan to add the USDD V2.0 market to our platform.</span></p>
    <p>&nbsp;</p>
    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Background</span></strong></h3>
    <p><span style="font-weight: 400;">As part of a comprehensive upgrade by the official USDD team, JustLend DAO plans to list the USDD V2.0 market on our platform. </span><a href="https://usdd.io/#/" target="usdd"><span style="font-weight: 400;">USDD V2.0</span></a><span style="font-weight: 400;"> is currently in its Beta testing phase. With the official release expected soon, this proposal outlines the key upgrades and improvements in USDD V2.0 and the benefits they bring to the JustLend DAO platform and its users.&nbsp;</span></p>
    <p>&nbsp;</p>
    <p><span style="font-weight: 400;">USDD V2.0 introduces a significant shift by returning minting permissions entirely to the community. The collateral system is transparently monitored and managed through smart contracts, giving users full control without central authority intervention. This allows users to retain their crypto assets while utilizing stablecoins for various investments or transactions. Additionally, USDD V2.0 optimizes collateral types and stability support, enhancing flexibility and security to meet diverse user needs and improve the overall experience. To address crypto market volatility, USDD V2.0 employs mechanisms like varied collateralization rate vaults and the Peg Stability Module (PSM) to maintain price stability and minimize risks.</span></p>
    <p>&nbsp;</p>
    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Proposal Details</span></strong></h3>
    <p><span style="font-weight: 400;">This proposal aims to enable the supply/borrow of </span><a href="https://tronscan.org/#/contract/TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz/code" target="tronscan_usdd"><span style="font-weight: 400;">USDD V2.0 (TRC20)</span></a><span style="font-weight: 400;"> market on JustLend DAO Protocol. To open the market in a safe and structured manner, JustLend DAO propose the following adjustments:</span></p>
    <p style="margin-top:6pt;"></p>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add a USDD price oracle for USDD/TRX;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add support for jUSDD on JustLend DAO smart contracts;&nbsp;</span><a href="https://tronscan.org/#/contract/TKFRELGGoRgiayhwJTNNLqCNjFoLBh3Mnf" target="tronscan_jusdd">View</a></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the collateral factor of USDD at 85%;&nbsp;</span><a href="https://tronscan.org/#/contract/TRLEr5FkpBPTGdywxA8tjMfsHy8bSYWohF" target="tronscan_rate_model">View</a></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the reserve factor of USDD at 5%;&nbsp;</span><a href="https://tronscan.org/#/contract/TRLEr5FkpBPTGdywxA8tjMfsHy8bSYWohF" target="tronscan_rate_model">View</a></p>
        </li>
    </ul>
    <p><span style="font-weight: 400;">The USDD V2.0 market adopts the similar interest model as USDDOLD, where the interest rate rockets to a higher tier when the utilization rate exceeds 50%. Its Supply APY hits 190% when the utilization rate reaches 100%. Supply and borrow APYs at different utilization rates are as follows:</span></p>
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
    <p><span style="font-weight: 400;">1.00%</span></p>
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
    <p><span style="font-weight: 400;">5.80%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">1.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">20%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">10.60%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">2.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">30%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">15.40%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">4.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">40%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">20.20%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">8.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">50%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">25.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">12.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">60%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">60.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">34.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">70%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">95.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">63.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">80%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">130.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">99.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">90%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">165.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">141.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">100%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">200.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">190.00%</span></p>
    </td>
    </tr>
    </tbody>
    </table>
    <p style="margin-top:8pt;"></p>
    <p><span style="font-weight: 400;">Listing the USDD V2.0 market on JustLend DAO is a strategic move that aligns with our commitment to providing cutting-edge financial solutions to our users. If the proposal passes, users will be able to use USDD as collateral for borrowing other assets and supply to get interest earnings. By implementing this proposal, we aim to provide users with more reliable, safer, and efficient lending services.</span></p>
    <p><br></p>
    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Voting Options</span></strong></h3>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;">For</span></strong><span style="font-family:Avenir Next;">&nbsp;- I support JustLend DAO Protocol proceeding with this proposal.&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;">Against</span></strong><span style="font-family:Avenir Next;">&nbsp;- I oppose JustLend DAO Protocol proceeding with this proposal.</span></p>
        </li>
    </ul>&&&&&&&&<h2><strong><span style="font-size:16pt;font-family:Arial,sans-serif;">Proposal to add the USDD V2.0 Market</span></strong></h2>
    <p><span style="font-weight: 400;">To enhance the stability and risk management of JustLend DAO platform, and in response to the comprehensive upgrade of the USDD token by the USDD team, this proposal outlines our plan to add the USDD V2.0 market to our platform.</span></p>
    <p>&nbsp;</p>
    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Background</span></strong></h3>
    <p><span style="font-weight: 400;">As part of a comprehensive upgrade by the official USDD team, JustLend DAO plans to list the USDD V2.0 market on our platform. </span><a href="https://usdd.io/#/" target="usdd"><span style="font-weight: 400;">USDD V2.0</span></a><span style="font-weight: 400;"> is currently in its Beta testing phase. With the official release expected soon, this proposal outlines the key upgrades and improvements in USDD V2.0 and the benefits they bring to the JustLend DAO platform and its users.&nbsp;</span></p>
    <p>&nbsp;</p>
    <p><span style="font-weight: 400;">USDD V2.0 introduces a significant shift by returning minting permissions entirely to the community. The collateral system is transparently monitored and managed through smart contracts, giving users full control without central authority intervention. This allows users to retain their crypto assets while utilizing stablecoins for various investments or transactions. Additionally, USDD V2.0 optimizes collateral types and stability support, enhancing flexibility and security to meet diverse user needs and improve the overall experience. To address crypto market volatility, USDD V2.0 employs mechanisms like varied collateralization rate vaults and the Peg Stability Module (PSM) to maintain price stability and minimize risks.</span></p>
    <p>&nbsp;</p>
    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Proposal Details</span></strong></h3>
    <p><span style="font-weight: 400;">This proposal aims to enable the supply/borrow of </span><a href="https://tronscan.org/#/contract/TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz/code" target="tronscan_usdd"><span style="font-weight: 400;">USDD V2.0 (TRC20)</span></a><span style="font-weight: 400;"> market on JustLend DAO Protocol. To open the market in a safe and structured manner, JustLend DAO propose the following adjustments:</span></p>
    <p style="margin-top:6pt;"></p>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add a USDD price oracle for USDD/TRX;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add support for jUSDD on JustLend DAO smart contracts;&nbsp;</span><a href="https://tronscan.org/#/contract/TKFRELGGoRgiayhwJTNNLqCNjFoLBh3Mnf" target="tronscan_jusdd">View</a></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the collateral factor of USDD at 85%;&nbsp;</span><a href="https://tronscan.org/#/contract/TRLEr5FkpBPTGdywxA8tjMfsHy8bSYWohF" target="tronscan_rate_model">View</a></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the reserve factor of USDD at 5%;&nbsp;</span><a href="https://tronscan.org/#/contract/TRLEr5FkpBPTGdywxA8tjMfsHy8bSYWohF" target="tronscan_rate_model">View</a></p>
        </li>
    </ul>
    <p><span style="font-weight: 400;">The USDD V2.0 market adopts the similar interest model as USDDOLD, where the interest rate rockets to a higher tier when the utilization rate exceeds 50%. Its Supply APY hits 190% when the utilization rate reaches 100%. Supply and borrow APYs at different utilization rates are as follows:</span></p>
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
    <p><span style="font-weight: 400;">1.00%</span></p>
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
    <p><span style="font-weight: 400;">5.80%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">1.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">20%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">10.60%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">2.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">30%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">15.40%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">4.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">40%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">20.20%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">8.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">50%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">25.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">12.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">60%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">60.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">34.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">70%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">95.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">63.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">80%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">130.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">99.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">90%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">165.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">141.00%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">100%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">200.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">190.00%</span></p>
    </td>
    </tr>
    </tbody>
    </table>
    <p style="margin-top:8pt;"></p>
    <p><span style="font-weight: 400;">Listing the USDD V2.0 market on JustLend DAO is a strategic move that aligns with our commitment to providing cutting-edge financial solutions to our users. If the proposal passes, users will be able to use USDD as collateral for borrowing other assets and supply to get interest earnings. By implementing this proposal, we aim to provide users with more reliable, safer, and efficient lending services.</span></p>
    <p><br></p>
    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Voting Options</span></strong></h3>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;">For</span></strong><span style="font-family:Avenir Next;">&nbsp;- I support JustLend DAO Protocol proceeding with this proposal.&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;">Against</span></strong><span style="font-family:Avenir Next;">&nbsp;- I oppose JustLend DAO Protocol proceeding with this proposal.</span></p>
        </li>
    </ul>`
};
