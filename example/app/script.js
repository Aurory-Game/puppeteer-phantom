import * as anchor from '@project-serum/anchor/dist/browser'
import { Buffer } from 'buffer/'
import PROGRAM_IDL from '../target/idl/example.json'

window.Buffer = Buffer

const connection = new anchor.web3.Connection(
  'http://localhost:8899',
  anchor.Provider.defaultOptions().preflightCommitment
)
const provider = new anchor.Provider(connection, window.solana, {})
anchor.setProvider(provider)

const program = new anchor.Program(PROGRAM_IDL, 'yfetrhfXx3VBdhx31PkxySB54xX53LXt9S3NrD44pAf', provider)

let addressLabel, button, isConnected, isAirdropped, isInitialized, user

window.onload = onPageLoad

function onPageLoad() {
  addressLabel = document.getElementById('address-label')
  button = document.getElementById('button')
  button.onclick = onClick
}

async function onClick() {
  if (isConnected) {
    if (isInitialized) {
      await increment()
    } else if (isAirdropped) {
      await initialize()
    } else {
      await airdrop()
    }
    return
  }
  connect()
}

async function connect() {
  try {
    const res = await window.solana.connect()
    addressLabel.innerText = res.publicKey.toString()
    button.innerText = 'airdrop'

    user = new anchor.web3.PublicKey(provider.wallet.publicKey.toString())
    isConnected = true
  } catch (err) {
    console.log(err)
  }
}

async function airdrop() {
  const sig = await connection.requestAirdrop(user, 1 * anchor.web3.LAMPORTS_PER_SOL)
  await connection.confirmTransaction(sig)

  isAirdropped = true
  button.innerText = 'initialize'
}

async function initialize() {
  try {
    const [counter, counterBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode('counter')), user.toBuffer()],
      program.programId
    )

    await program.rpc.initialize(counterBump, {
      accounts: {
        counter: counter,
        user: user,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    })

    isInitialized = true
    button.innerText = 'increment'
  } catch (err) {
    console.log(err)
  }
}

async function increment() {
  const [counter, counterBump] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from(anchor.utils.bytes.utf8.encode('counter')), user.toBuffer()],
    program.programId
  )

  await program.rpc.increment({
    accounts: {
      counter: counter,
    },
  })

  button.innerText = 'done'
}
