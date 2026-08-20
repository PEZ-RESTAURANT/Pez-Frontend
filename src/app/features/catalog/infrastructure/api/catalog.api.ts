import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { BaseApiService } from '../../../../core/http/base-api.service';
import { Observable } from 'rxjs';

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: String;
  price: number;
  category?: Category;
  estimatedPrepTimeMinutes?: number;
  active: boolean;
}

export interface Supply {
  id: number;
  name: string;
  unit?: string;
  currentStock: number;
  minThreshold: number;
  criticalThreshold?: number;
  stockLevel?: string;
}

export interface RecipeItem {
  id: number;
  productId: number;
  supplyId: number;
  supplyName: string;
  supplyUnit?: string;
  quantityUsed: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogApi extends BaseApiService {

  // --- CATEGORIES ---
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  createCategory(name: string): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, { name });
  }

  updateCategory(id: number, name: string): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/categories/${id}`, { name });
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`);
  }

  // --- PRODUCTS ---
  getProducts(name?: string, categoryId?: number): Observable<Product[]> {
    let params = new HttpParams();
    if (name) {
      params = params.set('name', name);
    }
    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }
    return this.http.get<Product[]>(`${this.baseUrl}/products`, { params });
  }

  createProduct(name: string, price: number, categoryId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/products`, { name, price, categoryId });
  }

  updateProduct(id: number, name: string, price: number, categoryId: number, estimatedPrepTimeMinutes?: number, active?: boolean): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/products/${id}`, {
      name,
      price,
      categoryId,
      estimatedPrepTimeMinutes,
      active
    });
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${id}`);
  }

  getProductKitchenZone(productId: number): Observable<{ zoneId?: number }> {
    return this.http.get<{ zoneId?: number }>(`${this.baseUrl}/products/${productId}/kitchen-zone`);
  }

  assignProductKitchenZone(productId: number, zoneId: number | null): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/products/${productId}/kitchen-zone`, { zoneId });
  }

  // --- SUPPLIES ---
  getSupplies(): Observable<Supply[]> {
    return this.http.get<Supply[]>(`${this.baseUrl}/supplies`);
  }

  createSupply(name: string, unit: string, minThreshold: number, criticalThreshold?: number): Observable<Supply> {
    return this.http.post<Supply>(`${this.baseUrl}/supplies`, { name, unit, minThreshold, criticalThreshold });
  }

  updateSupply(id: number, name: string, unit: string, minThreshold: number, criticalThreshold?: number): Observable<Supply> {
    return this.http.put<Supply>(`${this.baseUrl}/supplies/${id}`, { name, unit, minThreshold, criticalThreshold });
  }

  deleteSupply(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/supplies/${id}`);
  }

  // --- STOCK MOVEMENTS ---
  restockSupply(id: number, quantity: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/inventory/supplies/${id}/restock`, { quantity });
  }

  adjustSupply(id: number, quantity: number, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/inventory/supplies/${id}/adjust`, { quantity, reason });
  }

  // --- RECIPES ---
  getRecipe(productId: number): Observable<RecipeItem[]> {
    return this.http.get<RecipeItem[]>(`${this.baseUrl}/products/${productId}/recipe`);
  }

  addRecipeItem(productId: number, supplyId: number, quantityUsed: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/products/${productId}/recipe`, { supplyId, quantityUsed });
  }

  updateRecipeItem(productId: number, supplyId: number, quantityUsed: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/products/${productId}/recipe`, { supplyId, quantityUsed });
  }

  deleteRecipeItem(productId: number, supplyId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${productId}/recipe`, {
      params: new HttpParams().set('supplyId', supplyId.toString())
    });
  }
}
