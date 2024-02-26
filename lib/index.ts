import { ApolloDynamic, ApolloDynamicFactory, select } from './builder/apollo-dynamic.factory';
import { SelectionType, TypeOptions } from './decorators/selection-type.decorator';
import { SelectionField, FieldOptions, ReturnTypeFunc } from './decorators/selection-field.decorator';
import { SelectionOptions } from './types/selection-options';

//builder
export { ApolloDynamic, ApolloDynamicFactory, select };
//decorators
export { SelectionType, SelectionField };
//types
export { SelectionOptions, TypeOptions, FieldOptions, ReturnTypeFunc };
