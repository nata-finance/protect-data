// import { ethers } from 'ethers';

import { IExecDataProtector } from "@iexec/dataprotector"


const init = async () => {
 if (!window.ethereum) {
    throw Error('missing injected ethereum provider in page');
  }

  await window.ethereum.request({
    method: 'eth_requestAccounts',
  });
}
init()

const web3Provider = window.ethereum
// instantiate
const dataProtector = new IExecDataProtector(web3Provider)

const register = async (tvl, email) => {
	// const result = await 
	const computedTVL = Math.pow(10,Math.floor(Math.log10(tvl)))
	dataProtector.protectData({
		data: {
			email: email,
			TVL: computedTVL
		}
	}).then(result => {
		document.getElementById('result').innerHTML = result
		console.log(result)
})
		.catch(err => console.log(err))
}

// const registerOBS = async (tvl, email) => {
// 	dataProtector
// 		.protectDataObservable({
// 			data: {
// 				email: email,
// 				TVL: computedTVL,
// 			},
// 			name: 'DaoContact',
// 		})
// 		.subscribe(
// 			(data) => {
// 				console.log("➡ data:", data)
// 				if (data.message === 'PROTECTED_DATA_DEPLOYMENT_SUCCESS') {
// 					console.log("✅", data.address)
// 				}
// 			}
// 			,
// 			(e) => console.log("➡ e:", e),
// 			() => console.log('➡ DONE')
// 		)
// };

const registerBtn = document.getElementById('register-btn')
const emailInput = document.getElementById('email-input')
const tvlInput = document.getElementById('tvl-input')

registerBtn.addEventListener('click', () => {
	const email = emailInput.value
	const tvl = tvlInput.value
	register(tvl,email)
})
