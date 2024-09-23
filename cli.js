
import fs from 'fs'
import process from 'process'
import sha3 from './libsha3.js'


let inputFile = process.argv[2]

function printErrorMessage() {
    console.log('Usage: node cli.js <yourFile> <standard> <shakeOutputLength?>')
    console.log('Where valid standards are: sha3-224, sha3-256, sha3-384, sha3-512, shake128, shake256')
    console.log('')
    console.log('Example:')
    console.log('Step 1. Create a file named myfile and put the word hello in it. Save.')
    console.log('Step 2. Run the following command: node cli.js myfile sha3-256')
    console.log('Step 3. Compare the result with OpenSSL: openssl dgst -sha3-256 -c myfile')
}

if (!inputFile) {
    printErrorMessage()
    process.exit(1)
}

let chosenStandard = process.argv[3]
let validStandards = ['sha3-224', 'sha3-256', 'sha3-384', 'sha3-512', 'shake128', 'shake256']

if (!chosenStandard || !sha3.isOneOf(chosenStandard, validStandards)) {
    printErrorMessage()
    process.exit(1)
}

let chosenShakeOutputLength = process.argv[4]

try {
    chosenShakeOutputLength = Number(chosenShakeOutputLength)
}
catch(er) {
    printErrorMessage()
    process.exit(1)
}

let inputBytes = fs.readFileSync(inputFile)
let inputBits = sha3.byteArrToBitArr(inputBytes)
let hashOutput = sha3.hash(inputBits, chosenStandard, chosenShakeOutputLength)
if (!hashOutput.success) {
    console.log(`Oops :( ${hashOutput.message}`)
    process.exit(1)
}

let outputBits = hashOutput.hash
let outputBytes = sha3.bitArrToByteArr(outputBits)

console.log('Hash: ' + outputBytes.map(a => a.toString(16).padStart(2,'0')).join(' '))
process.exit(0)
