<?php

namespace App\Services;

use App\Models\B3Transaction;
use App\Models\Notification;
use App\Models\StorageAlert;
use Carbon\Carbon;
use Illuminate\Pagination\Paginator;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class B3TransactionService
{
    /**
     * Create a new B3 transaction
     */
    public function createTransaction(array $data): B3Transaction
    {
        if (isset($data['scale_photo']) && $data['scale_photo'] instanceof UploadedFile) {
            $data['scale_photo_path'] = $data['scale_photo']->store('scale_photos', 'public');
            unset($data['scale_photo']);
        }

        $transaction = B3Transaction::create($data);

        try {
            $type = ($transaction->transaction_type ?? 'IN') === 'IN' ? 'b3in' : 'b3out';
            $title = ($transaction->transaction_type ?? 'IN') === 'IN' ? 'Transaksi B3 Masuk' : 'Transaksi B3 Keluar';
            $weightFormatted = number_format((float) $transaction->weight_kg, 1, ',', '.');
            $wasteName = $transaction->waste_name ?? 'Limbah B3';

            Notification::create([
                'type' => $type,
                'title' => $title,
                'message' => "Pencatatan {$wasteName} sejumlah {$weightFormatted} kg",
                'reference_type' => 'B3_TRANSACTION',
                'reference_id' => $transaction->id,
                'is_read' => false,
            ]);
        } catch (\Throwable $e) {
            // Non-blocking notification creation fallback
        }

        return $transaction;
    }

    /**
     * Update an existing B3 transaction
     */
    public function updateTransaction(B3Transaction $transaction, array $data): B3Transaction
    {
        if (isset($data['scale_photo']) && $data['scale_photo'] instanceof UploadedFile) {
            if ($transaction->scale_photo_path) {
                Storage::disk('public')->delete($transaction->scale_photo_path);
            }
            $data['scale_photo_path'] = $data['scale_photo']->store('scale_photos', 'public');
            unset($data['scale_photo']);
        }

        $transaction->update($data);
        return $transaction;
    }

    /**
     * Get B3 transactions by date range and type
     */
    public function getByDateRange(Carbon $from, Carbon $to, ?string $type = null, int $perPage = 25)
    {
        $query = B3Transaction::byDateRange($from, $to);

        if ($type && in_array($type, ['IN', 'OUT'])) {
            $query->where('transaction_type', $type);
        }

        return $query->with('wasteCategory')
            ->orderBy('date', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get transactions near deadline (within X days)
     */
    public function getNearDeadlineTransactions(int $days = 7): array
    {
        return B3Transaction::nearDeadline($days)
            ->with('wasteCategory')
            ->orderBy('storage_deadline_at', 'asc')
            ->get()
            ->toArray();
    }

    /**
     * Get expired transactions
     */
    public function getExpiredTransactions(): array
    {
        return B3Transaction::expired()
            ->with('wasteCategory')
            ->orderBy('storage_deadline_at', 'asc')
            ->get()
            ->toArray();
    }

    /**
     * Calculate total weight by transaction type
     */
    public function calculateTotalWeightByType(string $type = 'IN', ?array $dateRange = null): float
    {
        $query = B3Transaction::where('transaction_type', $type);

        if ($dateRange && count($dateRange) === 2) {
            $query->byDateRange($dateRange[0], $dateRange[1]);
        }

        return (float) $query->sum('weight_kg');
    }

    /**
     * Get all pending transactions
     */
    public function getPendingTransactions(int $perPage = 25)
    {
        return B3Transaction::byStatus('PENDING')
            ->with('wasteCategory')
            ->orderBy('date', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get transaction statistics
     */
    public function getStatistics(): array
    {
        return [
            'total_count' => B3Transaction::count(),
            'in_count' => B3Transaction::in()->count(),
            'out_count' => B3Transaction::out()->count(),
            'pending_count' => B3Transaction::byStatus('PENDING')->count(),
            'total_weight_kg' => (float) B3Transaction::sum('weight_kg'),
            'in_weight_kg' => (float) B3Transaction::in()->sum('weight_kg'),
            'out_weight_kg' => (float) B3Transaction::out()->sum('weight_kg'),
        ];
    }

    /**
     * Get recent transactions
     */
    public function getRecentTransactions(int $limit = 5)
    {
        return B3Transaction::with('wasteCategory')
            ->orderBy('date', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Count transactions with specific status
     */
    public function countByStatus(string $status): int
    {
        return B3Transaction::byStatus($status)->count();
    }

    /**
     * Check and create storage alerts for transactions approaching deadline
     */
    public function checkAndCreateStorageAlerts(int $days = 7): int
    {
        $alertsCreated = 0;
        $transactions = B3Transaction::nearDeadline($days)
            ->whereDoesntHave('storageAlerts', function ($query) {
                $query->where('is_active', true);
            })
            ->get();

        foreach ($transactions as $transaction) {
            StorageAlert::create([
                'b3_transaction_id' => $transaction->id,
                'alert_type' => 'STORAGE_NEAR_DEADLINE',
                'deadline_at' => $transaction->storage_deadline_at,
                'is_active' => true,
            ]);

            try {
                Notification::create([
                    'type' => 'alert',
                    'title' => 'Peringatan Masa Simpan B3',
                    'message' => "Penyimpanan " . ($transaction->waste_name ?? 'Limbah B3') . " mendekati batas waktu simpan.",
                    'reference_type' => 'STORAGE_ALERT',
                    'reference_id' => $transaction->id,
                    'is_read' => false,
                ]);
            } catch (\Throwable $e) {
                // Ignore fallback
            }

            $alertsCreated++;
        }

        return $alertsCreated;
    }

    /**
     * Delete a transaction
     */
    public function deleteTransaction(B3Transaction $transaction): bool
    {
        return (bool) $transaction->delete();
    }

    /**
     * Get single transaction with relations
     */
    public function getTransaction(int $id): ?B3Transaction
    {
        return B3Transaction::with([
            'wasteCategory',
            'storageAlerts',
        ])->find($id);
    }

    /**
     * Search transactions
     */
    public function search(string $query): array
    {
        return B3Transaction::where('waste_code', 'like', "%{$query}%")
            ->orWhere('waste_name', 'like', "%{$query}%")
            ->orWhere('manifest_number', 'like', "%{$query}%")
            ->with('wasteCategory')
            ->limit(20)
            ->get()
            ->toArray();
    }
}
