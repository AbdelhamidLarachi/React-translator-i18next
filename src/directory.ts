const fs = require("fs");
const path = require('path');
const os = require('os');
const glob = require('glob');


class Directory {

  /** 
  * @directory = /desktop/project
  * */

  public static readonly PATH: string = path.join(os.homedir(), "Desktop", "project");

  /** 
  * Create direcotry if not exists
  * recursive so it create every dir in our path
  * @param dir (string)
  * @returns void
  * */


  public static create(dir: string): void {
    // extract folder in case it's a filename
    dir = path.dirname(dir);
    // create if do not exists
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }


  /** 
   * Load jsx | tsx files
   * @param order (order)
   * @returns files
   * */


  public static load(): string[] {
    return glob.sync(Directory.PATH + '/**/*(*.tsx|*.jsx)')
      // ignore .build folder
      .filter((f: string) => !f.includes("build"));
  }
}



export default Directory;