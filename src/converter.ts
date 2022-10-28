import File_ from "./file";
import Helper from "./helper";
import { ITranslateObject } from "./Translate";


// type Prop = 'label' | 'placeholder' | 'title';
const props = ['label', 'placeholder', 'title'] as const;
type Prop = typeof props[number];


class Converter {

    jsx: string = "";
    private comments: string[];

    /*
     * set initial values
     */

    constructor(p: string) {

        this.jsx = File_.read(p);
        // find lines that are most likely comments
        this.comments = this.jsx.split('\n').filter((line: string) => line.includes('//') || line.includes('*'));
    }

    /** 
     * starts with >
     * ends with </
     * exlude > < /
     * multiple lines
     * */

    private readonly IS_TEXT_REGEX: Readonly<RegExp> = />[^<>]*<\//gm;
    // has at least one letter
    private readonly HAS_LETTER_REGEX: Readonly<RegExp> = /[a-zA-Z]/gm;
    // find text between brackets {*}
    private readonly IS_VARIALBLE_REGEX: Readonly<RegExp> = /\{(.*?)\}/gm;


    /* *
    * placeholder | label space? = space? 
    * may start with " or { or ' or `
    * contain at least one letter between
    * must end with " or } or ' or `
    * case insensetive
    * */

    private readonly IS_PROP_REGEX: Readonly<RegExp> = /(placeholder|label|title)\s?=\s?\w*["{'](.*?)\w*['"}]/gim;

    /* *
    * check if text contains " / ' / `
    * */

    private readonly HAS_CHARS_REGEX: Readonly<RegExp> = /.*["'`].*/gm;

    /* *
    * check if text contains ( or ) or $
    * */

    private readonly HAS_SPECIAL_CHARS_REGEX: Readonly<RegExp> = /.*[()$+].*/gm;


    /* *
    * get only text between "" / '' / ``
    * remove chars
    * */

    private readonly EXTRACT_TEXT_REGEX: Readonly<RegExp> = /(?<=["'`]).*?(?=["'`])/g;

    /* *
    * find default function name
    * const | function | bottom | direct export
    * */

    private readonly DEFAULT_FUNC_REGEX: Readonly<RegExp> = /export default\s?(.*?)\s?(\(|;|=|{|^$)/gm;

    /* *
    * remove special chars from string
    * keep only alphabetics and numbers
    * */

    private readonly NO_SPECIAL_CHARS_REGEX: Readonly<RegExp> = /[^a-zA-Z0-9]/g;


    /* *
    * remove special chars from string
    * keep only alphabetics and numbers
    * */

    private readonly EXTRACT_YUP_REFS: Readonly<RegExp> = /yup.ref(.*?)\)/gim;

    /* *
    * find snackbar functions
    * */

    private readonly IS_SNACKBAR: Readonly<RegExp> = /enqueueSnackbar\(["'](.*?)["']/gm;


    /* *
    * contains objects to be translated
    * */

    translation: Object = {};


    /** 
     * Check if a comment
     * @param component (string)
     * @returns Boolean
     * */


    private isComment = (component: string): Boolean => {
        return this.comments.some((c: string) =>
            c.includes(component) || component.includes(c))
    };



    /** 
     * Check if string has any of these chars
     * @param str (string)
     * @returns Boolean
     * */


    private hasAnyOfChars = (str: string): Boolean => {

        // sometimes it fails only on nodejs for no good reason
        if (this.HAS_CHARS_REGEX.test(str)) return true;

        // extra verification
        if (str.includes('"')) return true
        if (str.includes("'")) return true
        if (str.includes('`')) return true

        return false;
    };


    /** 
    * Convert code using useTranslate
    * @returns new JSX
    * */

    public convert = () => {
        this.replaceText();
        this.replaceProps();
        this.replaceYup();
        this.replaceSnackbars();

        // if there was nothing to replace then return;
        if (Object.values(this.translation).length == 0) return;

        this.importHook()
        this.setHook()
    }


    /** 
    * get property name for string
    * @returns new name
    * */


    private getPropertyName = (phrase: string): ITranslateObject => {

        // Remove single, double, or quotation marks from string
        phrase = phrase
            .trim()
            .replace(/['‘’"“”]/g, '')

        const propertyName = phrase
            .trim()
            // replace spaces with underscore 
            .replace(/\s/g, '_')

        return {
            phrase,
            propertyName,
            t: `{t("${propertyName}")}`
        }
    }


    /** 
    * check if prop is placeholder / label / title
    * @returns prop name
    * */


    private getPropName = (prop: string): Prop | undefined => {
        prop = prop.toLowerCase();
        for (const p of props) { if (prop.includes(p)) return p };
        return undefined;
    }



    /** 
    * Convert code using useTranslate
    * @returns new JSX
    * */

    private replaceText = (): void => {

        // filter results
        const result = (this.jsx.match(this.IS_TEXT_REGEX) || [])
            .filter((o: string) =>
                o.match(this.HAS_LETTER_REGEX)
                && !this.HAS_SPECIAL_CHARS_REGEX.test(o))
            .filter((o: string) => !this.isComment(o));


        // start converting
        for (let i = 0; i < result.length; i++) {

            // removes whitespace / line breaks from the beginning and end of strings. 
            let line = result[i]
                .substring(1, result[i].length - 2)
                .replace(/\s+/g, ' ')
                .trim();

            // extract variables
            const variables: string[] | RegExpMatchArray | null = line.match(this.IS_VARIALBLE_REGEX);
            const phrases: string[] = line
                .split(this.IS_VARIALBLE_REGEX)
                .filter((word: string) => word.match(this.HAS_LETTER_REGEX))

            // has variables
            for (let y = 0; y < phrases.length; y++) {
                let phrase = phrases[y];

                let isVariable = false;
                if (variables) isVariable = variables?.includes(`{${phrase}}`);

                // ignore bad variable cuts
                if (Helper.isOdd(Helper.countOccurence(phrase, '{'))) continue;
                if (Helper.isOdd(Helper.countOccurence(phrase, '}'))) continue;

                // extra check for arrow functions or child components conflicts
                if (phrase.includes('<') || phrase.includes('>')) continue;

                if (!isVariable) {
                    const tObj: ITranslateObject = this.getPropertyName(phrase)
                    // add to translator
                    this.translation = { ...this.translation, [tObj.propertyName]: tObj.phrase };
                    // add t()
                    phrase = tObj.t;
                }

                // add {} for variables
                else phrase = `{${phrase}}`;

                // replace
                phrases[y] = phrase;
            }

            // build final string
            line = `>${phrases.join(" ")}</`;

            // find every result[i] and replace with line
            this.jsx = this.jsx.replace(result[i], line);
        };
    }



    /** 
    * Replace props with translate hook
    * @returns new JSX
    * */

    private replaceProps = (): void => {

        // filter results
        const result = (this.jsx.match(this.IS_PROP_REGEX) || [])
            .filter((o: string) => this.hasAnyOfChars(o) && !o.includes("${"))
            .filter((o: string) => !this.isComment(o))

        // start converting
        for (let i = 0; i < result.length; i++) {

            let line = result[i];

            // if closing brackets is not captured then add it
            if (line.includes('{') && !line.includes('}')) result[i] += "}";

            // extract text
            const text = (line.match(this.EXTRACT_TEXT_REGEX) || [])[0];
            // has no chars or undefined
            if (!text || !text.match(this.HAS_LETTER_REGEX)) continue;

            const tObj: ITranslateObject = this.getPropertyName(text)
            this.translation = { ...this.translation, [tObj.propertyName]: tObj.phrase };

            // build final string
            line = `${this.getPropName(result[i])}=${tObj.t}`;

            // find every result[i] and replace with line
            this.jsx = this.jsx.replace(result[i], line);
        }
    }



    /** 
    * Replace props with translate hook
    * @returns new JSX
    * */

    private replaceYup = (): void => {
        let replaced: string[] = [];

        const startAtIndex = this.jsx.indexOf("yup.object().shape({");
        if (startAtIndex == -1) return;

        const endsAtIndex = this.jsx.indexOf("})", startAtIndex);
        if (endsAtIndex == -1) return;

        // get yup text
        const yup = this.jsx.substring(startAtIndex, endsAtIndex);
        // ignore yup refs
        const refs: string[] = (yup.match(this.EXTRACT_YUP_REFS) || []);

        let yup_ = yup;

        // extract yup strings
        const strings = yup.match(this.EXTRACT_TEXT_REGEX);
        if (!strings || strings.length == 0) return;

        for (let i = 0; i < strings.length; i++) {
            let str = strings[i];

            // check if ref
            if (refs.some((ref: string) => ref.includes(str))) continue;
            // contain variables
            if (str.includes('{') || str.includes('}')) continue;

            const tObj: ITranslateObject = this.getPropertyName(str)

            // build final string
            str = tObj.t.substring(1, tObj.t.length - 1);
            if (replaced.includes(str)) continue;

            this.translation = { ...this.translation, [tObj.propertyName]: tObj.phrase };

            // set new string in yup object
            replaced.push(str);
            yup_ = yup_.split(`"${tObj.phrase}"`).join(str);
        }

        // set new yup
        this.jsx = this.jsx.replace(yup, yup_);
    }



    /** 
    * Replace snackbars with translate hook
    * @returns new JSX
    * */

    private replaceSnackbars = (): void => {

        // filter results
        const result = (this.jsx.match(this.IS_SNACKBAR) || [])
            .filter((o: string) => !this.isComment(o))

        // start converting
        for (let i = 0; i < result.length; i++) {

            let line = result[i];

            // contain variables
            if (line.includes('{') || line.includes('}')) continue;

            // extract text
            const text = (line.match(this.EXTRACT_TEXT_REGEX) || [])[0];
            if (!text || !text.match(this.HAS_LETTER_REGEX)) continue;


            const tObj: ITranslateObject = this.getPropertyName(text)
            this.translation = { ...this.translation, [tObj.propertyName]: tObj.phrase };

            // find every result[i] and replace with line
            this.jsx = this.jsx.replace(result[i], `enqueueSnackbar(t("${tObj.propertyName}")`);
        }
    }



    /** 
    * Import useTranslation hook
    * @returns new JSX
    * */

    private importHook = (): void => {
        this.jsx = "import { useTranslation } from 'react-i18next' \n" + this.jsx;
    }



    /** 
    * get default function name
    * @returns new JSX
    * */

    private getDefaultFunction = (): string | undefined => {
        // find default export line
        const defaultExport = (this.jsx.match(this.DEFAULT_FUNC_REGEX) || [])[0];
        if (!defaultExport) return;

        // remove special chars
        const defFunction = defaultExport
            .replace("function", "")
            .replace("export default ", "")
            .replace(this.NO_SPECIAL_CHARS_REGEX, "")
            .trim();

        return defFunction;
    }



    /** 
    * set useTranslation hook
    * @returns new JSX
    * */

    private setHook = (): void => {

        // get default function name
        const defFunction = this.getDefaultFunction();
        if (!defFunction) return;

        // extract function start ex : Login = () => {
        const DEFAULT_FUNC_START_REGEX = new RegExp(`${defFunction}\\s?[=(](.*?)[)](.*?){`, "gm");

        // get index of func & the next line break index
        const func = (this.jsx.match(DEFAULT_FUNC_START_REGEX) || [])[0];
        if (!func) return;

        const dfIndex = this.jsx.indexOf(func);
        const hookIndex = this.jsx.indexOf('\n', dfIndex);

        // add useState 
        this.jsx =
            this.jsx.substring(0, hookIndex)
            + '\n  const { t, i18n } = useTranslation();\n'
            + this.jsx.substring(hookIndex);
    }
}



export default Converter;