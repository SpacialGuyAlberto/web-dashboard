import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Machine, ProjectAllocation, Supplier, Material } from './inventory.model';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    // Session Keys
    private readonly MACHINES_KEY = 'inventory_machines';
    private readonly MATERIALS_KEY = 'inventory_materials';
    private readonly SUPPLIERS_KEY = 'inventory_suppliers';

    constructor(private http: HttpClient) {
        this.initializeMockData();
    }

    private initializeMockData() {
        if (!sessionStorage.getItem(this.MACHINES_KEY)) {
            const mockMachines: Machine[] = [
                { id: 1, serialNumber: 'EX-200', name: 'Excavator X200', type: 'Exavator', status: 'AVAILABLE', currentLocation: 'Site A' },
                { id: 2, serialNumber: 'BD-01', name: 'Bulldozer B1', type: 'Bulldozer', status: 'IN_USE', currentLocation: 'Site B', assignedCrewId: 101 },
                { id: 3, serialNumber: 'CR-5000', name: 'Crane 5000', type: 'Crane', status: 'MAINTENANCE', currentLocation: 'Workshop' },
                { id: 4, serialNumber: 'DT-D4', name: 'Dump Truck D4', type: 'Truck', status: 'AVAILABLE', currentLocation: 'Site A' }
            ];
            sessionStorage.setItem(this.MACHINES_KEY, JSON.stringify(mockMachines));
        }

        if (!sessionStorage.getItem(this.MATERIALS_KEY)) {
            const mockMaterials: Material[] = [
                { id: 1, sku: 'CEM-001', name: 'Portland Cement', unit: 'Bags', quantityOnHand: 500, minThreshold: 50, reorderMode: 'AUTOMATIC', unitPrice: 15.50, warehouseLocation: 'Zone A' },
                { id: 2, sku: 'ST-B-10', name: 'Steel Beams 10ft', unit: 'Pieces', quantityOnHand: 120, minThreshold: 20, reorderMode: 'MANUAL', unitPrice: 200.00, warehouseLocation: 'Zone B' },
                { id: 3, sku: 'BRK-RED', name: 'Red Bricks', unit: 'Pallets', quantityOnHand: 75, minThreshold: 10, reorderMode: 'AUTOMATIC', unitPrice: 120.00, warehouseLocation: 'Zone C' }
            ];
            sessionStorage.setItem(this.MATERIALS_KEY, JSON.stringify(mockMaterials));
        }

        if (!sessionStorage.getItem(this.SUPPLIERS_KEY)) {
            const mockSuppliers: Supplier[] = [
                { id: 1, name: 'MegaBuild Supply', contactName: 'John Doe', phone: '555-0101', type: 'BOTH', email: 'sales@megabuild.com' },
                { id: 2, name: 'SteelWorks Inc', contactName: 'Jane Smith', phone: '555-0202', type: 'MATERIAL', email: 'contact@steelworks.com' }
            ];
            sessionStorage.setItem(this.SUPPLIERS_KEY, JSON.stringify(mockSuppliers));
        }
    }

    // Helper to get from session
    private get<T>(key: string): T[] {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    // Helper to save to session
    private save<T>(key: string, data: T[]): void {
        sessionStorage.setItem(key, JSON.stringify(data));
    }

    // Machinery
    getAllMachines(): Observable<Machine[]> {
        return this.http.get<Machine[]>('http://localhost:8080/api/inventory/machines').pipe(
            catchError(err => {
                console.warn('Backend API failed for machines, falling back to mock.', err);
                return of(this.get<Machine>(this.MACHINES_KEY));
            })
        );
    }

    createMachine(machine: Machine): Observable<Machine> {
        const machines = this.get<Machine>(this.MACHINES_KEY);
        machine.id = Math.floor(Math.random() * 10000);
        machines.push(machine);
        this.save(this.MACHINES_KEY, machines);
        return of(machine);
    }

    updateMachineStatus(id: number, status: string, location?: string): Observable<Machine> {
        const machines = this.get<Machine>(this.MACHINES_KEY);
        const index = machines.findIndex(m => m.id === id);
        if (index !== -1) {
            machines[index].status = status as any;
            if (location) machines[index].currentLocation = location;
            this.save(this.MACHINES_KEY, machines);
            return of(machines[index]);
        }
        throw new Error('Machine not found');
    }

    // Materials
    getAllMaterials(): Observable<Material[]> {
        return of(this.get<Material>(this.MATERIALS_KEY));
    }

    updateStock(id: number, quantityChange: number): Observable<Material> {
        const materials = this.get<Material>(this.MATERIALS_KEY);
        const index = materials.findIndex(m => m.id === id);
        if (index !== -1) {
            materials[index].quantityOnHand += quantityChange;
            this.save(this.MATERIALS_KEY, materials);
            return of(materials[index]);
        }
        throw new Error('Material not found');
    }

    // Suppliers
    getAllSuppliers(): Observable<Supplier[]> {
        return of(this.get<Supplier>(this.SUPPLIERS_KEY));
    }

    getProjectMaterials(projectId: number): Observable<any[]> {
        const materials = this.get<Material>(this.MATERIALS_KEY);
        // Filter materials that have an allocation for this project
        const allocatedMaterials = materials
            .filter(m => m.projectAllocations?.some(pa => pa.projectId === projectId.toString()))
            .map(m => {
                const allocation = m.projectAllocations?.find(pa => pa.projectId === projectId.toString());
                return {
                    materialId: m.id,
                    sku: m.sku,
                    name: m.name,
                    unit: m.unit,
                    quantityAllocated: allocation?.quantityAllocated || 0,
                    status: (allocation?.quantityAllocated || 0) > (m.quantityOnHand) ? 'SHORTAGE' : 'AVAILABLE'
                };
            });
        return of(allocatedMaterials);
    }

    getSupplier(id: number): Observable<Supplier> {
        const suppliers = this.get<Supplier>(this.SUPPLIERS_KEY);
        const supplier = suppliers.find(s => s.id === id);
        return supplier ? of(supplier) : of({} as Supplier);
    }

    createSupplier(supplier: Supplier): Observable<Supplier> {
        const suppliers = this.get<Supplier>(this.SUPPLIERS_KEY);
        supplier.id = Math.floor(Math.random() * 10000);
        suppliers.push(supplier);
        this.save(this.SUPPLIERS_KEY, suppliers);
        return of(supplier);
    }

    updateSupplier(id: number, supplier: Supplier): Observable<Supplier> {
        const suppliers = this.get<Supplier>(this.SUPPLIERS_KEY);
        const index = suppliers.findIndex(s => s.id === id);
        if (index !== -1) {
            suppliers[index] = { ...suppliers[index], ...supplier };
            this.save(this.SUPPLIERS_KEY, suppliers);
            return of(suppliers[index]);
        }
        throw new Error('Supplier not found');
    }

    deleteSupplier(id: number): Observable<void> {
        let suppliers = this.get<Supplier>(this.SUPPLIERS_KEY);
        suppliers = suppliers.filter(s => s.id !== id);
        this.save(this.SUPPLIERS_KEY, suppliers);
        return of(void 0);
    }
}
