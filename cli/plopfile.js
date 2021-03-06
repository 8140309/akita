const promptDirectory = require('inquirer-directory');
const path = require('path');
const pluralize = require('pluralize');
const finder = require('find-package-json');
const pjson = finder(process.cwd()).next().value;
let userPath, customFolderName, isAngular = true;

module.exports = function( plop ) {
  userPath = pjson.akitaCli && pjson.akitaCli.basePath || '';
  customFolderName = (pjson.akitaCli && pjson.akitaCli.customFolderName) || false;
  if( pjson.akitaCli && 'isAngular' in pjson.akitaCli ) {
    isAngular = pjson.akitaCli.isAngular;
  }
  const userConfig = path.resolve(process.cwd(), userPath);
  const basePath = userConfig || process.cwd();

  plop.setPrompt('directory', promptDirectory);

  const chooseDirAction = {
    type    : 'directory',
    name    : 'directory',
    message : 'Choose a directory..',
    basePath: basePath
  };

  const customFolderNameAction = {
    type   : 'input',
    name   : 'folderName',
    message: 'Give me a folder name, please'
  };

  plop.setGenerator('Akita', {
    description: 'Create new stack',
    prompts    : [
      {
        type   : 'input',
        name   : 'name',
        message: 'Give me a name, please 😀'
      },
      {
        type   : 'list',
        name   : 'storeType',
        choices: ['Entity Store', 'Store'],
        message: 'Which store do you need? 😊'
      }
    ].concat(customFolderName ? customFolderNameAction : [], chooseDirAction),
    actions    : function( data ) {
      const { storeType, directory, folderName } = data;

      data.isStore = storeType === 'Store';
      data.isEntityStore = storeType === 'Entity Store';
      const templateBase = isAngular ? 'angular' : 'other';

      const index = {
        type        : 'add',
        skipIfExists: true,
        path        : buildPath('index.ts', directory, folderName),
        templateFile: `./templates/${templateBase}/index.tpl`
      };

      const model = {
        type        : 'add',
        skipIfExists: true,
        path        : buildPath('{{ \'singular\' (\'dashCase\' name) name}}.model.ts', directory, folderName),
        templateFile: `./templates/${templateBase}/model.tpl`
      };

      const query = {
        type        : 'add',
        skipIfExists: true,
        path        : buildPath('{{\'dashCase\' name}}.query.ts', directory, folderName),
        templateFile: `./templates/${templateBase}/${data.isEntityStore ? 'entity-query' : 'query'}.tpl`
      };

      const service = {
        type        : 'add',
        skipIfExists: true,
        path        : buildPath('{{\'dashCase\' name}}.service.ts', directory, folderName),
        templateFile: `./templates/${templateBase}/service.tpl`
      };

      const store = {
        type        : 'add',
        skipIfExists: true,
        path        : buildPath('{{\'dashCase\' name}}.store.ts', directory, folderName),
        templateFile: `./templates/${templateBase}/${data.isEntityStore ? 'entity-store' : 'store'}.tpl`
      };

      return [query, service, store, index].concat(data.isEntityStore ? [model] : []);
    }
  });

  plop.setHelper('switch', function( value, options ) {
    this._switch_value_ = value;
    var html = options.fn(this);
    delete this._switch_value_;
    return html;
  });

  plop.setHelper('case', function( value, options ) {
    if( value == this._switch_value_ ) {
      return options.fn(this);
    }
  });

  plop.setHelper('singular', function( value ) {
    return pluralize.singular(value);
  });

  function buildPath( name, chosenDir, folderName = 'state' ) {
    if( userPath ) {
      return `${userConfig}/${chosenDir}/${folderName}/${name}`;
    }
    return `${process.cwd()}/${chosenDir}/${folderName}/${name}`;
  }

};
