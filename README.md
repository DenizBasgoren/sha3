# SHA-3 Step-by-Step Visualization

Explains the cryptographical hashing algorithms sha3-224, sha3-256, sha3-384, sha3-512, shake128, shake256 in an interactive way. Supports UTF-8 string input, bit and byte input, as well as file input. Works fully offline. [Click here to start!](https://denizbasgoren.github.io/sha3/)

![Screenshot1](https://denizbasgoren.github.io/sha3/screenshot1.png)

![Screenshot2](https://denizbasgoren.github.io/sha3/screenshot2.png)

![Screenshot3](https://denizbasgoren.github.io/sha3/screenshot3.png)

# SHA-3 Javascript Library

```js 
import sha3 from './libsha3.js'
import fs from 'node:fs'
  
// input as an array of bits:
let output = sha3.hash([1,0,1,0,1,1,0,0], 'sha3-256')
  
// input as a file:
let file = fs.readFileSync('filename.txt')
let inputBits = sha3.byteArrToBitArr(file)
output = sha3.hash( inputBits, 'sha3-256')
  
// get the output as hex digits:
output = sha3.bitArrToByteArr(output.hash).map(byte => byte.toString(16))
  
// Supported variants: 'sha3-224', 'sha3-256', 'sha3-384', 'sha3-512',
// 'shake128', 'shake256'
output = sha3.hash([1,0,1,0,1,1,0,0], 'shake128', 80) // 80 bit output
  
// successful output:
// {
// success: true,
// hash: [1,0,1,1, ... ]
// }
  
// unsuccessful output:
// {
// success: false,
// message: 'An error has occured.'
// }
```

# SHA-3 Command Line Utility
```
$ node cli.js filename.txt sha3-256
Hash: d6 ea 8f 9a 1f 22 e1 29 8e 5a 95 06 bd 06 6f 23 cc 56 00 1f 5d 36 58 23 44 a6 28 64 9d f5 3a e8
$ node cli.js filename.txt shake128 80
Hash: ee 8e e3 ad a0 79 99 6b 80 d9

$ openssl dgst -sha3-256 -c filename.txt
SHA3-256(notes)= d6:ea:8f:9a:1f:22:e1:29:8e:5a:95:06:bd:06:6f:23:cc:56:00:1f:5d:36:58:23:44:a6:28:64:9d:f5:3a:e8
$ openssl dgst -shake128 -xoflen 10 -c notes
SHAKE-128(notes)= ee:8e:e3:ad:a0:79:99:6b:80:d9
```
