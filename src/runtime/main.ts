import {CustomSyntaxHelper} from './customSyntaxHelper';
import {generateTPAParams} from './generateTPAParams';
import {processor} from './processor';
import {defaultCssPlugins} from './defaultCssFunctions';
import {Plugins} from './plugins';
import {IInjectedData, IStyles} from './types';

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

const plugins = new Plugins();
Object.keys(defaultCssPlugins)
  .forEach((funcName) => plugins.addCssFunction(funcName, defaultCssPlugins[funcName]));

export interface IOptions {
  isRTL: boolean;
  prefixSelector: string;
  additionalStyle: string;
}

export type IGetProcessedCssFn = (styles: IStyles, options: Partial<IOptions>) => string;

const defaultOptions = {isRTL: false};

export function loader(loaderOptions): IGetProcessedCssFn {
  return ({siteColors, siteTextPresets, styleParams}: IStyles, options: Partial<IOptions>) => {
    options = {...defaultOptions, ...options};
    const injectedData: IInjectedData = '__INJECTED_DATA_PLACEHOLDER__' as any;
    const prefixedCss = injectedData.css.replace(new RegExp(loaderOptions.prefixSelector, 'g'), options.prefixSelector ? `${options.prefixSelector}` : '');
    // const totalCSS = prefixedCss + '\n' + (options.additionalStyle ? unescape(`${options.additionalStyle}`) : '');
    // console.log('prefixedCss', prefixedCss);
    // console.log('totalCSS', totalCSS);

    const tpaParams = generateTPAParams(siteColors, siteTextPresets, styleParams, options);

    const customSyntaxHelper = new CustomSyntaxHelper();
    customSyntaxHelper.setVars(injectedData.cssVars);
    customSyntaxHelper.setCustomSyntax(injectedData.customSyntaxStrs);

    return customSyntaxHelper.customSyntaxStrs.reduce((processedContent, part) => {
      const newValue = processor({
        part,
        customSyntaxHelper,
        tpaParams
      }, {plugins});

      return processedContent.replace(new RegExp(escapeRegExp(part), 'g'), newValue);
    }, prefixedCss);
  };
}
