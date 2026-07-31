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
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $query = B3Transaction::with('wasteCategory');

        // Filter by transaction type
        if ($type && in_array($type, ['IN', 'OUT'])) {
            $query->where('transaction_type', $type);
        }

        // Filter by status
        if ($status) {
            $query->where('status', $status);
        }

        // Filter by date range
        if ($dateFrom && $dateTo) {
            try {
                $from = Carbon::parse($dateFrom)->startOfDay();
                $to = Carbon::parse($dateTo)->endOfDay();
                $query->whereBetween('date', [$from, $to]);
            } catch (\Throwable $e) {
                // Ignore malformed date format gracefully
            }
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

        return new B3TransactionResource($transaction->load('wasteCategory'));
    }

    /**
     * Get single B3 transaction
     */
    public function show(B3Transaction $b3Transaction): B3TransactionResource
    {
        $transaction = $this->service->getTransaction($b3Transaction->id);

        return new B3TransactionResource($transaction);
    }

    /**
     * Update a B3 transaction
     */
    public function update(UpdateB3TransactionRequest $request, B3Transaction $b3Transaction): B3TransactionResource
    {
        $transaction = $this->service->updateTransaction($b3Transaction, $request->validated());

        return new B3TransactionResource($transaction->load('wasteCategory'));
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
