import Converter from "./converter";
import Directory from "./directory";
import File_ from "./file";
import Translate, { ITranslate } from "./Translate";



class Main {

    toTranslate: ITranslate = { translation: {} };

    constructor() {
        this.main()
    }


    public main(): void {
        const files: string[] = Directory.load();
        console.log(files.length, ' file found.')

        files.forEach((file: string, i: number) => {
            process.stdout.write(`converting...[${i + 1}/${files.length}] file\r`)
            // convert file
            const converter = new Converter(file);
            converter.convert();

            // write result
            File_.write(file, converter.jsx);

            // concat phrases to translate
            this.toTranslate.translation = {
                ...this.toTranslate.translation,
                ...converter.translation
            };
        });

        console.log("\ntranslating...");
        // translate *
       // Translate.fetch(this.toTranslate);
    }
}


new Main();