import { IExecDataProtector } from "@iexec/dataprotector"
import { Web3InboxClient } from '@web3inbox/core'

const { VITE_PUBLIC_KEY, VITE_WEB3MAIL_ADDRESS, VITE_PRIVATE_KEY, VITE_PROTECTED_DATA, VITE_PROJECT_ID} = import.meta.env;
const initWeb3Provider = async () => {
	if (!window.ethereum) {
		throw Error('missing injected ethereum provider in page')
	}
	await window.ethereum.request({
		method: 'eth_requestAccounts',
	})
	return window.ethereum
}
const web3Provider = await initWeb3Provider()

const dataProtector = new IExecDataProtector(web3Provider)

const register = async (tvl, email) => {
	const computedTVL = Math.floor(Math.log10(tvl))
	dataProtector.protectData({
		data: {
			email: email,
			TVL: computedTVL
		},
		name: computedTVL + "nata" // hack to make it indexable. 
	}).then(result => {
		document.getElementById('result').innerHTML = "Data protected 🔐 " + result.address
		const grantAccessBtn = document.createElement('button')
		grantAccessBtn.innerHTML = 'Grant Access'
		grantAccessBtn.addEventListener('click', () => {
			grantAccess(result.address)
		})
		document.getElementById('result').appendChild(grantAccessBtn)
	})
	.catch(err => console.log(err))
}

const grantAccess = async (address) => {
	const grantedAccess = await dataProtector.grantAccess({
		protectedData: address,
		authorizedApp: VITE_WEB3MAIL_ADDRESS,
		authorizedUser: VITE_PUBLIC_KEY
	})
	console.log(grantedAccess)
}

const registerBtn = document.getElementById('register-btn')
const subscribeBtn = document.getElementById('subscribe-btn')
const emailInput = document.getElementById('email-input')
const tvlInput = document.getElementById('tvl-input')


registerBtn.addEventListener('click', async () => {
	const email = emailInput.value
	const tvl = tvlInput.value
	const currency = document.getElementById('currency-select').value
	if (currency === 'ETH') {
		tvl = convertedTVL(tvl)
	}

	register(tvl,email)
})

const client = Web3InboxClient.init({ projectId: VITE_PROJECT_ID })
subscribeBtn.addEventListener('click', async () => {

	let accountState = ''
	let subscriptionState = ''

	client.register({ onSign })
	client.watchAccount(acc => (accountState = acc))
	client.watchSubscription(sub => (subscriptionState = sub))
	client.subscribe()
	const messages = client.getMessageHistory()
})

import { ethers } from "ethers";

const convertedTVL =  async (tvl) => {
	const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/YOUR_PROJECT_ID");

	
	const contractAddress = "0x90430C5b8045a1E2A0Fc4e959542a0c75b576439"
	const contractABI = [
		{
			"inputs": [],
			"name": "getLatestPrice",
			"outputs": [
				{
					"internalType": "int256",
					"name": "",
					"type": "int256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		}
	]
	const contract = new ethers.Contract(contractAddress, contractABI, provider)
	const latestPrice = await contract.getLatestPrice()
	const tvlInUSD = tvl * latestPrice / 1e8
	console.log("TVL in USD:", tvlInUSD);
	return tvlInUSD
}



const listProtectedData = await dataProtector.fetchProtectedData({
	schema: {
		"email": "string",
		"TVL": "number"
	}
})

const MAX_CATEGORY = 15
let contactsPerCategory = Array(MAX_CATEGORY).fill(0)
let emailAddresses = []
console.log(contactsPerCategory)
listProtectedData.map(data => {
	if (data.name.endsWith("nata")) {
		let category = data.name.slice(0, -4)
		console.log("💡", category, data)
		contactsPerCategory[category]+=1
		emailAddresses.push(data.address)
	}
})

console.log(contactsPerCategory)

for (let i = 0; i < MAX_CATEGORY; i++) {
	if (contactsPerCategory[i] > 0) {
		const dataDiv = document.createElement('li')
		dataDiv.innerHTML = ` ${Math.pow(10, i)} to ${Math.pow(10, i+1)}`
		document.getElementById('list-protected-data').appendChild(dataDiv)
		const dataSpan = document.createElement('span')
		dataSpan.innerHTML = `(${contactsPerCategory[i]} sellers)`
		dataSpan.className = 'right grey'
		dataSpan.style = 'margin:0em  1em'
		dataDiv.appendChild(dataSpan)
		const dataBtn = document.createElement('button')
		dataBtn.innerHTML = `Contact`
		dataBtn.className = 'right'
		dataDiv.appendChild(dataBtn)

		dataBtn.addEventListener('click', () => {
			console.log("Contact" + i)
			console.log(contactsPerCategory[i])
			// Modal management
			let modal = document.getElementById("myModal")
			modal.style.display = "block"
			let span = document.getElementsByClassName("close")[0]
			span.onclick = function () {
				modal.style.display = "none"
			}
			window.onclick = function (event) {
				if (event.target == modal) {
					modal.style.display = "none"
				}
			}
			const messageInput = document.getElementById('message-input')
			//Send message as email
			let sendEmailBtn = document.getElementById("send-email-btn")
			sendEmailBtn.addEventListener('click', () => {
				sendMail(messageInput.value, VITE_PROTECTED_DATA)
			})
			//Send message as notification
			let sendNotificationBtn = document.getElementById("send-notification-btn")
			sendNotificationBtn.addEventListener('click', async () => {
					//TODO
			});
		})
	}
}

import { IExecWeb3mail } from "@iexec/web3mail"

const web3mail = new IExecWeb3mail(web3Provider) 

const sendMail = async (emailContent, protectedData) => {
	const emailSubject = 'You have received an message from a potential acquirer - Nata'
	const result = await web3mail.sendEmail({
		protectedData,
		emailSubject,
		emailContent
	})

	console.log(result)
}


