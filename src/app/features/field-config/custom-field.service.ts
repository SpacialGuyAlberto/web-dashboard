import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { CustomFieldDefinition } from './custom-field.model';

@Injectable({
    providedIn: 'root'
})
export class CustomFieldService {
    private readonly STORAGE_KEY = 'mock_custom_fields';

    constructor(private http: HttpClient) {
        this.initializeMockData();
    }

    private initializeMockData() {
        if (!sessionStorage.getItem(this.STORAGE_KEY)) {
            const mockFields: CustomFieldDefinition[] = [
                {
                    id: 1, entityTypes: ['SEGMENT'], fieldKey: 'soil_type', label: 'Soil Type',
                    fieldType: 'SELECT', options: ['Sandy', 'Clay', 'Rocky'], isRequired: true, uiOrder: 1
                },
                {
                    id: 2, entityTypes: ['PROJECT'], fieldKey: 'permit_number', label: 'Permit Number',
                    fieldType: 'TEXT', isRequired: true, uiOrder: 1
                },
                {
                    id: 3, entityTypes: ['SUBCONTRACTOR'], fieldKey: 'insurance_expiry', label: 'Insurance Expiry',
                    fieldType: 'DATE', isRequired: false, uiOrder: 2
                }
            ];
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(mockFields));
        }
    }

    private getFields(): CustomFieldDefinition[] {
        const data = sessionStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    private saveFields(fields: CustomFieldDefinition[]) {
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(fields));
    }

    getFieldsForEntity(entityType: string): Observable<CustomFieldDefinition[]> {
        const fields = this.getFields();
        const filtered = fields.filter(f => f.entityTypes.includes(entityType));
        return of(filtered);
    }

    getAllFields(): Observable<CustomFieldDefinition[]> {
        return of(this.getFields());
    }

    getField(id: number): Observable<CustomFieldDefinition> {
        const field = this.getFields().find(f => f.id === id);
        if (field) return of(field);
        throw new Error('Field not found');
    }

    createField(field: CustomFieldDefinition): Observable<CustomFieldDefinition> {
        const fields = this.getFields();
        const newField = { ...field, id: Date.now() };
        fields.push(newField);
        this.saveFields(fields);
        return of(newField);
    }

    updateField(id: number, field: CustomFieldDefinition): Observable<CustomFieldDefinition> {
        const fields = this.getFields();
        const index = fields.findIndex(f => f.id === id);
        if (index !== -1) {
            fields[index] = { ...field, id };
            this.saveFields(fields);
            return of(fields[index]);
        }
        throw new Error('Field not found');
    }

    deleteField(id: number): Observable<void> {
        const fields = this.getFields();
        const kept = fields.filter(f => f.id !== id);
        this.saveFields(kept);
        return of(void 0);
    }
}
