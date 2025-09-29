const bcrypt = require('bcryptjs')

exports.generatePassword = (length = 8, includeSpecialChars = false) => {
    let charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    if (includeSpecialChars) {
        charset += "!@#$%^&*()_+[]{}|;:,.<>?";
    }

    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset.charAt(randomIndex);
    }
    return password;
};

exports.cryptPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};
