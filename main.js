import { IExecDataProtector } from "@iexec/dataprotector"

const { VITE_PUBLIC_KEY, VITE_WEB3MAIL_ADDRESS, VITE_PRIVATE_KEY, VITE_PROTECTED_DATA} = import.meta.env;
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
const emailInput = document.getElementById('email-input')
const tvlInput = document.getElementById('tvl-input')

registerBtn.addEventListener('click', () => {
	const email = emailInput.value
	const tvl = tvlInput.value
	register(tvl,email)
})

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
		dataDiv.innerHTML = ` ${Math.pow(10, i)} and ${Math.pow(10, i+1)}`
		document.getElementById('list-protected-data').appendChild(dataDiv)
		const dataSpan = document.createElement('span')
		dataSpan.innerHTML = `(${contactsPerCategory[i]} sellers)`
		dataSpan.className = 'right grey'
		dataDiv.appendChild(dataSpan)
		const dataBtn = document.createElement('button')
		dataBtn.innerHTML = `Contact`
		dataBtn.className = 'right'
		dataDiv.appendChild(dataBtn)
		dataBtn.addEventListener('click', () => {
			console.log("Contact" + i)
			console.log(contactsPerCategory[i])
			const messageInput = document.getElementById('message-input')
			sendMail(messageInput.value, VITE_PROTECTED_DATA)
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