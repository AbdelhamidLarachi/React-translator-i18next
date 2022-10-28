# React-translator-i18next

***Open-Source*** project made to ***auto translate*** react  apps using ***i18next***, this project should ***extract***, ***translate*** and ***replace*** your components texts, then ***generates*** the Json language file. 


## Works as follows : 

-   **Extract text from components / props / yup :** nothing to write here, you can just go to the next part,  so it feels like a description.
-   **Convert JSX / TSX files to i18n hook :** by replacing theses texts with your i18n hook function, adding imports, and initializing hooks.
- **Translate detected texts :** deepl api was used for translating part, you just need to set your free api key on the .env file.
- **Generate JSON language file:** it should generate the final json files for the languages you've selected.


## Installation

* set your default project path in src/directory. `Desktop/project` by default ( don't forget to make a project copy ).
* Run `npm install` then >  `npm start` 
* Check your `project/langs` folder for json files
* Your JSX / TSX files should be translated now.

## Contributing

The main purpose of this repository is to continue evolving and to help lazy ass developers, we should expect a lot of bugs in this type of projects, so i invite you to contribute by creating a pull request or report issues. 

Thanks for your support.

### License

[MIT licensed](./LICENSE).
