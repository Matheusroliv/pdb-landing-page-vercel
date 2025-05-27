export default class LocalStorageUtil {
  public static set(key: LocalStorageKeys, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  public static get(key: LocalStorageKeys): any {
    const localValue = JSON.parse(localStorage.getItem(key) || '');
    if (key == LocalStorageKeys.user) {
      return localValue;
    }
    if (localValue) {
      return JSON.parse(localValue);
    }
    return null;
  }
  public static remove(key: LocalStorageKeys) {
    localStorage.removeItem(key);
  }
  public static clear() {
    localStorage.clear();
    // localStorage.removeItem('valueCoin');
    // localStorage.removeItem('user');
    // localStorage.removeItem('checkoutType');
    // localStorage.removeItem('phone');
    // localStorage.removeItem('email');
    // localStorage.removeItem('hasPassword');
    // localStorage.removeItem('receiveType');
    // localStorage.removeItem('dueDate');
    // localStorage.removeItem('receiveValue');
    // localStorage.removeItem('receiveValuePix');
    // localStorage.removeItem('password');
    // localStorage.removeItem('userInfo');
    // localStorage.removeItem('emailToTransfer');
    // localStorage.removeItem('nameToTransfer');
    // localStorage.removeItem('phoneToTransfer');
    // localStorage.removeItem('chosenPixValue');
    // localStorage.removeItem('keyType');
    // localStorage.removeItem('keyPIX');
    // localStorage.removeItem('chosenTransferValue');
    // localStorage.removeItem('waySendCode');
    // localStorage.removeItem('periodPreference');
    // localStorage.removeItem('verificationMethod');
    // localStorage.removeItem('newEmail');
    // localStorage.removeItem('newPhone');
    // localStorage.removeItem('fromDetails');
  }
}
export enum LocalStorageKeys {
  user = 'user'
}
