

class Helper {

  /** 
  * Count char occurence in a given string
  * @param str (string)
  * @param letter (string)
  * @returns number
  * */


  public static countOccurence(str: string, letter: string): number {
    let count = 0;

    // looping through the items
    for (let i = 0; i < str.length; i++) {
      // check if the character is at that position
      if (str.charAt(i) == letter) {
        count += 1;
      }
    }

    return count;
  }


  /** 
   * Number is odd
   * @param number (number)
   * @returns boolean
   * */


  public static isOdd(number: number): boolean {
    return (number % 2) == 1;
  }
}



export default Helper;