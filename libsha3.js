
function isOneOf(thing, array) {
    for (let i = 0; i<array.length; i++) {
        if (thing === array[i]) return true
    }
    return false
}


function byteArrToBitArr(arr) {
    let result = []
    for (let i = 0; i<arr.length; i++) {
        result.push( arr[i] >> 0 & 1 )
        result.push( arr[i] >> 1 & 1 )
        result.push( arr[i] >> 2 & 1 )
        result.push( arr[i] >> 3 & 1 )
        result.push( arr[i] >> 4 & 1 )
        result.push( arr[i] >> 5 & 1 )
        result.push( arr[i] >> 6 & 1 )
        result.push( arr[i] >> 7 & 1 )
    }
    return result
}

function bitArrToByteArr(arr) {
    let result = []
    for (let i = 0; i<arr.length; i+=8) {
        let byte = 0
        byte += arr[i+0] * 2**0
        byte += arr[i+1] * 2**1
        byte += arr[i+2] * 2**2
        byte += arr[i+3] * 2**3
        byte += arr[i+4] * 2**4
        byte += arr[i+5] * 2**5
        byte += arr[i+6] * 2**6
        byte += arr[i+7] * 2**7
        result.push(byte)
    }
    return result
}



function appendArr( arr1, arr2 ) {
    let newArr = []
    for (let i = 0; i<arr1.length; i++) {
        newArr.push(arr1[i])
    }
    for (let i = 0; i<arr2.length; i++) {
        newArr.push(arr2[i])
    }
    return newArr
}

function sliceArr( arr, startIndx, len) {
    let newArr = []
    for (let i = 0; i<len; i++) {
        newArr.push( arr[startIndx+i] )
    }
    return newArr
}

function howManyZerosToPadWith(arrLen, blockLength, isShake) {
    let length = arrLen + 2 + (isShake?4:2)
    let numberOfZeros = blockLength - length % blockLength
    if (numberOfZeros == blockLength) numberOfZeros = 0
    return numberOfZeros
    
}

function addPadding(bitArr, numberOfZeros, isShake) {

    bitArr = appendArr(bitArr, isShake ? [1,1,1,1] : [0,1])
    bitArr = appendArr(bitArr, [1])
    bitArr = appendArr(bitArr, Array(numberOfZeros).fill(0) )
    bitArr = appendArr(bitArr, [1])
    return bitArr
}

function blockLengthFromStandard(standard) {
    if (standard == 'sha3-224') {
        return 1152
    }
    else if (standard == 'sha3-256') {
        return 1088
    }
    else if (standard == 'sha3-384') {
        return 832
    }
    else if (standard == 'sha3-512') {
        return 576
    }
    else if (standard == 'shake128') {
        return 1344
    }
    else if (standard == 'shake256') {
        return 1088
    }
    else {
        return 0
    }
}

function outputLengthFromStandard(standard, shakeOutputLength) {
    if (standard == 'sha3-224') {
        return 224
    }
    else if (standard == 'sha3-256') {
        return 256
    }
    else if (standard == 'sha3-384') {
        return 384
    }
    else if (standard == 'sha3-512') {
        return 512
    }
    else if (standard == 'shake128') {
        return shakeOutputLength
    }
    else if (standard == 'shake256') {
        return shakeOutputLength
    }
    else {
        return 0
    }
}

// returns {success: true, hash: ...} or {success: false, msg: '..'}
function hash(input, standard, shakeOutputLength) {
    let blockLength, outputLength, isShake

    isShake = standard=='shake128' || standard=='shake256'
    blockLength = blockLengthFromStandard(standard)
    outputLength = outputLengthFromStandard(standard, shakeOutputLength)
    
    if ( !blockLength || !outputLength ) {
        return {
            success: false,
            message: `Invalid standard: ${standard}`
        }
    }

    let numberOfZeros = howManyZerosToPadWith(input.length, blockLength, isShake)
    input = addPadding(input, numberOfZeros, isShake)
    let state = createArr(1600)
    let numberOfBlocks = input.length/blockLength

    for (let i = 0; i<numberOfBlocks; i++) {
        let block = sliceArr(input, i*blockLength, blockLength)
        block = appendArr(block, createArr(1600-blockLength) )
        state = xorBitArr(block, state)
        state = blockTransform(state)
    }

    let output = []
    output = appendArr(output, sliceArr(state, 0, blockLength))

    let squeezeRounds = Math.floor( outputLength / blockLength )

    for (let i = 0; i<squeezeRounds; i++) {
        state = blockTransform(state)
        output = appendArr(output, sliceArr(state, 0, blockLength))
    }

    output = sliceArr(output, 0, outputLength)
    return {
        success: true,
        hash: output
    }
}

function createArr(len) {
    return Array(len).fill(0)
}

function getValueOfState(state, x, y, z) {
    return state[y*64*5 + x*64 + z]
}

function setValueOfState(state, value, x, y, z) {
    state[y*64*5 + x*64 + z] = value
}

function getLaneOfState(state, laneNo) {
    let lane = []
    for (let i = 0; i<64; i++) {
        lane.push( getValueOfState(state, laneNo%5, Math.floor(laneNo/5), i) )
    }
    return lane
}

function setLaneOfState(state, lane, laneNo) {
    for (let i = 0; i<64; i++) {
        setValueOfState(state, lane[i], laneNo%5, Math.floor(laneNo/5), i)
    }
}

function shiftLane(lane, shiftAmt) {
    let newLane = Array(64).fill(0)
    for (let i = 0; i<64; i++) {
        newLane[(i+shiftAmt)%64] = lane[i]
    }
    return newLane
}

function xorBitArr(arr1, arr2) {
    let newArr = Array(arr1.length).fill(0)
    for (let i = 0; i<arr1.length; i++) {
        newArr[i] = arr1[i] ^ arr2[i]
    }
    return newArr
}


function getRowOfState(state, rowNo) {
    let row = []
    for (let i = 0; i<5; i++) {
        row[i] = getValueOfState(state, i, Math.floor(rowNo/64), rowNo%64)
    }
    return row
}

function setRowOfState(state, row, rowNo) {
    for (let i = 0; i<5; i++) {
        setValueOfState(state, row[i], i, Math.floor(rowNo/64), rowNo%64)
    }
}

function getColumn(state, columnNo) {
    let column = []
    for (let i = 0; i<5; i++) {
        column[i] = getValueOfState(state, Math.floor(columnNo/64), i, columnNo%64)
    }
    return column
}

function setColumn(state, column, columnNo) {
    for (let i = 0; i<5; i++) {
        setValueOfState(state, column[i], Math.floor(columnNo/64), i, columnNo%64)
    }
}

function createNewPlane() {
    return Array(5*64).fill(0)
}

function getValueOfPlane(plane, x, z) {
    return plane[x*64 + z]
}

function setValueOfPlane(plane, value, x, z) {
    plane[x*64 + z] = value
}

function getLaneOfPlane(plane, laneNo) {
    let lane = []
    for (let i = 0; i<64; i++) {
        lane.push( getValueOfPlane(plane, laneNo, i) )
    }
    return lane
}

function setLaneOfPlane(plane, lane, laneNo) {
    for (let i = 0; i<64; i++) {
        setValueOfPlane(plane, lane[i], laneNo, i)
    }
}

function cloneState(state) {
    let newState = createArr(1600)
    for (let i = 0; i<1600; i++) {
        newState[i] = state[i]
    }
    return newState
}




function rho(state) {
    let newState = createArr(1600)
    let shiftAmt = [0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14]

    for (let i = 0; i<25; i++) {
        setLaneOfState( newState, shiftLane( getLaneOfState(state, i), shiftAmt[i]), i)
    }
    return newState
}

function pi(state) {
    let newState = createArr(1600)
    let destIndx = [0, 6, 12, 18, 24, 3, 9, 10, 16, 22, 1, 7, 13, 19, 20, 4, 5, 11, 17, 23, 2, 8, 14, 15, 21]
    
    for (let i = 0; i<25; i++) {
        setLaneOfState(newState, getLaneOfState(state, destIndx[i]), i)
    }
    return newState
}

function iota(state, round) {
    let newState = cloneState(state)
    let roundConst = []
    roundConst[ 0] = [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,1].reverse()
    roundConst[ 1] = [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 1,0,0,0,0,0,1,0].reverse()
    roundConst[ 2] = [1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 1,0,0,0,1,0,1,0].reverse()
    roundConst[ 3] = [1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0].reverse()
    roundConst[ 4] = [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 1,0,0,0,1,0,1,1].reverse()
    roundConst[ 5] = [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,1].reverse()
    roundConst[ 6] = [1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,1].reverse()
    roundConst[ 7] = [1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,1,0,0,1].reverse()
    roundConst[ 8] = [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,1,0,1,0].reverse()
    roundConst[ 9] = [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,1,0,0,0].reverse()
    roundConst[10] = [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,1,0,0,1].reverse()
    roundConst[11] = [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,1,0,1,0].reverse()
    roundConst[12] = [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 1,0,0,0,1,0,1,1].reverse()
    roundConst[13] = [1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,1,0,1,1].reverse()
    roundConst[14] = [1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 1,0,0,0,1,0,0,1].reverse()
    roundConst[15] = [1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,0,0,1,1].reverse()
    roundConst[16] = [1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,0,0,1,0].reverse()
    roundConst[17] = [1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0].reverse()
    roundConst[18] = [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,1,0,1,0].reverse()
    roundConst[19] = [1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,1,0,1,0].reverse()
    roundConst[20] = [1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,1].reverse()
    roundConst[21] = [1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0].reverse()
    roundConst[22] = [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,1].reverse()
    roundConst[23] = [1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 0,0,0,0,1,0,0,0].reverse()
    
    setLaneOfState( newState, xorBitArr( getLaneOfState(state, 0), roundConst[round]), 0)
    return newState
}

function chi(state) {
    let newState = createArr(1600)
    for (let i = 0; i<64*5; i++) {
        let newRow = createArr(5)
        let row = getRowOfState(state, i)
        newRow[0] = row[0] ^ ( !row[1] & row[2] )
        newRow[1] = row[1] ^ ( !row[2] & row[3] )
        newRow[2] = row[2] ^ ( !row[3] & row[4] )
        newRow[3] = row[3] ^ ( !row[4] & row[0] )
        newRow[4] = row[4] ^ ( !row[0] & row[1] )
        setRowOfState(newState, newRow, i)
    }
    return newState
}

function theta(state) {
    let newState = cloneState(state)
    let planeC = createNewPlane()
    for (let i = 0; i<5; i++) { // x
        for (let j = 0; j<64; j++) { // z
            let c = getColumn(state, i*64+j)
            setValueOfPlane(planeC, c[0]^c[1]^c[2]^c[3]^c[4], i, j)
        }
    }

    let planeD = createNewPlane()
    for (let i = 0; i<5; i++) {
        let leftLane = getLaneOfPlane(planeC, (i+4)%5)
        let rightLane = getLaneOfPlane(planeC, (i+1)%5)
        rightLane = shiftLane(rightLane, 1)
        let newLane = xorBitArr(leftLane, rightLane)
        setLaneOfPlane(planeD, newLane, i)
    }

    for (let i = 0; i<5; i++) {
        for (let j = 0; j<64; j++) {
            let c = getColumn(state, i*64+j)
            c[0] ^= getValueOfPlane(planeD, i, j)
            c[1] ^= getValueOfPlane(planeD, i, j)
            c[2] ^= getValueOfPlane(planeD, i, j)
            c[3] ^= getValueOfPlane(planeD, i, j)
            c[4] ^= getValueOfPlane(planeD, i, j)
            setColumn(newState, c, i*64+j)
        }
    }
    return newState
}

function blockTransform(state) {
    let newState = cloneState(state)
    for (let i = 0; i<24; i++) {
        newState = theta(newState)
        newState = rho(newState)
        newState = pi(newState)
        newState = chi(newState)
        newState = iota(newState, i)
    }
    return newState
}

function printState(state) {
    console.log('--- begin ---')
    for (let i = 0; i<25; i++) {
        console.log( `lane ${i}: ${(getLaneOfState(state,i)).join('')}` )
    }
    console.log('--- end ---')
}

function createNewRandomState() {
    return (
    '0000111100111001111100100100101111011010011010001100101111001000'+
    '1101010110111000110110000111010011011011001100011101001101010111'+
    '0001101111001100000110001001100110101010010110010001110011101100'+
    '0001101110001001110111000111001111111010110010000000111001001100'+
    '0011110110110001110100001011101111011011010010100000111010011001'+
    '1001001010011111100111011001001001110100101110101100010010100111'+
    '0111101001010000101000111111100110011100011110111011010111000000'+
    '1101011000100001010111011110100101000101110001101011100001010010'+
    '0100010000111101110111010110000100100011101100010111011001000111'+
    '1100001100010011011111110011001101000111000111011100001110100011'+
    '0011100111100100011101111110011111100111011101101001101100001111'+
    '0110110000010111001010011001011010001111100011100001000100100100'+
    '0010100000101010110100000101011110001000110111100100011100001100'+
    '0100100101011001111010101100000000010101111110010100110001001011'+
    '1001111010110000000001001000011101100001110100001011011101100110'+
    '0000100010011100110111001011111010110100000110000011001100001111'+
    '0011100100000000110001101101110100010111111111011010111011100001'+
    '1100101000001100011100100001111100010111101100010011000010000011'+
    '1110111001001100010000010000000000100101001110111100111011010101'+
    '1100101010001001110000111101001111101101100001011100111111010110'+
    '0101010111101011100100100011101100000100101011000110111100110011'+
    '0101010010000110101101001110100100010101100111111011101100000100'+
    '0011001111110101101011110000101111011110100110101000000101001100'+
    '0000111011011101000110001010010011101101001001111000111110000110'+
    '0100110110111011101110010011100001001111100101111100011111110000'
    ).split('').map(Number)
}


export default {
    isOneOf,
    byteArrToBitArr,
    bitArrToByteArr,
    appendArr,
    sliceArr,
    howManyZerosToPadWith,
    addPadding,
    blockLengthFromStandard,
    outputLengthFromStandard,
    hash,
    createArr,
    getValueOfState,
    setValueOfState,
    getLaneOfState,
    setLaneOfState,
    shiftLane,
    xorBitArr,
    getRowOfState,
    setRowOfState,
    getColumn,
    setColumn,
    createNewPlane,
    getValueOfPlane,
    setValueOfPlane,
    getLaneOfPlane,
    setLaneOfPlane,
    rho,
    pi,
    iota,
    chi,
    theta,
    blockTransform,
    printState,
    createNewRandomState
}