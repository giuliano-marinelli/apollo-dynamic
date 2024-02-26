import { ApolloDynamic } from '../builder/apollo-dynamic.factory';

/**
 * Decorator that is used to add a field for use in Apollo Dynamic Selection.
 *
 * @param {FieldOptions} options - The options for the field (include or skip conditions).
 * @returns {PropertyDecorator} The decorator function.
 */
export function SelectionField(): PropertyDecorator;
export function SelectionField(options: FieldOptions): PropertyDecorator;
export function SelectionField<T>(returnTypeFunction?: ReturnTypeFunc<T>, options?: FieldOptions): PropertyDecorator;
export function SelectionField<T>(
  returnTypeFuncOrOptions?: ReturnTypeFunc<T> | FieldOptions,
  options?: FieldOptions
): PropertyDecorator {
  return (target, propertyKey) => {
    let [typeFunc, opt] =
      typeof returnTypeFuncOrOptions === 'function'
        ? [returnTypeFuncOrOptions, options]
        : [undefined, returnTypeFuncOrOptions];

    if (!opt) opt = {};

    if (!ApolloDynamic.selectionFields[target.constructor.name])
      ApolloDynamic.selectionFields[target.constructor.name] = [];
    ApolloDynamic.selectionFields[target.constructor.name].push({ typeFunction: typeFunc, options: opt, propertyKey });
  };
}

export type FieldOptions = {
  include?: string | ((conditions?: any) => boolean);
  skip?: string | ((conditions?: any) => boolean);
};

export type ReturnTypeFunc<T> = () => T;
