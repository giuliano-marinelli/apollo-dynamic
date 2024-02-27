import { SelectionOptions } from '../types/selection-options';
import { DefinitionNode, DocumentNode, SelectionNode, parse, print } from 'graphql';
import { v4 as uuid } from 'uuid';

const CACHE_KEY = 'apollo-dynamic-cache';

export class ApolloDynamicFactory {
  selectionFields: any = {};
  types: any = {};
  default: { [key: string]: SelectionOptions } = {};
  cache: boolean = false;
}

export const ApolloDynamic = new ApolloDynamicFactory();

export function select(document: DocumentNode, selectionOptions?: SelectionOptions): DocumentNode {
  console.log('types', ApolloDynamic.types);

  let cacheKey: string = '';
  let cacheContent: string = '';
  let cachedDocuments: any = {};

  if (ApolloDynamic.cache) {
    cacheKey = print(document);
    cacheContent =
      cacheKey +
      JSON.stringify(selectionOptions, (key, value) => {
        if (typeof value === 'function') {
          return value.toString();
        }
        return value;
      }) +
      JSON.stringify(ApolloDynamic.types) +
      JSON.stringify(ApolloDynamic.default, (key, value) => {
        if (typeof value === 'function') {
          return value.toString();
        }
        return value;
      }) +
      JSON.stringify(ApolloDynamic.selectionFields, (key, value) => {
        if (typeof value === 'function') {
          return value.toString();
        }
        return value;
      });

    cachedDocuments =
      localStorage.getItem(CACHE_KEY) != null ? JSON.parse(localStorage.getItem(CACHE_KEY) as string) : {};
  } else {
    localStorage.removeItem(CACHE_KEY);
  }

  if (ApolloDynamic.cache && cachedDocuments[cacheKey] && cachedDocuments[cacheKey][cacheContent]) {
    return parse(cachedDocuments[cacheKey][cacheContent]);
  } else {
    let dynDocument = parse(print(document));

    const selectionFields = {};
    console.log('document', print(dynDocument));
    scanSelectionFields(dynDocument, selectionFields);
    console.log('scan', print(dynDocument));
    dynDocument = replaceSelectionFields(dynDocument, selectionFields, selectionOptions || {});
    console.log('replace', print(dynDocument));

    if (ApolloDynamic.cache) {
      cachedDocuments[cacheKey] = {};
      cachedDocuments[cacheKey][cacheContent] = print(dynDocument);

      localStorage.setItem(CACHE_KEY, JSON.stringify(cachedDocuments));
    }

    return dynDocument;
  }
}

function scanSelectionFields(document: DocumentNode | DefinitionNode | SelectionNode, fields: any) {
  if (document.kind === 'Document') {
    document.definitions?.forEach((operation) => {
      scanSelectionFields(operation, fields);
    });
  } else if (document.kind === 'OperationDefinition') {
    document.selectionSet?.selections.forEach((field) => {
      scanSelectionFields(field, fields);
    });
  } else if (document.kind === 'Field') {
    if (document.selectionSet?.selections) {
      document.selectionSet.selections.forEach((field) => {
        scanSelectionFields(field, fields);
      });
    } else {
      if (ApolloDynamic.types[document.name.value]) {
        if (!fields[document.name.value]) fields[document.name.value] = uuid();
        (document as any).name.value = fields[document.name.value];
      }
    }
  }
}

function replaceSelectionFields(document: DocumentNode, selectionFields: any, selectionOptions: SelectionOptions) {
  let docStr: string = print(document);

  Object.keys(selectionFields).forEach((selectionType) => {
    const entityRelations = selectionOptions[selectionType]
      ? selectionOptions[selectionType].relations
      : selectionOptions.relations;
    const entityConditions = selectionOptions[selectionType]
      ? selectionOptions[selectionType].conditions
      : selectionOptions.conditions;

    const entityStr = createEntityFields(
      ApolloDynamic.types[selectionType],
      Object.assign(
        {},
        ApolloDynamic.default[selectionType]?.relations || {},
        selectionOptions.relations || {},
        entityRelations || {}
      ),
      Object.assign(
        {},
        ApolloDynamic.default[selectionType]?.conditions || {},
        selectionOptions.conditions || {},
        entityConditions || {}
      )
    );
    docStr = docStr.replaceAll(selectionFields[selectionType], entityStr);
  });

  return parse(docStr) as DocumentNode;
}

function createEntityFields(selectionType: string, relations: any, conditions: any): string {
  const fieldsStr: any[] = [];
  ApolloDynamic.selectionFields[selectionType]?.forEach((field: any) => {
    let include = field.options?.include
      ? typeof field.options?.include == 'function'
        ? field.options.include(conditions)
        : conditions[field.options.include]
      : true;
    let skip = field.options?.skip
      ? typeof field.options?.skip == 'function'
        ? field.options.skip(conditions)
        : conditions[field.options.skip]
      : false;
    if (include && !skip) {
      if (!field.typeFunction) fieldsStr.push(field.propertyKey);
      else if (typeof relations == 'object' && relations[field.propertyKey]) {
        fieldsStr.push(field.propertyKey + '{');
        fieldsStr.push(createEntityFields(field.typeFunction().name, relations[field.propertyKey], conditions));
        fieldsStr.push('}');
      }
    }
  });
  return fieldsStr.join('\n');
}
