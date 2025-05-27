export default class LocalStorageUtil {
  public static set(key: LocalStorageKeys, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  public static get(key: LocalStorageKeys): any {
    const localValue = JSON.parse(localStorage.getItem(key) || '{}');
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
  
}
export enum LocalStorageKeys {
  user = 'user'
}
