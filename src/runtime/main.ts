import {generateTPAParams} from './generateTPAParams';
import {getProcessor} from './processor';
import {cssFunctions} from './cssFunctions';
import {Plugins} from './plugins';
import {IInjectedData, IStyles} from './types';

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

const plugins = new Plugins();
Object.keys(cssFunctions).forEach(funcName => plugins.addCssFunction(funcName, cssFunctions[funcName]));

export interface IOptions {
  isRTL: boolean;
  prefixSelector: string;
  strictMode: boolean;
}

export type IGetProcessedCssFn = (styles: IStyles, options?: Partial<IOptions>) => string;

const defaultOptions = {
  isRTL: false,
  strictMode: true,
};

export function getProcessedCss(
  {siteColors, siteTextPresets, styleParams}: IStyles,
  options: Partial<IOptions>
): string {
  options = {...defaultOptions, ...options};
  const injectedData: IInjectedData = '__COMPILATION_HASH__INJECTED_DATA_PLACEHOLDER' as any;

  if (!injectedData.css) {
    return '';
  }

  const prefixedCss = injectedData.css.replace(
    new RegExp('__COMPILATION_HASH__', 'g'),
    options.prefixSelector ? `${options.prefixSelector}` : ''
  );

  const tpaParams = generateTPAParams(siteColors, siteTextPresets, styleParams, options);

  const processor = getProcessor({cssVars: injectedData.cssVars, plugins});

  return injectedData.customSyntaxStrs.reduce((processedContent, part) => {
    let newValue;
    try {
      newValue = processor.process({part, tpaParams});
    } catch (e) {
      if (options.strictMode) {
        throw e;
      } else {
        newValue = '';
      }
    }
    return processedContent.replace(new RegExp(escapeRegExp(part), 'g'), newValue);
  }, prefixedCss);
}

export function getStaticCss() {
  const injectedData: IInjectedData = '__COMPILATION_HASH__INJECTED_STATIC_DATA_PLACEHOLDER' as any;
  return injectedData.staticCss || '';
}
