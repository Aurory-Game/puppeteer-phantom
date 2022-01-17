import * as puppeteer from './puppeteer'
import { sleep } from './utils'

export type Network = 'Mainnet Beta' | 'Testnet' | 'Devnet' | 'Localhost'

/**
 * Setup extension
 *
 * @param mnemonic
 * @param password
 * @param network
 * @param browserArgs
 */
export async function setup({
  mnemonic,
  password,
  network,
  browserArgs,
}: {
  mnemonic: string
  network?: Network
  password: string
  browserArgs?: string[]
}) {
  await puppeteer.setupBrowser(browserArgs ?? [])
  const onboarding = await puppeteer.setupWindows()

  // if (onboarding) {
  await importWallet(mnemonic, password)
  // } else {
  //   await puppeteer.setupPhantomWindow()
  //   await unlock(password)
  //   await puppeteer.teardownPhantomWindow()
  // }
  await changeNetwork(network)

  return true
}

/**
 * Accept access
 */
export async function acceptAccess() {
  const page = await puppeteer.switchToPhantomNotification()
  const doc = await page!.getDocument()
  const button = await doc.findByText('Connect', { selector: 'button' })
  await sleep(2000)
  button.click()
  await sleep(3000)
  return true
}

/**
 * Import wallet
 */
async function importWallet(mnemonic: string, password: string) {
  const page = puppeteer.getPhantomWindow()
  const doc = await page.getDocument()

  // wait for welcome text, and click "recover wallet"
  await doc.findByText('A crypto wallet reimagined for DeFi & NFTs', {}, { timeout: 10000 })
  ;(await doc.findByText('Use Secret Recovery Phrase')).click()

  // click "recover wallet"
  await doc.findByText('Secret Recovery Phrase', {}, { timeout: 10000 })
  // (await doc.findByPlaceholderText('Secret phrase')).type(mnemonic);
  await page.focus('textarea')
  await page.keyboard.type(mnemonic)
  ;(await doc.findByText('Import secret recovery phrase')).click()

  // click import selected accounts
  await doc.findByText('Import Accounts', {}, { timeout: 10000 })
  ;(await doc.findByText('Import Selected Accounts')).click()

  // set password
  await doc.findByText('Create a password', {}, { timeout: 10000 })
  // (await doc.findByPlaceholderText('Password')).type(password);
  await page.focus('input[name="password.first"]')
  await page.keyboard.type(password)
  // (await doc.findByPlaceholderText('Confirm Password')).type(password);
  await page.focus('input[name="password.confirm"]')
  await page.keyboard.type(password)
  // (await doc.findByLabelText('Terms of Service')).click();
  ;(await page.$('input[type="checkbox"]'))!.click()
  await page.waitForTimeout(500)
  ;(await doc.findByText('Save')).click()

  // dismiss keyboard shortcut tip
  await doc.findByText('Keyboard shortcut', {}, { timeout: 10000 })
  ;(await doc.findByText('Continue')).click()

  // finish
  await doc.findByText(`You're all done!`, {}, { timeout: 10000 })
  ;(await doc.findByText('Finish')).click()
}

// async function unlock(password: string) {
//   const page = puppeteer.getPhantomWindow()
//   const doc = await page.getDocument()
//   // (await doc.findByPlaceholderText('Password')).type(password);
//   await page.focus('input')
//   await page.keyboard.type(password)
//   ;(await doc.findByText('Unlock')).click()
//   return true
// }

async function changeNetwork(networkName?: Network) {
  if (!networkName || networkName === 'Mainnet Beta') return

  await puppeteer.setupPhantomWindow()

  const page = puppeteer.getPhantomWindow()
  const doc = await page.getDocument()

  const tablist = await doc.findByRole('tablist')

  const settings = await tablist.$('a:last-child')
  settings!.click()

  const changeNetwork = await doc.findByText('Change Network', {}, { timeout: 10000 })
  changeNetwork.click()

  const network = await doc.findByText(networkName, {}, { timeout: 10000 })
  network.click()

  await puppeteer.teardownPhantomWindow()
}

/**
 * Approve transaction
 */
export async function approveTx() {
  const page = await puppeteer.switchToPhantomNotification()
  const doc = await page!.getDocument()
  const button = await doc.findByText('Approve')
  button.click()
  await puppeteer.getPhantomWindow().waitForTimeout(3000)
  return true
}
