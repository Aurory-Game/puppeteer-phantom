import assert from 'assert'
import path from 'path'
import * as phantom from '../../src'
import * as anchor from '@project-serum/anchor'
import { Example } from '../target/types/example'
import { ElementHandle } from 'puppeteer'

describe('example', () => {
  const provider = anchor.Provider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.Example as anchor.Program<Example>

  let counter: anchor.web3.PublicKey | null = null
  let counterBump: number | null = null

  const user = new anchor.web3.PublicKey('CPccnbSD6VEhXaLc4ykeLbYgPnwred4zD3z1V2PTiRQk')

  let doc: ElementHandle | null = null

  before(async () => {
    ;[counter, counterBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode('counter')), user.toBuffer()],
      program.programId
    )
  })

  after(async () => {
    await phantom.getBrowser()?.close()
  })

  it('setups up phantom', async function () {
    await phantom.setup({
      mnemonic: process.env.MNEMONIC!,
      password: process.env.PASSWORD!,
      network: 'Localhost',
    })

    const mainWindow = phantom.getMainWindow()

    await mainWindow.goto('http://localhost:7000')

    doc = await mainWindow.getDocument()
    ;(await doc!.findByTestId('button')).click()

    const connected = await phantom.acceptAccess()
    assert.ok(connected)

    await doc!.findByText(user.toString(), {}, { timeout: 10_000 })
  })

  it('requests SOL', async () => {
    await doc.findByText('airdrop', {}, { timeout: 100000 })
    ;(await doc!.findByTestId('button')).click()
    await doc.findByText('initialize', {}, { timeout: 100000 })
  })

  it('initializes counter', async () => {
    ;(await doc!.findByTestId('button')).click()
    await phantom.sleep(2000)
    await phantom.approveTx()
    await doc.findByText('increment', {}, { timeout: 100000 })

    const counterInfo = await program.account.counter.fetch(counter)
    assert.ok(counterInfo.user.equals(user))
    assert.ok(counterInfo.count.isZero())
  })

  it('increments counter', async function () {
    ;(await doc!.findByTestId('button')).click()
    await phantom.sleep(2000)
    await phantom.approveTx()
    await doc.findByText('done', {}, { timeout: 100000 })

    const counterInfo = await program.account.counter.fetch(counter)
    assert.ok(counterInfo.user.equals(user))
    assert.ok(counterInfo.count.eq(new anchor.BN(1)))
  })
})
