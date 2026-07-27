<?php

namespace App\Services;

use App\Models\DomesticTransaction;
use Carbon\Carbon;
use Illuminate\Pagination\Paginator;

class DomesticTransactionService
{
    /**
     * Create a new domestic transaction
     */
    public function createTransaction(array $data): DomesticTransaction
    {
        return DomesticTransaction::create($data);
    }

    /**
     * Update an existing domestic transaction
     */
    public function updateTransaction(DomesticTransaction $transaction, array $data): DomesticTransaction
    {
        $transaction->update($data);
        return $transaction;
    }

    /**
     * Get today's transactions
     */
    public function getTodayTransactions(): array
    {
        return DomesticTransaction::today()
            ->orderBy('session', 'asc')
            ->get()
            ->toArray();
    }

    /**
     * Get transactions by date range and optional session
     */
    public function getByDateRange(Carbon $from, Carbon $to, ?string $session = null, int $perPage = 25)
    {
        $query = DomesticTransaction::byDateRange($from, $to);

        if ($session && in_array($session, ['MORNING', 'AFTERNOON'])) {
            $query->bySession($session);
        }

        return $query->orderBy('date', 'desc')
            ->paginate($perPage);
    }

    /**
     * Calculate daily statistics for a specific date
     */
    public function calculateDailyStats(Carbon $date): array
    {
        $transactions = DomesticTransaction::whereDate('date', $date)->get();

        $organicTotal = 0;
        $inorganicTotal = 0;

        foreach ($transactions as $transaction) {
            $organicTotal += $transaction->organic_weight_kg;
            $inorganicTotal += $transaction->inorganic_weight_kg;
        }

        return [
            'date' => $date->format('Y-m-d'),
            'organic_kg' => (float) $organicTotal,
            'inorganic_kg' => (float) $inorganicTotal,
            'total_kg' => (float) ($organicTotal + $inorganicTotal),
            'transaction_count' => $transactions->count(),
            'morning_count' => $transactions->where('session', 'MORNING')->count(),
            'afternoon_count' => $transactions->where('session', 'AFTERNOON')->count(),
        ];
    }

    /**
     * Get statistics for date range
     */
    public function getStatsByDateRange(Carbon $from, Carbon $to): array
    {
        $transactions = DomesticTransaction::byDateRange($from, $to)->get();

        $organicTotal = 0;
        $inorganicTotal = 0;

        foreach ($transactions as $transaction) {
            $organicTotal += $transaction->organic_weight_kg;
            $inorganicTotal += $transaction->inorganic_weight_kg;
        }

        return [
            'date_from' => $from->format('Y-m-d'),
            'date_to' => $to->format('Y-m-d'),
            'organic_kg' => (float) $organicTotal,
            'inorganic_kg' => (float) $inorganicTotal,
            'total_kg' => (float) ($organicTotal + $inorganicTotal),
            'transaction_count' => $transactions->count(),
            'morning_count' => $transactions->where('session', 'MORNING')->count(),
            'afternoon_count' => $transactions->where('session', 'AFTERNOON')->count(),
            'avg_daily_weight' => $transactions->count() > 0 
                ? round(($organicTotal + $inorganicTotal) / $transactions->count(), 2)
                : 0,
        ];
    }

    /**
     * Get overall statistics
     */
    public function getStatistics(): array
    {
        $allTransactions = DomesticTransaction::all();
        $organicTotal = 0;
        $inorganicTotal = 0;

        foreach ($allTransactions as $transaction) {
            $organicTotal += $transaction->organic_weight_kg;
            $inorganicTotal += $transaction->inorganic_weight_kg;
        }

        return [
            'total_count' => $allTransactions->count(),
            'morning_count' => $allTransactions->where('session', 'MORNING')->count(),
            'afternoon_count' => $allTransactions->where('session', 'AFTERNOON')->count(),
            'organic_total_kg' => (float) $organicTotal,
            'inorganic_total_kg' => (float) $inorganicTotal,
            'total_weight_kg' => (float) ($organicTotal + $inorganicTotal),
            'verified_count' => $allTransactions->where('status', 'VERIFIED')->count(),
            'draft_count' => $allTransactions->where('status', 'DRAFT')->count(),
        ];
    }

    /**
     * Get recent transactions
     */
    public function getRecentTransactions(int $limit = 5)
    {
        return DomesticTransaction::orderBy('date', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get transactions by status
     */
    public function getByStatus(string $status, int $perPage = 25)
    {
        return DomesticTransaction::byStatus($status)
            ->orderBy('date', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get transactions by session
     */
    public function getBySession(string $session, int $perPage = 25)
    {
        return DomesticTransaction::bySession($session)
            ->orderBy('date', 'desc')
            ->paginate($perPage);
    }

    /**
     * Delete a transaction
     */
    public function deleteTransaction(DomesticTransaction $transaction): bool
    {
        return (bool) $transaction->delete();
    }

    /**
     * Get single transaction
     */
    public function getTransaction(int $id): ?DomesticTransaction
    {
        return DomesticTransaction::find($id);
    }

    /**
     * Get today's organic waste total
     */
    public function getTodayOrganicTotal(): float
    {
        return (float) DomesticTransaction::today()->sum('organic_weight_kg');
    }

    /**
     * Get today's inorganic waste total
     */
    public function getTodayInorganicTotal(): float
    {
        return (float) DomesticTransaction::today()->sum('inorganic_weight_kg');
    }

    /**
     * Get today's total waste
     */
    public function getTodayTotalWeight(): float
    {
        return (float) DomesticTransaction::today()->sum('total_weight_kg');
    }
}
