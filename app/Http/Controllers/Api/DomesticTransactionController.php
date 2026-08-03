<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreDomesticTransactionRequest;
use App\Http\Requests\UpdateDomesticTransactionRequest;
use App\Http\Resources\DomesticTransactionResource;
use App\Models\DomesticTransaction;
use App\Services\DomesticTransactionService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class DomesticTransactionController
{
    public function __construct(protected DomesticTransactionService $service) {}

    /**
     * Get all domestic transactions (paginated with filters)
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->input('per_page', 25);
        $movementType = $request->input('movement_type'); // IN or OUT
        $session = $request->input('session'); // MORNING or AFTERNOON
        $status = $request->input('status');
        $search = $request->input('search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $query = DomesticTransaction::query();

        // Filter by movement type
        if ($movementType && in_array($movementType, ['IN', 'OUT'])) {
            $query->where('movement_type', $movementType);
        }

        // Filter by session
        if ($session && in_array($session, ['MORNING', 'AFTERNOON'])) {
            $query->where('session', $session);
        }

        // Filter by status
        if ($status) {
            $query->where('status', $status);
        }

        // Search by keyword
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('pic_name', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhere('processing_method', 'like', "%{$search}%")
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

        return DomesticTransactionResource::collection($transactions);
    }

    /**
     * Create a new domestic transaction
     */
    public function store(StoreDomesticTransactionRequest $request): DomesticTransactionResource
    {
        $transaction = $this->service->createTransaction($request->validated());

        return new DomesticTransactionResource($transaction);
    }

    /**
     * Get single domestic transaction
     */
    public function show(DomesticTransaction $domesticTransaction): DomesticTransactionResource
    {
        $transaction = $this->service->getTransaction($domesticTransaction->id);

        return new DomesticTransactionResource($transaction);
    }

    /**
     * Update a domestic transaction
     */
    public function update(UpdateDomesticTransactionRequest $request, DomesticTransaction $domesticTransaction): DomesticTransactionResource
    {
        $transaction = $this->service->updateTransaction($domesticTransaction, $request->validated());

        return new DomesticTransactionResource($transaction);
    }

    /**
     * Delete a domestic transaction
     */
    public function destroy(DomesticTransaction $domesticTransaction): Response
    {
        $this->service->deleteTransaction($domesticTransaction);

        return response()->noContent();
    }
}
