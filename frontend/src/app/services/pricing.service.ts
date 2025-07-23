import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PriceResponse {
    nodes_count: number;
    price_usd: number;
    currency: string;
    response_time_ms: string;
}

export interface AllPricesResponse {
    pricing_options: { [key: number]: number };
    currency: string;
    total_options: number;
}

@Injectable({
    providedIn: 'root'
})
export class PricingService {
    private readonly baseUrl = environment.apiUrl || 'http://localhost:8000/api';

    // Cache current price for UI display
    private currentPriceSubject = new BehaviorSubject<PriceResponse | null>(null);
    public currentPrice$ = this.currentPriceSubject.asObservable();

    constructor(private http: HttpClient) { }

    /**
     * Get price for specific number of nodes
     * @param nodesCount Number of nodes
     * @returns Observable of price response
     */
    getPriceByNodes(nodesCount: number): Observable<PriceResponse> {
        const url = `${this.baseUrl}/pricing/nodes/${nodesCount}`;

        return this.http.get<PriceResponse>(url).pipe(
            tap(price => {
                console.log(`💰 Price fetched for ${nodesCount} nodes: $${price.price_usd}`);
                this.currentPriceSubject.next(price);
            }),
            catchError(error => {
                console.error('Error fetching price:', error);
                this.currentPriceSubject.next(null);
                return throwError(() => error);
            })
        );
    }

    /**
     * Get all available pricing options
     * @returns Observable of all prices
     */
    getAllPrices(): Observable<AllPricesResponse> {
        const url = `${this.baseUrl}/pricing/all`;

        return this.http.get<AllPricesResponse>(url).pipe(
            tap(prices => {
                console.log('📊 All prices loaded:', prices.pricing_options);
            }),
            catchError(error => {
                console.error('Error fetching all prices:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Get available node counts
     * @returns Observable of available node configurations
     */
    getAvailableNodeCounts(): Observable<{ available_node_counts: number[], total_options: number, message: string }> {
        const url = `${this.baseUrl}/pricing/nodes`;

        return this.http.get<{ available_node_counts: number[], total_options: number, message: string }>(url).pipe(
            catchError(error => {
                console.error('Error fetching available node counts:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Clear current price cache
     */
    clearCurrentPrice(): void {
        this.currentPriceSubject.next(null);
    }

    /**
     * Get current cached price
     */
    getCurrentPrice(): PriceResponse | null {
        return this.currentPriceSubject.value;
    }
} 