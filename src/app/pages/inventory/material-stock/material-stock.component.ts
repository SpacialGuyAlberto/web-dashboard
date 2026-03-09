import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, Material, Supplier } from '../../../services/inventory.service';
import { ToastService } from '../../../services/toast.service';

@Component({
    selector: 'app-material-stock',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './material-stock.component.html'
})
export class MaterialStockComponent implements OnInit {
    materials: Material[] = [];
    suppliers: Supplier[] = [];

    // Order Modal State
    showOrderModal = false;
    currentMaterialForOrder: Material | null = null;
    orderQuantity = 0;
    orderStats = {
        projectDemand: 0,
        safetyStockNeed: 0,
        activeProjects: [] as string[]
    };

    constructor(
        private inventoryService: InventoryService,
        private toastService: ToastService
    ) { }

    showNewMaterialModal = false;
    newMaterial: Partial<Material> = { reorderMode: 'MANUAL', unit: 'Unidades' };

    ngOnInit() {
        this.loadMaterials();
        this.loadSuppliers();
    }

    loadSuppliers() {
        this.inventoryService.getAllSuppliers().subscribe({
            next: (data) => this.suppliers = data,
            error: (err) => console.error('Failed to load suppliers', err)
        });
    }

    loadMaterials() {
        this.inventoryService.getAllMaterials().subscribe({
            next: (data) => {
                this.materials = data.map(m => ({
                    ...m,
                    unitPrice: m.unitPrice ?? (m.sku.includes('FIB') ? 1.50 : m.sku.includes('DUCT') ? 0.80 : 10.0)
                }));
            },
            error: (err) => {
                console.error('Failed to load materials', err);
                // Fallback mock data with new fields
                this.materials = [
                    {
                        sku: 'FIB-OD-144',
                        name: 'Cable Fibra Óptica 144 FO',
                        unit: 'Metros',
                        quantityOnHand: 450,
                        minThreshold: 1000,
                        warehouseLocation: 'A-01',
                        reorderMode: 'AUTOMATIC',
                        unitPrice: 1.50,
                        supplier: { name: 'CableBerlin GmbH', contactName: 'Hans Muller', phone: '+49 30 123456', address: 'Alexanderplatz 1, Berlin', type: 'MATERIAL' },
                        projectAllocations: [{ projectId: '1', projectName: 'Berlin Mitte', quantityAllocated: 200 }]
                    },
                    {
                        sku: 'DUCT-40MM',
                        name: 'Microducto 40mm',
                        unit: 'Metros',
                        quantityOnHand: 2500,
                        minThreshold: 500,
                        warehouseLocation: 'B-12',
                        reorderMode: 'MANUAL',
                        unitPrice: 0.80,
                        supplier: { name: 'PipeMaster Munich', contactName: 'Fritz Klein', phone: '+49 89 987654', address: 'Industriepark 5, München', type: 'MATERIAL' },
                        projectAllocations: []
                    },
                    {
                        sku: 'ARQ-H-TP1',
                        name: 'Arqueta Tipo H',
                        unit: 'Unidades',
                        quantityOnHand: 8,
                        minThreshold: 10,
                        warehouseLocation: 'C-05',
                        reorderMode: 'MANUAL',
                        unitPrice: 120.00,
                        supplier: { name: 'ConcreteWorks', contactName: 'Sarah Conner', phone: '+49 40 555111', address: 'Hafen City, Hamburg', type: 'MATERIAL' },
                        projectAllocations: []
                    },
                    {
                        sku: 'SPL-1X8',
                        name: 'Splitter Óptico 1x8',
                        unit: 'Unidades',
                        quantityOnHand: 150,
                        minThreshold: 50,
                        warehouseLocation: 'A-04',
                        reorderMode: 'AUTOMATIC',
                        unitPrice: 15.00,
                        supplier: { name: 'TechOptics', contactName: 'Johan Liebert', phone: '+49 69 444333', address: 'Frankfurt Tech Park', type: 'MATERIAL' },
                        projectAllocations: []
                    }
                ];
            }
        });
    }

    get hasLowStock(): boolean {
        return this.materials.some(m => m.quantityOnHand < m.minThreshold);
    }

    toggleReorderMode(material: Material) {
        material.reorderMode = material.reorderMode === 'MANUAL' ? 'AUTOMATIC' : 'MANUAL';
        this.toastService.info(`Modo de reorden para ${material.name} cambiado a ${material.reorderMode}`);
    }

    openNewMaterialModal() {
        this.showNewMaterialModal = true;
    }

    closeNewMaterialModal() {
        this.showNewMaterialModal = false;
        this.newMaterial = { reorderMode: 'MANUAL', unit: 'Unidades', unitPrice: 0 };
    }

    saveNewMaterial() {
        if (this.newMaterial.name && this.newMaterial.sku) {
            const materialToAdd: Material = {
                ...this.newMaterial as Material,
                quantityOnHand: this.newMaterial.quantityOnHand || 0,
                minThreshold: this.newMaterial.minThreshold || 0,
                unitPrice: this.newMaterial.unitPrice || 0,
                projectAllocations: [] // Init empty
            };
            this.materials.push(materialToAdd);
            this.toastService.success(`Material ${materialToAdd.name} registrado correctamente`);
            this.closeNewMaterialModal();
        }
    }
    // --- Smart Order Logic ---

    openOrderModal(material: Material) {
        this.currentMaterialForOrder = material;

        // 1. Calculate Demand from Projects
        const projectDemand = material.projectAllocations?.reduce((sum, p) => sum + p.quantityAllocated, 0) || 0;
        const projectNames = material.projectAllocations?.map(p => p.projectName) || [];

        // 2. Calculate Safety Stock Need (Aim for 1.5x Threshold)
        const targetStock = material.minThreshold * 1.5;
        const safetyStockNeed = Math.max(0, targetStock - material.quantityOnHand);

        // 3. Smart Suggestion
        const suggestion = Math.max(projectDemand, safetyStockNeed, material.minThreshold); // ensure at least minThreshold batch

        this.orderStats = {
            projectDemand,
            safetyStockNeed: Math.round(safetyStockNeed),
            activeProjects: projectNames
        };

        this.orderQuantity = Math.round(suggestion);
        this.showOrderModal = true;
    }

    closeOrderModal() {
        this.showOrderModal = false;
        this.currentMaterialForOrder = null;
    }

    confirmOrder() {
        if (!this.currentMaterialForOrder) return;

        // In a real app, this would call an API
        this.toastService.success(
            `Pedido de ${this.orderQuantity} ${this.currentMaterialForOrder.unit} de ` +
            `${this.currentMaterialForOrder.name} enviado a ${this.currentMaterialForOrder.supplier?.name || 'Proveedor'}`
        );
        this.closeOrderModal();
    }
}
