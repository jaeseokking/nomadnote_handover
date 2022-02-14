//유효성 검사
export const validPhone = (phoneNumber) => {
    //const regExp =   /^​\d{3}\d{3,4}\d{4}$/;
    const regExp = /[0-9]$/g;
    const result = regExp.test(phoneNumber);
    console.log('Phone number validation : ',result);
    return result
}

export const validAge = (age) => {
    const regExp = /[0-9]$/g;
    const result = regExp.test(age);
    console.log('Age validation : ',result);

    return result
}

