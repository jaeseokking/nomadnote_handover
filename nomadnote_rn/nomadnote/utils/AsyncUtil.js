import AsyncStorage from '@react-native-async-storage/async-storage';

const isEmpty = function (value) {
    if (value === '' || value === null || value === undefined || (value !== null && typeof value === 'object' && !Object.keys(value).length)) {
        return true;
    } else {
        return false;
    }
};

// AsyncStorage get 함수 모듈
export const getItemFromAsync = (storageName) => {
    if (isEmpty(storageName)) {
        throw Error('Storage Name is empty');
    }

    return new Promise((resolve, reject) => {
        AsyncStorage.getItem(storageName, (err, result) => {
            if (err) {
                reject(err);
            }

            if (result === null) {
                resolve(null);
            }

            resolve(JSON.parse(result));
        });
    });
};

// AsyncStorage set 함수 모듈
export const setItemToAsync = (storageName, item) => {
    if (isEmpty(storageName)) {
        throw Error('Storage Name is empty');
    }

    return new Promise((resolve, reject) => {
        AsyncStorage.setItem(storageName, JSON.stringify(item), (error) => {
            if (error) {
                reject(error);
            }

            resolve('입력 성공');
        });
    });
};

// AsyncStorage remove 함수 모듈
export const removeItemToAsync = async (key) => {
    if (isEmpty(key)) {
        throw Error('Storage Name is empty');
    }

    try {
        await AsyncStorage.removeItem(key);
        return true;
    }
    catch (exception) {
        return false;
    }
};

export const clearAsync = async () => {
    AsyncStorage.clear();
}