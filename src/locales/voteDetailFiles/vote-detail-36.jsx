export default {
  title: 'Proposal to add the USD1 Market&&Proposal to add the USD1 Market',
  content: `<h2><strong><span style="font-size:16pt;font-family:Arial,sans-serif;">Proposal to add the USD1 Market</span></strong></h2>
    <p><span style="font-weight: 400;">This proposal aims to add the World Liberty Financial USD (USD1) as a new market on the JustLend DAO platform.  USD1 is a fully collateralized, USD-pegged stablecoin and has rapidly gained adoption across the crypto ecosystem. Adding USD1 to JustLend DAO will expand users’ stablecoin borrow and supply options, improve overall platform liquidity, and further enhance the diversity and accessibility of the DeFi lending experience.</span></p>
    <p>&nbsp;</p>
    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Background</span></strong></h3>
    <p><span style="font-weight: 400;">World Liberty Financial USD (</span><a href="https://tronscan.org/#/token20/TPFqcBAaaUMCSVRCqPaQ9QnzKhmuoLR6Rc" target="usd1"><span style="font-weight: 400;">USD1</span></a><span style="font-weight: 400;">) is a fully fiat-backed stablecoin issued by World Liberty Financial Inc., with custodial services provided by the regulated BitGo Trust Company. Designed to maintain a 1:1 peg with the U.S. dollar, USD1 is backed by a mix of U.S. dollar deposits and short-term government securities. Since its launch in early 2025, USD1 has rapidly gained adoption across the blockchain ecosystem, with a circulating supply exceeding 2 billion tokens. The token is currently deployed on multiple major networks, and is positioned as a reliable, high-liquidity stablecoin with growing institutional and retail use.&nbsp;</span></p>
    <p>&nbsp;</p>
    <p><span style="font-weight: 400;">Adding USD1 as a new market on the JustLend DAO platform will enhance user choice, diversify stablecoin exposure, and further expand the protocol’s asset offerings. Given USD1’s increasing adoption and market depth, its integration is expected to boost platform liquidity and attract new users who hold or transact in USD1. Furthermore, this move aligns with JustLend DAO’s long-term goal of supporting a broader range of high-quality assets, while empowering users to engage in supplying and borrowing activities with a stable and well-collateralized token.</span></p>
    <p>&nbsp;</p>
    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Proposal Details</span></strong></h3>
    <p><span style="font-weight: 400;">This proposal aims to enable the supply/borrow of </span><a href="https://tronscan.org/#/token20/TPFqcBAaaUMCSVRCqPaQ9QnzKhmuoLR6Rc" target="tronscan_usd1"><span style="font-weight: 400;">USD1 (TRC20)</span></a><span style="font-weight: 400;"> market on JustLend DAO Protocol. To open the market in a safe and structured manner, JustLend DAO propose the following adjustments:</span></p>
    <p style="margin-top:6pt;"></p>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add support for jUSD1 on JustLend DAO smart contracts;&nbsp;</span><a href="https://tronscan.org/#/contract/TBEKggwqFkrc4KckQVR9BLucAmQugafEZf" target="tronscan_jusd1">View</a></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the collateral factor of USD1 at 0%;&nbsp;</span><a href="https://tronscan.org/#/contract/TLZJuxwRC2aad7vs5RAvaNAHc72wTEMbGD" target="tronscan_rate_model">View</a></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the reserve factor of USD1 at 10%;&nbsp;</span><a href="https://tronscan.org/#/token20/TBEKggwqFkrc4KckQVR9BLucAmQugafEZf" target="tronscan_rate_model">View</a></p>
        </li>
    </ul>
    <p><span style="font-weight: 400;">The collateral factor of USD1 is set at 0%, while its reserve factor is set at 10%. The USD1 market adopts the jumping interest model, where the interest rate rockets to a higher tier when the utilization rate exceeds 80%. Its Supply APY hits 72.90% when the utilization rate reaches 100%. Supply and borrow APYs at different utilization rates are as follows:</span></p>
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
    <p><span style="font-weight: 400;">1.63%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.15%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">20%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">2.25%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.41%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">30%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">2.88%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.78%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">40%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">3.50%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">1.26%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">50%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">4.13%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">1.86%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">60%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">4.75%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">2.57%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">70%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">5.38%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">3.39%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">80%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">6.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">4.32%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">90%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">43.50%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">35.24%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">100%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">81.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">72.90%</span></p>
    </td>
    </tr>
    </tbody>
    </table>
    <p style="margin-top:8pt;"></p>
    <p><span style="font-weight: 400;">Listing the USD1 market on JustLend DAO is a strategic move that aligns with our commitment to providing cutting-edge financial solutions to our users. If the proposal passes, users will be able to use USD1 as collateral for borrowing other assets and supply to get interest earnings. By implementing this proposal, we aim to provide users with more reliable, safer, and efficient lending services.</span></p>
    <p><br></p>
    
    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Voting Options</span></strong></h3>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;">For</span></strong><span style="font-family:Avenir Next;">&nbsp;- I support JustLend DAO Protocol proceeding with this proposal.&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;">Against</span></strong><span style="font-family:Avenir Next;">&nbsp;- I oppose JustLend DAO Protocol proceeding with this proposal.</span></p>
        </li>
    </ul> &&&&&&&&<h2><strong><span style="font-size:16pt;font-family:Arial,sans-serif;">Proposal to add the USD1 Market</span></strong></h2>
    <p><span style="font-weight: 400;">This proposal aims to add the World Liberty Financial USD (USD1) as a new market on the JustLend DAO platform.  USD1 is a fully collateralized, USD-pegged stablecoin and has rapidly gained adoption across the crypto ecosystem. Adding USD1 to JustLend DAO will expand users’ stablecoin borrow and supply options, improve overall platform liquidity, and further enhance the diversity and accessibility of the DeFi lending experience.</span></p>
    <p>&nbsp;</p>
    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Background</span></strong></h3>
    <p><span style="font-weight: 400;">World Liberty Financial USD (</span><a href="https://tronscan.org/#/token20/TPFqcBAaaUMCSVRCqPaQ9QnzKhmuoLR6Rc" target="usd1"><span style="font-weight: 400;">USD1</span></a><span style="font-weight: 400;">) is a fully fiat-backed stablecoin issued by World Liberty Financial Inc., with custodial services provided by the regulated BitGo Trust Company. Designed to maintain a 1:1 peg with the U.S. dollar, USD1 is backed by a mix of U.S. dollar deposits and short-term government securities. Since its launch in early 2025, USD1 has rapidly gained adoption across the blockchain ecosystem, with a circulating supply exceeding 2 billion tokens. The token is currently deployed on multiple major networks, and is positioned as a reliable, high-liquidity stablecoin with growing institutional and retail use.&nbsp;</span></p>
    <p>&nbsp;</p>
    <p><span style="font-weight: 400;">Adding USD1 as a new market on the JustLend DAO platform will enhance user choice, diversify stablecoin exposure, and further expand the protocol’s asset offerings. Given USD1’s increasing adoption and market depth, its integration is expected to boost platform liquidity and attract new users who hold or transact in USD1. Furthermore, this move aligns with JustLend DAO’s long-term goal of supporting a broader range of high-quality assets, while empowering users to engage in supplying and borrowing activities with a stable and well-collateralized token.</span></p>
    <p>&nbsp;</p>
    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Proposal Details</span></strong></h3>
    <p><span style="font-weight: 400;">This proposal aims to enable the supply/borrow of </span><a href="https://tronscan.org/#/token20/TPFqcBAaaUMCSVRCqPaQ9QnzKhmuoLR6Rc" target="tronscan_usd1"><span style="font-weight: 400;">USD1 (TRC20)</span></a><span style="font-weight: 400;"> market on JustLend DAO Protocol. To open the market in a safe and structured manner, JustLend DAO propose the following adjustments:</span></p>
    <p style="margin-top:6pt;"></p>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Add support for jUSD1 on JustLend DAO smart contracts;&nbsp;</span><a href="https://tronscan.org/#/contract/TBEKggwqFkrc4KckQVR9BLucAmQugafEZf" target="tronscan_jusd1">View</a></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the collateral factor of USD1 at 0%;&nbsp;</span><a href="https://tronscan.org/#/contract/TLZJuxwRC2aad7vs5RAvaNAHc72wTEMbGD" target="tronscan_rate_model">View</a></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;"></span></strong><span style="font-family:Avenir Next;">Set the reserve factor of USD1 at 10%;&nbsp;</span><a href="https://tronscan.org/#/token20/TBEKggwqFkrc4KckQVR9BLucAmQugafEZf" target="tronscan_rate_model">View</a></p>
        </li>
    </ul>
    <p><span style="font-weight: 400;">The collateral factor of USD1 is set at 0%, while its reserve factor is set at 10%. The USD1 market adopts the jumping interest model, where the interest rate rockets to a higher tier when the utilization rate exceeds 80%. Its Supply APY hits 72.90% when the utilization rate reaches 100%. Supply and borrow APYs at different utilization rates are as follows:</span></p>
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
    <p><span style="font-weight: 400;">1.63%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.15%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">20%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">2.25%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.41%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">30%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">2.88%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">0.78%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">40%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">3.50%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">1.26%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">50%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">4.13%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">1.86%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">60%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">4.75%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">2.57%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">70%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">5.38%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">3.39%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">80%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">6.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">4.32%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">90%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">43.50%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">35.24%</span></p>
    </td>
    </tr>
    <tr>
    <td style="width: 103px;">
    <p><span style="font-weight: 400;">100%</span></p>
    </td>
    <td style="width: 113.828px;">
    <p><span style="font-weight: 400;">81.00%</span></p>
    </td>
    <td style="width: 111.172px;">
    <p><span style="font-weight: 400;">72.90%</span></p>
    </td>
    </tr>
    </tbody>
    </table>
    <p style="margin-top:8pt;"></p>
    <p><span style="font-weight: 400;">Listing the USD1 market on JustLend DAO is a strategic move that aligns with our commitment to providing cutting-edge financial solutions to our users. If the proposal passes, users will be able to use USD1 as collateral for borrowing other assets and supply to get interest earnings. By implementing this proposal, we aim to provide users with more reliable, safer, and efficient lending services.</span></p>
    <p><br></p>
    
    <h3><strong><span style="font-size:14pt;font-family:Arial,sans-serif;">Voting Options</span></strong></h3>
    <ul>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;">For</span></strong><span style="font-family:Avenir Next;">&nbsp;- I support JustLend DAO Protocol proceeding with this proposal.&nbsp;</span></p>
        </li>
        <li style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;">
            <p><strong><span style="font-size:11pt;font-family:Arial,sans-serif;">Against</span></strong><span style="font-family:Avenir Next;">&nbsp;- I oppose JustLend DAO Protocol proceeding with this proposal.</span></p>
        </li>
    </ul> `
};
