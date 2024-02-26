import { ApolloDynamic } from '../builder/apollo-dynamic.factory';
import { SelectionOptions } from '../types/selection-options';

/**
 * Decorator that is used to add a entity type for use in Apollo Dynamic Selection.
 *
 * @param {string} name - The name of the entity type. It's the name used for the selection in the query.
 * @returns {ClassDecorator} - The decorator function.
 */
export function SelectionType(name: string, options?: TypeOptions): ClassDecorator {
  return (target) => {
    ApolloDynamic.types[name] = target.name;
    ApolloDynamic.default[name] = options?.default || {};
  };
}

export type TypeOptions = {
  default?: SelectionOptions;
};
