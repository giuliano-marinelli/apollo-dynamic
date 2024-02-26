import { ApolloDynamic, ApolloDynamicFactory, select } from './builder/apollo-dynamic.factory';
import { FieldOptions, ReturnTypeFunc, SelectionField } from './decorators/selection-field.decorator';
import { SelectionType } from './decorators/selection-type.decorator';

//builder
export { ApolloDynamic, ApolloDynamicFactory, select };
//decorators
export { SelectionType, SelectionField, FieldOptions, ReturnTypeFunc };
