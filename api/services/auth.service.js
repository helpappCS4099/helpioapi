const bcrypt = require('bcrypt')

/**
 * BCRYPT hashing of data
 * @param {*} password 
 * 
 */
exports.hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    return hashedPassword
}

/**
 * BCRYPT cleartext and hash validation
 * @param {*} password 
 * @param {*} hashedPassword 
 * 
 */
exports.comparePassword = async (password, hashedPassword) => {
    const match = await bcrypt.compare(password, hashedPassword)
    return match
}





