require('dotenv').config();
const path = require('path');

import * as deepl from 'deepl-node';
import Directory from './directory';
import File_ from './file';


export interface ITranslateObject {
  phrase: string;
  propertyName: string;
  t: string;
}


export interface ITranslate {
  translation: Object | any;
}


class Translate {

  private static readonly from: deepl.SourceLanguageCode = 'en';
  private static readonly to: deepl.TargetLanguageCode[] = ['en-US', 'fr'];
  private static translator = new deepl.Translator(process.env.AUTH_KEY || '');


  /** 
  * Translate text
  * @param q (string)
  * @returns string
  * */


  private static async translate(str: string, target: deepl.TargetLanguageCode): Promise<string> {
    const result = await this.translator.translateText(str, this.from, "fr");
    return result.text;
  }


  /** 
  * Translate text to target languages
  * @param str (string)
  * @returns translations (object) 
  * */


  private static async getAllTranslations(str: string[]): Promise<Object> {
    let translated: Object = {};

    for (let i = 0; i < this.to.length; i++) {

      // if source language == target
      if (this.to[i].includes(this.from)) {

        // keep original
        translated = {
          ...translated,
          [this.to[i]]: str
        }

        continue;
      };

      /**
      * @LIMIT_SIZE
      * The total deepl request body size must not exceed 128 KiB (128 · 1024 bytes). 
      * Please split up your text into multiple calls if it exceeds this limit.
      **/

      const batch_size = 20;
      let res: string[] = [];

      for (let y = 0; y < str.length; y += batch_size) {

        const batch = new Array(...str).splice(y, batch_size);
        if (batch.length == 0) break;

        const text = batch.join('</>');
        let result = await this.translate(text, this.to[i]);

        // concat result
        res = [...res, ...result.split('</>')];
      }

      // set language result
      translated = {
        ...translated,
        [this.to[i]]: res
      }
    }

    return translated;
  }


  /** 
  * Translate text to target languages
  * @param str (string)
  * @returns translations (object) 
  * */


  public static fetch(ts: ITranslate): void {
    // convert object array to string
    const text: string[] = Object.values(ts.translation);


    this.getAllTranslations(text)
      .then((res: Object) => this.createJSON(ts, res))
      .catch((e: any) => console.log(e))
  }



  /** 
  * Generate json file
  * @ex [{ en: '', es: ''... }]
  * @param str (string)
  * @returns JSON
  * */


  private static createJSON(ts: ITranslate, translations: Object | any): void {

    this.to.forEach((lang: string) => {
      try {
        const json = ts;
        if (!translations[lang]) return;

        const text: string[] = translations[lang];

        // get english property names
        Object.keys(json.translation).forEach(function (key, i) {
          json.translation[key] = text[i]
        });

        // write file
        File_.write(path.join(Directory.PATH, "lang", `${lang}.json`), JSON.stringify(json));
      }
      catch (e) { console.log(e) }
    });

  }
}



export default Translate;