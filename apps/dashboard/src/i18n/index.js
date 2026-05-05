import { ptBR } from './pt-BR.js';

export const DEFAULT_LOCALE = 'pt-BR';

export const dictionaries = {
  'pt-BR': ptBR,
};

export const t = dictionaries[DEFAULT_LOCALE];
