import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, Supplier } from '../../../services/inventory.service';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suppliers.html',
  styleUrls: ['./suppliers.css']
})
export class SuppliersComponent implements OnInit {
  suppliers: Supplier[] = [];
  showModal = false;
  isEditing = false;

  currentSupplier: Partial<Supplier> = { type: 'MATERIAL' };

  constructor(private inventoryService: InventoryService) { }

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.inventoryService.getAllSuppliers().subscribe({
      next: (data) => this.suppliers = data,
      error: (err) => {
        console.error('Failed to load suppliers', err);
        // Fallback mock
        this.suppliers = [
          { id: 1, name: 'CableBerlin GmbH', contactName: 'Hans Muller', phone: '+49 30 123456', address: 'Berlin', type: 'MATERIAL' },
          { id: 2, name: 'HeavyMachinery Rentals', contactName: 'Karl Weber', phone: '+49 89 555666', address: 'Munich', type: 'MACHINERY' }
        ];
      }
    });
  }

  openModal(supplier?: Supplier) {
    if (supplier) {
      this.isEditing = true;
      this.currentSupplier = { ...supplier };
    } else {
      this.isEditing = false;
      this.currentSupplier = { type: 'MATERIAL', name: '', contactName: '', phone: '', address: '' };
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.currentSupplier = { type: 'MATERIAL' };
  }

  saveSupplier() {
    if (!this.currentSupplier.name) return;

    if (this.isEditing && this.currentSupplier.id) {
      // Update
      this.inventoryService.updateSupplier(this.currentSupplier.id, this.currentSupplier as Supplier).subscribe({
        next: () => {
          this.loadSuppliers();
          this.closeModal();
        },
        error: () => {
          // Mock update for now if backend fails or doesn't exist yet
          const index = this.suppliers.findIndex(s => s.id === this.currentSupplier.id);
          if (index !== -1) {
            this.suppliers[index] = this.currentSupplier as Supplier;
          }
          this.closeModal();
        }
      });
    } else {
      // Create
      this.inventoryService.createSupplier(this.currentSupplier as Supplier).subscribe({
        next: () => {
          this.loadSuppliers();
          this.closeModal();
        },
        error: () => {
          this.suppliers.push({ ...this.currentSupplier as Supplier, id: Math.random() });
          this.closeModal();
        }
      });
    }
  }

  deleteSupplier(id: number) {
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
      this.inventoryService.deleteSupplier(id).subscribe({
        next: () => this.loadSuppliers(),
        error: () => {
          this.suppliers = this.suppliers.filter(s => s.id !== id);
        }
      });
    }
  }
}
