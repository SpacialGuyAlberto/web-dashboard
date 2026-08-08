import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomFieldService } from './custom-field.service';
import { CustomFieldDefinition } from './custom-field.model';

@Component({
    selector: 'app-field-config',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './field-config.component.html',
    styleUrls: ['./field-config.component.css']
})
export class FieldConfigComponent implements OnInit {
    fields: CustomFieldDefinition[] = [];
    loading = false;
    error: string | null = null;

    showModal = false;
    isEditing = false;
    currentFieldId: number | null = null;

    fieldForm: CustomFieldDefinition = this.getEmptyForm();

    fieldTypes = ['TEXT', 'NUMBER', 'DATE', 'SELECT', 'BOOLEAN'];
    entityTypes = ['SEGMENT', 'PROJECT', 'SUBCONTRACTOR'];

    // For multi-select checkboxes
    selectedEntityTypes: { [key: string]: boolean } = {};

    constructor(private fieldService: CustomFieldService) { }

    ngOnInit() {
        this.loadFields();
    }

    loadFields() {
        this.loading = true;
        this.error = null;
        this.fieldService.getAllFields().subscribe({
            next: (data) => {
                this.fields = data;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load fields';
                this.loading = false;
            }
        });
    }

    openCreateModal() {
        this.isEditing = false;
        this.currentFieldId = null;
        this.fieldForm = this.getEmptyForm();
        this.initializeEntityTypeSelection();
        this.showModal = true;
    }

    openEditModal(field: CustomFieldDefinition) {
        this.isEditing = true;
        this.currentFieldId = field.id!;
        this.fieldForm = { ...field, entityTypes: [...field.entityTypes] };
        this.initializeEntityTypeSelection(field.entityTypes);
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.fieldForm = this.getEmptyForm();
    }

    initializeEntityTypeSelection(selectedTypes?: string[]) {
        this.selectedEntityTypes = {};
        this.entityTypes.forEach(type => {
            this.selectedEntityTypes[type] = selectedTypes ? selectedTypes.includes(type) : false;
        });
    }

    updateEntityTypesFromSelection() {
        this.fieldForm.entityTypes = Object.keys(this.selectedEntityTypes)
            .filter(type => this.selectedEntityTypes[type]);
    }

    saveField() {
        this.updateEntityTypesFromSelection();

        if (!this.fieldForm.fieldKey || !this.fieldForm.label || this.fieldForm.entityTypes.length === 0) {
            this.error = 'Please fill all required fields and select at least one entity type';
            return;
        }

        if (this.isEditing && this.currentFieldId) {
            this.fieldService.updateField(this.currentFieldId, this.fieldForm).subscribe({
                next: () => {
                    this.loadFields();
                    this.closeModal();
                },
                error: (err) => {
                    this.error = 'Failed to update field';
                }
            });
        } else {
            this.fieldService.createField(this.fieldForm).subscribe({
                next: () => {
                    this.loadFields();
                    this.closeModal();
                },
                error: (err) => {
                    this.error = 'Failed to create field';
                }
            });
        }
    }

    deleteField(field: CustomFieldDefinition) {
        if (!confirm(`Delete field "${field.label}"?`)) return;

        this.fieldService.deleteField(field.id!).subscribe({
            next: () => {
                this.loadFields();
            },
            error: (err) => {
                this.error = 'Failed to delete field';
            }
        });
    }

    onLabelChange() {
        // Auto-generate field key from label if not editing
        if (!this.isEditing && this.fieldForm.label) {
            this.fieldForm.fieldKey = this.fieldForm.label
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');
        }
    }

    parseOptionsString(optionsStr: string): string[] {
        return optionsStr.split(',').map(o => o.trim()).filter(o => o.length > 0);
    }

    getOptionsString(): string {
        return this.fieldForm.options?.join(', ') || '';
    }

    setOptionsString(optionsStr: string) {
        this.fieldForm.options = this.parseOptionsString(optionsStr);
    }

    getEntityTypesDisplay(entityTypes: string[]): string {
        return entityTypes.join(', ');
    }

    private getEmptyForm(): CustomFieldDefinition {
        return {
            entityTypes: [],
            fieldKey: '',
            label: '',
            fieldType: 'TEXT',
            isRequired: false,
            uiOrder: 100
        };
    }
}
