export interface CustomFieldDefinition {
    id?: number;
    entityTypes: string[];
    fieldKey: string;
    label: string;
    fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'BOOLEAN';
    options?: string[];
    isRequired: boolean;
    defaultValue?: string;
    uiOrder: number;
}
