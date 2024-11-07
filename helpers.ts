
export default class Helper {
    // Simple helper class that contains the business logic
    // of the app. This is extracted here to allow unit testing
    constructor() {
    }

    static getNestingLevel(task_marker: string): number {
        // The nesting level is the number of spaces before the first "-" character
        let parts = task_marker.replaceAll("\n", "").split("-");
        return parts[0].length;
    }

    static generateRandomDigits(length: number): string {
      const digits = '0123456789';
      let randomString = '';

      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        randomString += digits[randomIndex];
      }

      return randomString;
    }
}