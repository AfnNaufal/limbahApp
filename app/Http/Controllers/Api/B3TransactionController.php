<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreB3TransactionRequest;
use App\Http\Requests\UpdateB3TransactionRequest;
use App\Http\Resources\B3TransactionResource;
use App\Models\B3Transaction;
use App\Services\B3TransactionService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class B3TransactionController
{
    public function __construct(protected B3TransactionService $service) {}

    /**
     * Get all B3 transactions (paginated with filters)
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->input('per_page', 25);
        $type = $request->input('type'); // IN or OUT
        $status = $request->input('status');
        $search = $request->input('search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $query = B3Transaction::with(['wasteCategory', 'creator', 'updater']);

        // Filter by transaction type
        if ($type && in_array($type, ['IN', 'OUT'])) {
            $query->where('transaction_type', $type);
        }

        // Filter by status
        if ($status) {
            $query->where('status', $status);
        }

        // Search by keyword
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('waste_code', 'like', "%{$search}%")
                  ->orWhere('waste_name', 'like', "%{$search}%")
                  ->orWhere('source', 'like', "%{$search}%")
                  ->orWhere('destination', 'like', "%{$search}%")
                  ->orWhere('transporter', 'like', "%{$search}%")
                  ->orWhere('manifest_number', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            });
        }

        // Filter by date range
        if ($dateFrom) {
            try {
                $query->where('date', '>=', Carbon::parse($dateFrom)->startOfDay());
            } catch (\Throwable $e) {}
        }

        if ($dateTo) {
            try {
                $query->where('date', '<=', Carbon::parse($dateTo)->endOfDay());
            } catch (\Throwable $e) {}
        }

        $transactions = $query->orderBy('date', 'desc')->paginate($perPage);

        return B3TransactionResource::collection($transactions);
    }

    /**
     * Create a new B3 transaction
     */
    public function store(StoreB3TransactionRequest $request): B3TransactionResource
    {
        $transaction = $this->service->createTransaction($request->validated());

        return new B3TransactionResource($transaction->load(['wasteCategory', 'creator', 'updater']));
    }

    /**
     * Get single B3 transaction
     */
    public function show(B3Transaction $b3Transaction): B3TransactionResource
    {
        $transaction = $this->service->getTransaction($b3Transaction->id);

        return new B3TransactionResource($transaction->loadMissing(['wasteCategory', 'creator', 'updater']));
    }

    /**
     * Update a B3 transaction
     */
    public function update(UpdateB3TransactionRequest $request, B3Transaction $b3Transaction): B3TransactionResource
    {
        $transaction = $this->service->updateTransaction($b3Transaction, $request->validated());

        return new B3TransactionResource($transaction->load(['wasteCategory', 'creator', 'updater']));
    }

    /**
     * Delete a B3 transaction
     */
    public function destroy(B3Transaction $b3Transaction): Response
    {
        $this->service->deleteTransaction($b3Transaction);

        return response()->noContent();
    }
}
