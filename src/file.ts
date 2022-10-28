import Directory from "./directory";

const fs = require("fs");

class File_ {

  /** 
  * Read content from file
  * @param path (string)
  * @returns content (string) JSX
  * */


  public static read(path: string): string {
    return fs.readFileSync(path).toString();
  }


  /** 
  * Write content to file
  * @param content (string)
  * @returns void
  * */


  public static write(path: string, content: string): void {
    // create path if do not exists
    Directory.create(path);

    // write content
    fs.writeFile(path, content, function (err: any) {
      if (err) return console.log(err);
    });
  }
}



export default File_;